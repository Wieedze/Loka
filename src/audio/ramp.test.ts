import { describe, expect, it } from 'vitest';
import { FakeAudioParam } from '../testing/fakeAudio';
import { clampGain, GAIN_FLOOR, GainRamp, loopCrossfadeStart, rampValueAt } from './ramp';

// Défini une rampe exponentielle : à mi-parcours on est à la moyenne
// géométrique des deux bouts, pas à la moyenne arithmétique.
const mediane = (a: number, b: number): number =>
  Math.sqrt(Math.max(a, GAIN_FLOOR) * Math.max(b, GAIN_FLOOR));

// The fake records automation events; only the scheduling surface matters here.
const asParam = (param: FakeAudioParam): AudioParam => param as unknown as AudioParam;

describe('rampValueAt', () => {
  it('progresse par pas égaux en décibels, pas en amplitude', () => {
    const state = { from: 0, to: 1, startTime: 10, endTime: 14 };
    expect(rampValueAt(state, 10)).toBe(0);
    expect(rampValueAt(state, 12)).toBeCloseTo(mediane(0, 1), 4);
    expect(rampValueAt(state, 14)).toBe(1);
    // Chaque quart de temps multiplie le gain par le même facteur.
    const q1 = rampValueAt(state, 11) / rampValueAt(state, 10.0001);
    const q2 = rampValueAt(state, 12) / rampValueAt(state, 11);
    expect(q2).toBeCloseTo(q1, 1);
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

    expect(param.valueAtTime(0)).toBeCloseTo(GAIN_FLOOR, 4);
    expect(param.valueAtTime(1.5)).toBeCloseTo(mediane(0, 1), 4);
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
    const atteint = mediane(1, 0);
    ramp.to(1, 2, 2);

    expect(ramp.valueAt(2)).toBeCloseTo(atteint, 4);
    expect(param.valueAtTime(2)).toBeCloseTo(atteint, 4);
    expect(param.valueAtTime(3)).toBeCloseTo(mediane(atteint, 1), 3);
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
