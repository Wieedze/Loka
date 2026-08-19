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

// Streamed decoding via <audio>: near-zero RAM, for long tracks
// (ambiances, meditations).
export class StreamPlayer implements Player {
  onEnded: (() => void) | null = null;
  private readonly ctx: AudioContext;
  private readonly audio: HTMLAudioElement;
  private readonly gain: GainNode;
  private readonly ramp: GainRamp;
  private cancelled = false;

  constructor(ctx: AudioContext, url: string, destination: AudioNode, initialGain = 1) {
    this.ctx = ctx;
    this.audio = new Audio(url);
    this.audio.preload = 'auto';
    this.gain = ctx.createGain();
    this.ramp = new GainRamp(this.gain.gain, initialGain);
    ctx.createMediaElementSource(this.audio).connect(this.gain);
    this.gain.connect(destination);
    this.audio.addEventListener('ended', () => this.onEnded?.());
    // A media error would otherwise leave the engine waiting for 'ended'
    // forever, keeping the ambiance ducked for the rest of the session.
    this.audio.addEventListener('error', () => this.onEnded?.());
  }

  async play(fadeInSec = 0): Promise<void> {
    if (fadeInSec > 0) this.ramp.to(0, this.ctx.currentTime, 0);
    await this.audio.play();
    if (fadeInSec > 0 && !this.cancelled) this.ramp.to(1, this.ctx.currentTime, fadeInSec);
  }

  pause(): void {
    this.audio.pause();
  }

  cancelPendingStart(): void {
    this.cancelled = true;
  }

  stop(): void {
    this.cancelled = true;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.gain.disconnect();
  }

  fadeTo(target: number, seconds: number): void {
    this.ramp.to(target, this.ctx.currentTime, seconds);
  }

  gainAt(now: number): number {
    return this.ramp.valueAt(now);
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
export class BufferPlayer implements Player {
  onEnded: (() => void) | null = null;
  private readonly ctx: AudioContext;
  private readonly url: string;
  private readonly gain: GainNode;
  private readonly ramp: GainRamp;
  private source: AudioBufferSourceNode | null = null;
  private cancelled = false;

  constructor(ctx: AudioContext, url: string, destination: AudioNode, initialGain = 1) {
    this.ctx = ctx;
    this.url = url;
    this.gain = ctx.createGain();
    this.ramp = new GainRamp(this.gain.gain, initialGain);
    this.gain.connect(destination);
  }

  async play(fadeInSec = 0): Promise<void> {
    if (fadeInSec > 0) this.ramp.to(0, this.ctx.currentTime, 0);
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
    if (fadeInSec > 0) this.ramp.to(1, this.ctx.currentTime, fadeInSec);
  }

  cancelPendingStart(): void {
    this.cancelled = true;
  }

  stop(): void {
    this.cancelled = true;
    const source = this.source;
    this.source = null;
    source?.stop();
    this.gain.disconnect();
  }

  fadeTo(target: number, seconds: number): void {
    this.ramp.to(target, this.ctx.currentTime, seconds);
  }

  gainAt(now: number): number {
    return this.ramp.valueAt(now);
  }
}
