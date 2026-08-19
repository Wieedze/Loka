export interface RampState {
  from: number;
  /** The real target, which may be a true zero. */
  to: number;
  startTime: number;
  endTime: number;
}

// An exponential ramp is undefined at zero, so fades travel between this floor
// and 1 — about -62 dB, already inaudible — and a true zero is set afterwards.
export const GAIN_FLOOR = 0.0008;
const FLOOR = GAIN_FLOOR;

export function clampGain(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/** Where a ramp aims, kept away from the zero an exponential cannot reach. */
function aimOf(target: number): number {
  return Math.max(FLOOR, clampGain(target));
}

export function rampValueAt(state: RampState, now: number): number {
  // Checked first so an instantaneous fade (endTime === startTime) settles.
  if (now >= state.endTime) return state.to;
  if (now <= state.startTime) return state.from;
  const progress = (now - state.startTime) / (state.endTime - state.startTime);
  const from = Math.max(FLOOR, state.from);
  // Equal steps in dB, which is how loudness is heard.
  return from * Math.pow(aimOf(state.to) / from, progress);
}

// Earliest playback position at which the twin loop player must start its
// crossfade. Never before half the track, so short files cannot re-trigger
// a rotation on every poll.
export function loopCrossfadeStart(durationSec: number, crossfadeSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return Infinity;
  return Math.max(durationSec / 2, durationSec - Math.max(0, crossfadeSec));
}

// Owns one AudioParam and every fade applied to it.
//
// Fades are exponential, not linear: the ear hears loudness logarithmically, so
// a linear ramp sounds like nothing happens and then the sound vanishes at the
// very end — which reads as abrupt however long the fade lasts.
//
// Reading back `param.value` right after scheduling is unreliable (the audio
// thread may not have applied it yet) and `cancelScheduledValues(now)` erases
// an event scheduled at exactly `now` — chaining two calls the naive way
// silently cancels the first, which is why fades must be tracked here instead.
export class GainRamp {
  private readonly param: AudioParam;
  private state: RampState;

  constructor(param: AudioParam, initial: number) {
    const value = clampGain(initial);
    this.param = param;
    this.state = { from: value, to: value, startTime: 0, endTime: 0 };
    param.setValueAtTime(value, 0);
  }

  valueAt(now: number): number {
    return rampValueAt(this.state, now);
  }

  /** Fades from wherever the gain currently is — mid-fade included — to target. */
  to(target: number, now: number, seconds: number): void {
    const from = Math.max(FLOOR, this.valueAt(now));
    const reel = clampGain(target);
    const aim = aimOf(reel);
    const endTime = seconds > 0 ? now + seconds : now;

    this.param.cancelScheduledValues(now);
    this.param.setValueAtTime(from, now);
    if (endTime > now) {
      this.param.exponentialRampToValueAtTime(aim, endTime);
    } else {
      this.param.setValueAtTime(aim, now);
    }
    // The ramp stops just above silence; land on a real zero once it is over.
    if (reel === 0) this.param.setValueAtTime(0, endTime);

    this.state = { from, to: reel, startTime: now, endTime };
  }
}
