import { describe, expect, it } from 'vitest';
import { FakeAudioParam } from '../testing/fakeAudio';
import { clampGain, GainRamp, loopCrossfadeStart, rampValueAt } from './ramp';

// The fake records automation events; only the scheduling surface matters here.
const asParam = (param: FakeAudioParam): AudioParam => param as unknown as AudioParam;

describe('rampValueAt', () => {
  it('interpolates linearly between the two ends', () => {
    const state = { from: 0, to: 1, startTime: 10, endTime: 14 };
    expect(rampValueAt(state, 10)).toBe(0);
    expect(rampValueAt(state, 11)).toBeCloseTo(0.25);
    expect(rampValueAt(state, 12)).toBeCloseTo(0.5);
    expect(rampValueAt(state, 14)).toBe(1);
  });

  it('holds the ends outside the ramp window', () => {
    const state = { from: 1, to: 0.25, startTime: 5, endTime: 6.5 };
    expect(rampValueAt(state, 0)).toBe(1);
    expect(rampValueAt(state, 100)).toBe(0.25);
  });

  it('reports a settled value when there is no ramp', () => {
    expect(rampValueAt({ from: 0.4, to: 0.4, startTime: 0, endTime: 0 }, 0)).toBe(0.4);
  });
});

describe('clampGain', () => {
  it('keeps gains inside [0, 1] and rejects invalid numbers', () => {
    expect(clampGain(-1)).toBe(0);
    expect(clampGain(2)).toBe(1);
    expect(clampGain(Number.NaN)).toBe(0);
    expect(clampGain(0.3)).toBe(0.3);
  });
});

describe('GainRamp', () => {
  it('schedules a fade the audio thread will actually play', () => {
    const param = new FakeAudioParam();
    const ramp = new GainRamp(asParam(param), 0);

    ramp.to(1, 0, 3);

    expect(param.valueAtTime(0)).toBeCloseTo(0);
    expect(param.valueAtTime(1.5)).toBeCloseTo(0.5);
    expect(param.valueAtTime(3)).toBeCloseTo(1);
  });

  // The bug that silently disabled every fade in the app: scheduling a value
  // and then a ramp at the same instant, reading the param back in between.
  it('survives two fades scheduled at the same instant', () => {
    const param = new FakeAudioParam();
    const ramp = new GainRamp(asParam(param), 1);

    ramp.to(0, 0, 0);
    ramp.to(1, 0, 3);

    expect(param.valueAtTime(0)).toBeCloseTo(0);
    expect(param.valueAtTime(3)).toBeCloseTo(1);
  });

  it('re-targets from the value reached mid-fade, without jumping', () => {
    const param = new FakeAudioParam();
    const ramp = new GainRamp(asParam(param), 1);

    ramp.to(0, 0, 4);
    // Half way down, ask to come back up.
    ramp.to(1, 2, 2);

    expect(ramp.valueAt(2)).toBeCloseTo(0.5);
    expect(param.valueAtTime(2)).toBeCloseTo(0.5);
    expect(param.valueAtTime(3)).toBeCloseTo(0.75);
    expect(param.valueAtTime(4)).toBeCloseTo(1);
  });

  it('applies a zero-second fade immediately', () => {
    const param = new FakeAudioParam();
    const ramp = new GainRamp(asParam(param), 1);

    ramp.to(0.25, 5, 0);

    expect(param.valueAtTime(5)).toBeCloseTo(0.25);
    expect(ramp.valueAt(5)).toBeCloseTo(0.25);
  });
});

describe('loopCrossfadeStart', () => {
  it('starts the crossfade one fade before the end', () => {
    expect(loopCrossfadeStart(90, 3)).toBe(87);
  });

  it('never rotates in the first half, so short files cannot loop in bursts', () => {
    expect(loopCrossfadeStart(4, 3)).toBe(2);
  });

  it('never rotates when the duration is unknown', () => {
    expect(loopCrossfadeStart(Number.NaN, 3)).toBe(Infinity);
    expect(loopCrossfadeStart(0, 3)).toBe(Infinity);
  });
});
