import { GainRamp } from './ramp';

export interface Player {
  onEnded: (() => void) | null;
  /**
   * Starts playback and fades in over `fadeInSec` *from the moment sound
   * actually begins*. Scheduling the fade earlier would let it elapse while
   * the file is still loading, and the track would appear at full volume.
   */
  play(fadeInSec?: number): Promise<void>;
  stop(): void;
  /** Abandon a start that has been asked for but has not begun yet. */
  cancelPendingStart(): void;
  fadeTo(target: number, seconds: number): void;
}

// Everything a player does with its own volume. Holding it here is what keeps
// the rule above true for every kind of source: a subclass only has to say how
// its sound starts, never when to fade.
abstract class FadingPlayer implements Player {
  onEnded: (() => void) | null = null;
  protected readonly ctx: AudioContext;
  protected readonly gain: GainNode;
  protected cancelled = false;
  private readonly ramp: GainRamp;

  constructor(ctx: AudioContext, destination: AudioNode, initialGain: number) {
    this.ctx = ctx;
    this.gain = ctx.createGain();
    this.ramp = new GainRamp(this.gain.gain, initialGain);
    this.gain.connect(destination);
  }

  /** Begins the sound; resolves once it is really playing. */
  protected abstract begin(): Promise<void>;

  abstract stop(): void;

  async play(fadeInSec = 0): Promise<void> {
    if (fadeInSec > 0) this.fadeTo(0, 0);
    await this.begin();
    if (fadeInSec > 0 && !this.cancelled) this.fadeTo(1, fadeInSec);
  }

  cancelPendingStart(): void {
    this.cancelled = true;
  }

  fadeTo(target: number, seconds: number): void {
    this.ramp.to(target, this.ctx.currentTime, seconds);
  }
}

// Streamed decoding via <audio>: near-zero RAM, for long tracks
// (ambiances, meditations).
export class StreamPlayer extends FadingPlayer {
  private readonly audio: HTMLAudioElement;

  constructor(ctx: AudioContext, url: string, destination: AudioNode, initialGain = 1) {
    super(ctx, destination, initialGain);
    this.audio = new Audio(url);
    this.audio.preload = 'auto';
    ctx.createMediaElementSource(this.audio).connect(this.gain);
    this.audio.addEventListener('ended', () => this.onEnded?.());
    // A media error would otherwise leave the engine waiting for 'ended'
    // forever, keeping the ambiance ducked for the rest of the session.
    this.audio.addEventListener('error', () => this.onEnded?.());
  }

  protected begin(): Promise<void> {
    return this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.cancelled = true;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.gain.disconnect();
  }

  get duration(): number {
    return this.audio.duration;
  }

  get currentTime(): number {
    return this.audio.currentTime;
  }
}

const bufferCache = new Map<string, Promise<AudioBuffer>>();

function loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  let cached = bufferCache.get(url);
  if (!cached) {
    cached = fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`Audio fetch failed: ${url} (HTTP ${response.status})`);
        return response.arrayBuffer();
      })
      .then((bytes) => ctx.decodeAudioData(bytes));
    bufferCache.set(url, cached);
    cached.catch(() => bufferCache.delete(url));
  }
  return cached;
}

// Full in-memory decoding, buffer cached per URL: for short tracks
// (jingle, transitions, mantras, closing message).
export class BufferPlayer extends FadingPlayer {
  private readonly url: string;
  private source: AudioBufferSourceNode | null = null;

  constructor(ctx: AudioContext, url: string, destination: AudioNode, initialGain = 1) {
    super(ctx, destination, initialGain);
    this.url = url;
  }

  protected async begin(): Promise<void> {
    const buffer = await loadBuffer(this.ctx, this.url);
    // A tap that arrives while the buffer is still loading must still be able
    // to cancel it, otherwise the sound starts after being told to stop.
    if (this.cancelled) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain);
    source.onended = () => {
      if (this.source === source) {
        this.source = null;
        this.onEnded?.();
      }
    };
    this.source = source;
    source.start();
  }

  stop(): void {
    this.cancelled = true;
    const source = this.source;
    this.source = null;
    source?.stop();
    this.gain.disconnect();
  }
}
