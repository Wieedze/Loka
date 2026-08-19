// Minimal Web Audio + media stand-in for tests. It records every gain
// automation so a test can assert what is actually audible at a given moment,
// instead of only asserting that a method was called.

interface ParamEvent {
  type: 'set' | 'ramp';
  value: number;
  time: number;
}

export class FakeAudioParam {
  value = 1;
  private events: ParamEvent[] = [];

  cancelScheduledValues(time: number): void {
    this.events = this.events.filter((event) => event.time < time);
  }

  setValueAtTime(value: number, time: number): void {
    this.events.push({ type: 'set', value, time });
  }

  linearRampToValueAtTime(value: number, time: number): void {
    this.events.push({ type: 'ramp', value, time });
  }

  // Value the audio thread would output at `time`, interpolating ramps.
  valueAtTime(time: number): number {
    const events = [...this.events].sort((a, b) => a.time - b.time);
    let current = 1;
    let currentTime = 0;
    for (const event of events) {
      if (event.time <= time) {
        current = event.value;
        currentTime = event.time;
        continue;
      }
      if (event.type === 'ramp') {
        const span = event.time - currentTime;
        if (span <= 0) return event.value;
        return current + (event.value - current) * ((time - currentTime) / span);
      }
      return current;
    }
    return current;
  }
}

export class FakeGainNode {
  readonly gain = new FakeAudioParam();
  connected: unknown = null;
  disconnected = false;

  connect(destination: unknown): void {
    this.connected = destination;
  }

  disconnect(): void {
    this.disconnected = true;
  }
}

export class FakeAudioElement {
  preload = '';
  currentTime = 0;
  duration = 90;
  playing = false;
  playCalls = 0;
  failPlay: Error | null = null;
  /** When set, play() only resolves once releaseStart() is called. */
  deferStart = false;
  private releaseDeferred: (() => void) | null = null;
  private readonly handlers = new Map<string, Set<() => void>>();

  constructor(readonly src: string) {}

  addEventListener(type: string, handler: () => void): void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler);
    this.handlers.set(type, set);
  }

  play(): Promise<void> {
    this.playCalls += 1;
    if (this.failPlay) return Promise.reject(this.failPlay);
    this.playing = true;
    if (this.deferStart) {
      return new Promise((resolve) => {
        this.releaseDeferred = resolve;
      });
    }
    return Promise.resolve();
  }

  /** Simulate the file finally being buffered and sounding. */
  releaseStart(): void {
    const release = this.releaseDeferred;
    this.releaseDeferred = null;
    release?.();
  }

  pause(): void {
    this.playing = false;
  }

  emit(type: 'ended' | 'error'): void {
    for (const handler of this.handlers.get(type) ?? []) handler();
  }
}

export class FakeBufferSource {
  buffer: unknown = null;
  onended: (() => void) | null = null;
  started = false;
  stopped = false;

  connect(): void {}

  start(): void {
    this.started = true;
  }

  stop(): void {
    this.stopped = true;
  }
}

export class FakeAudioContext {
  currentTime = 0;
  state: 'running' | 'suspended' = 'running';
  readonly destination = { name: 'destination' };
  readonly gains: FakeGainNode[] = [];
  readonly sources: FakeBufferSource[] = [];

  createGain(): FakeGainNode {
    const node = new FakeGainNode();
    this.gains.push(node);
    return node;
  }

  createMediaElementSource(): { connect: () => void } {
    return { connect: () => undefined };
  }

  createBufferSource(): FakeBufferSource {
    const source = new FakeBufferSource();
    this.sources.push(source);
    return source;
  }

  decodeAudioData(): Promise<unknown> {
    return Promise.resolve({ duration: 30 });
  }

  resume(): Promise<void> {
    this.state = 'running';
    return Promise.resolve();
  }
}

