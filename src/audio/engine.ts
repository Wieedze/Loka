import { loadManifest, trackUrl } from '../content/manifest';
import type { Manifest, Track, TrackRole } from '../content/types';
import type { Player } from './players';
import { BufferPlayer, StreamPlayer } from './players';
import { GainRamp, loopCrossfadeStart } from './ramp';

export interface EngineState {
  readonly ambianceId: string | null;
  readonly voiceId: string | null;
  readonly voicePaused: boolean;
  readonly mantraId: string | null;
}

interface Graph {
  ctx: AudioContext;
  ambianceBus: GainNode;
  voiceBus: GainNode;
  mantraBus: GainNode;
  ambianceRamp: GainRamp;
  mantraRamp: GainRamp;
}

interface AmbianceChannel {
  track: Track;
  player: StreamPlayer;
  loopTimer: number | null;
  rotating: boolean;
}

// Spoken content: it must come to the front, so it ducks the rest of the mix.
// Transitions (porte, lucidité) are sound design and play at full level.
const SPOKEN_ROLES: readonly TrackRole[] = ['jingle', 'meditation', 'cloture'];

const STOP_MARGIN_SEC = 0.1;
const LOOP_POLL_MS = 250;
// Re-pressing a button must not leave two copies of the same voice overlapping:
// short enough to read as a cut, long enough not to click.
const CUT_FADE_SEC = 0.06;

export class AudioEngine {
  private graph: Graph | null = null;
  private manifest: Manifest | null = null;
  private ambiance: AmbianceChannel | null = null;
  private voice: StreamPlayer | null = null;
  private mantra: BufferPlayer | null = null;
  private oneShot: { player: BufferPlayer; ducks: boolean } | null = null;
  private state: EngineState = { ambianceId: null, voiceId: null, voicePaused: false, mantraId: null };
  private readonly listeners = new Set<() => void>();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getState = (): EngineState => this.state;

  // Must be called from a user gesture: creates the AudioContext.
  async init(): Promise<void> {
    if (!this.graph) {
      const ctx = new AudioContext();
      const bus = (): GainNode => {
        const node = ctx.createGain();
        node.connect(ctx.destination);
        return node;
      };
      const ambianceBus = bus();
      const mantraBus = bus();
      this.graph = {
        ctx,
        ambianceBus,
        mantraBus,
        voiceBus: bus(),
        ambianceRamp: new GainRamp(ambianceBus.gain, 1),
        mantraRamp: new GainRamp(mantraBus.gain, 1),
      };
    }
    if (!this.manifest) {
      this.manifest = await loadManifest();
    }
    await this.resume();
  }

  // iOS suspends the context when the app goes to the background; without this
  // every button would stay silent for the rest of the session.
  async resume(): Promise<void> {
    const ctx = this.graph?.ctx;
    if (ctx && ctx.state !== 'running') await ctx.resume();
  }

  tracks(role: TrackRole): Track[] {
    return this.manifest?.tracks.filter((track) => track.role === role) ?? [];
  }

  title(id: string): string {
    const track = this.manifest?.tracks.find((t) => t.id === id);
    return track?.title ?? id;
  }

  playAmbiance(id: string): void {
    const { graph, manifest } = this.mustReady();
    const track = this.mustTrack(id);
    // Terre, Feu and Eau all open the same soundtrack: touching them in turn
    // must not stack offset copies of it over each other.
    if (this.ambiance !== null && this.state.ambianceId === id) return;
    const fade = manifest.mix.crossfadeSec;
    if (this.ambiance) this.releaseAmbiance(this.ambiance, fade);

    // Always starts silent: an ambiance never bursts in at full level. The
    // fade is applied by play(), once the file is really sounding.
    const player = new StreamPlayer(graph.ctx, trackUrl(track), graph.ambianceBus, 0);

    const channel: AmbianceChannel = { track, player, loopTimer: null, rotating: false };
    this.attachAmbianceEnd(channel, player);
    if (track.loop === true) {
      channel.loopTimer = window.setInterval(() => void this.rotateLoopIfNeeded(channel), LOOP_POLL_MS);
    }
    this.ambiance = channel;
    this.setState({ ambianceId: id });
    player.play(fade).catch(() => player.onEnded?.());
  }

  // The Porte sequence takes over from the journey ambiance ("prend le relais").
  stopAmbiance(): void {
    const { manifest } = this.mustReady();
    if (!this.ambiance) return;
    this.releaseAmbiance(this.ambiance, manifest.mix.crossfadeSec);
    this.ambiance = null;
    this.setState({ ambianceId: null });
  }

  playVoice(id: string): void {
    const { graph, manifest } = this.mustReady();
    const track = this.mustTrack(id);
    if (this.voice) this.fadeOutAndStop(this.voice, manifest.mix.voiceFadeSec);

    const player = new StreamPlayer(graph.ctx, trackUrl(track), graph.voiceBus);
    player.onEnded = () => {
      if (this.voice !== player) return;
      this.voice = null;
      this.updateDuck(manifest.mix.duckOutSec);
      this.setState({ voiceId: null, voicePaused: false });
    };
    this.voice = player;
    this.updateDuck(manifest.mix.duckInSec);
    this.setState({ voiceId: id, voicePaused: false });
    player.play().catch(() => player.onEnded?.());
  }

  pauseVoice(): void {
    if (!this.voice) return;
    this.voice.pause();
    this.setState({ voicePaused: true });
  }

