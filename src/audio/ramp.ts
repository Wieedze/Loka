export interface RampState {
  from: number;
  to: number;
  startTime: number;
  endTime: number;
}

export function clampGain(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function rampValueAt(state: RampState, now: number): number {
  // Checked first so an instantaneous fade (endTime === startTime) settles.
  if (now >= state.endTime) return state.to;
  if (now <= state.startTime) return state.from;
  const progress = (now - state.startTime) / (state.endTime - state.startTime);
  return state.from + (state.to - state.from) * progress;
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

  // Fades from wherever the gain currently is — mid-fade included — to target.
  to(target: number, now: number, seconds: number): void {
    const from = this.valueAt(now);
    const to = clampGain(target);
    const endTime = seconds > 0 ? now + seconds : now;
    this.param.cancelScheduledValues(now);
    this.param.setValueAtTime(from, now);
    if (endTime > now) {
      this.param.linearRampToValueAtTime(to, endTime);
    } else {
      this.param.setValueAtTime(to, now);
    }
    this.state = { from, to, startTime: now, endTime };
  }
}