export interface FakeAudioEnvironment {
  context: FakeAudioContext;
  elements: FakeAudioElement[];
  /** Advance the audio clock (does not run timers). */
  advance(seconds: number): void;
  /** Last <audio> element created for a file name fragment. */
  elementFor(fragment: string): FakeAudioElement;
  /** Make the next <audio> refuse to play, as iOS does outside a gesture. */
  armPlayFailure(): void;
  /** Make the next <audio> take time to start, as a real file does. */
  armSlowStart(): void;
  /** Gain node created most recently (a player's own gain). */
  lastGain(): FakeGainNode;
  restore(): void;
}

const MANIFEST = {
  version: 1,
  mix: { duckLevel: 0.25, duckInSec: 1.5, duckOutSec: 4, crossfadeSec: 3, voiceFadeSec: 1 },
  tracks: [
    { id: 'accueil', role: 'jingle', title: 'Accueil', file: 'audio/accueil.m4a' },
    { id: 'tfe', role: 'ambiance', title: 'Terre, Feu, Eau', file: 'audio/tfe.m4a', loop: true },
    { id: 'air', role: 'ambiance', title: 'Air', file: 'audio/air.m4a' },
    { id: 'lucidite', role: 'transition', title: 'Lucidité', file: 'audio/lucidite.m4a' },
    { id: 'porte', role: 'transition', title: 'Porte', file: 'audio/porte.m4a' },
    { id: 'renouveau', role: 'ambiance', title: 'Renouveau', file: 'audio/renouveau.m4a' },
    { id: 'cloture', role: 'cloture', title: 'Clôture', file: 'audio/cloture.m4a' },
    { id: 'med-01', role: 'meditation', title: 'Méditation I', file: 'audio/meditations/01.m4a' },
    { id: 'med-02', role: 'meditation', title: 'Méditation II', file: 'audio/meditations/02.m4a' },
    { id: 'mantra-01', role: 'mantra', title: 'Mantra I', file: 'audio/mantras/01.m4a' },
    { id: 'mantra-02', role: 'mantra', title: 'Mantra II', file: 'audio/mantras/02.m4a' },
  ],
};

export function installFakeAudio(): FakeAudioEnvironment {
  const context = new FakeAudioContext();
  const elements: FakeAudioElement[] = [];
  const globals = globalThis as unknown as Record<string, unknown>;
  const saved = {
    AudioContext: globals.AudioContext,
    Audio: globals.Audio,
    fetch: globals.fetch,
    window: globals.window,
  };

  globals.AudioContext = function AudioContextStub(): FakeAudioContext {
    return context;
  };
  let armedFailure = false;
  let armedSlowStart = false;
  globals.Audio = function AudioStub(src: string): FakeAudioElement {
    const element = new FakeAudioElement(src);
    if (armedFailure) {
      element.failPlay = new Error('NotAllowedError');
      armedFailure = false;
    }
    if (armedSlowStart) {
      element.deferStart = true;
      armedSlowStart = false;
    }
    elements.push(element);
    return element;
  };
  globals.fetch = (url: string): Promise<unknown> =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MANIFEST),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      url,
    });
  globals.window = globalThis;

  return {
    context,
    elements,
    advance(seconds) {
      context.currentTime += seconds;
    },
    elementFor(fragment) {
      const found = [...elements].reverse().find((element) => element.src.includes(fragment));
      if (!found) throw new Error(`No <audio> created for "${fragment}"`);
      return found;
    },
    armPlayFailure() {
      armedFailure = true;
    },
    armSlowStart() {
      armedSlowStart = true;
    },
    lastGain() {
      const node = context.gains[context.gains.length - 1];
      if (!node) throw new Error('No gain node created yet');
      return node;
    },
    restore() {
      globals.AudioContext = saved.AudioContext;
      globals.Audio = saved.Audio;
      globals.fetch = saved.fetch;
      globals.window = saved.window;
    },
  };
}

/** Let pending fetch/decode microtasks settle. */
export async function flush(): Promise<void> {
  for (let i = 0; i < 25; i++) await Promise.resolve();
}