  resumeVoice(): void {
    const player = this.voice;
    if (!player) return;
    this.setState({ voicePaused: false });
    player.play().catch(() => player.onEnded?.());
  }

  stopVoice(): void {
    const { manifest } = this.mustReady();
    if (!this.voice) return;
    this.fadeOutAndStop(this.voice, manifest.mix.voiceFadeSec);
    this.voice = null;
    this.updateDuck(manifest.mix.duckOutSec);
    this.setState({ voiceId: null, voicePaused: false });
  }

  playMantra(id: string): void {
    const { graph, manifest } = this.mustReady();
    const track = this.mustTrack(id);
    const fade = manifest.mix.crossfadeSec;
    if (this.mantra) this.fadeOutAndStop(this.mantra, fade);

    const player = new BufferPlayer(graph.ctx, trackUrl(track), graph.mantraBus, 0);
    player.onEnded = () => {
      if (this.mantra !== player) return;
      this.mantra = null;
      this.setState({ mantraId: null });
    };
    this.mantra = player;
    this.setState({ mantraId: id });
    player.play(fade).catch(() => player.onEnded?.());
  }

  // Resolves when the track has finished playing (used to chain porte ->
  // renouveau). A one-shot interrupted by a new one never settles, which is
  // what stops an interrupted chain from running twice.
  playOneShot(id: string): Promise<void> {
    const { graph, manifest } = this.mustReady();
    const track = this.mustTrack(id);
    if (this.oneShot) this.fadeOutAndStop(this.oneShot.player, CUT_FADE_SEC);

    const ducks = SPOKEN_ROLES.includes(track.role);
    const player = new BufferPlayer(graph.ctx, trackUrl(track), graph.voiceBus);
    const entry = { player, ducks };
    this.oneShot = entry;
    if (ducks) this.updateDuck(manifest.mix.duckInSec);

    const finish = (): void => {
      if (this.oneShot !== entry) return;
      this.oneShot = null;
      if (ducks) this.updateDuck(manifest.mix.duckOutSec);
    };
    return new Promise((resolve, reject) => {
      player.onEnded = () => {
        finish();
        resolve();
      };
      player.play().catch((error: unknown) => {
        finish();
        reject(error instanceof Error ? error : new Error(String(error)));
      });
    });
  }

  private attachAmbianceEnd(channel: AmbianceChannel, player: StreamPlayer): void {
    player.onEnded = () => {
      if (this.ambiance !== channel || channel.player !== player) return;
      this.stopLoopTimer(channel);
      this.ambiance = null;
      this.setState({ ambianceId: null });
    };
  }

  private async rotateLoopIfNeeded(channel: AmbianceChannel): Promise<void> {
    if (this.ambiance !== channel || channel.rotating) return;
    const { graph, manifest } = this.mustReady();
    const fade = manifest.mix.crossfadeSec;
    const old = channel.player;
    if (old.currentTime < loopCrossfadeStart(old.duration, fade)) return;

    channel.rotating = true;
    const next = new StreamPlayer(graph.ctx, trackUrl(channel.track), graph.ambianceBus, 0);
    try {
      await next.play(fade);
    } catch {
      // Playback started outside a user gesture can be refused (iOS): keep the
      // current player running rather than cutting the ambiance mid-journey.
      next.stop();
      channel.rotating = false;
      return;
    }
    if (this.ambiance !== channel) {
      next.stop();
      channel.rotating = false;
      return;
    }
    this.attachAmbianceEnd(channel, next);
    this.fadeOutAndStop(old, fade);
    channel.player = next;
    channel.rotating = false;
  }

  private releaseAmbiance(channel: AmbianceChannel, fadeSec: number): void {
    this.stopLoopTimer(channel);
    this.fadeOutAndStop(channel.player, fadeSec);
  }

  private stopLoopTimer(channel: AmbianceChannel): void {
    if (channel.loopTimer !== null) {
      window.clearInterval(channel.loopTimer);
      channel.loopTimer = null;
    }
  }

  private fadeOutAndStop(player: Player, fadeSec: number): void {
    player.onEnded = null;
    player.cancelPendingStart();
    player.fadeTo(0, fadeSec);
    window.setTimeout(() => {
      player.stop();
    }, (fadeSec + STOP_MARGIN_SEC) * 1000);
  }

  // Single source of truth for the duck level: several spoken sources can
  // overlap, and the last one to finish must be the one that lifts it.
  private updateDuck(seconds: number): void {
    const { graph, manifest } = this.mustReady();
    const ducked = this.voice !== null || this.oneShot?.ducks === true;
    const target = ducked ? manifest.mix.duckLevel : 1;
    const now = graph.ctx.currentTime;
    graph.ambianceRamp.to(target, now, seconds);
    graph.mantraRamp.to(target, now, seconds);
  }

  private mustReady(): { graph: Graph; manifest: Manifest } {
    if (!this.graph || !this.manifest) throw new Error('AudioEngine not initialized: call init() first');
    return { graph: this.graph, manifest: this.manifest };
  }

  private mustTrack(id: string): Track {
    const track = this.mustReady().manifest.tracks.find((t) => t.id === id);
    if (!track) throw new Error(`Unknown track id: "${id}"`);
    return track;
  }

  private setState(patch: Partial<EngineState>): void {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
}

export const engine = new AudioEngine();
