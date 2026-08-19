import { describe, expect, it } from 'vitest';
import { isEventAllowed, journeyReducer, nextEvent } from './machine';
import type { Phase } from './machine';

describe('journeyReducer', () => {
  it('follows the nominal journey', () => {
    let phase: Phase = 'attente';
    phase = journeyReducer(phase, 'COMMENCEMENT');
    expect(phase).toBe('commencement');
    phase = journeyReducer(phase, 'TERRE_FEU_EAU');
    expect(phase).toBe('voyage');
    phase = journeyReducer(phase, 'LUCIDITE');
    expect(phase).toBe('lucidite');
    phase = journeyReducer(phase, 'DERNIERE_CASE');
    expect(phase).toBe('finale');
    phase = journeyReducer(phase, 'CLOTURE');
    expect(phase).toBe('cloture');
  });

  it('ignores senseless transitions', () => {
    expect(journeyReducer('attente', 'DERNIERE_CASE')).toBe('attente');
    expect(journeyReducer('attente', 'LUCIDITE')).toBe('attente');
    expect(journeyReducer('attente', 'TERRE_FEU_EAU')).toBe('attente');
    expect(journeyReducer('commencement', 'LUCIDITE')).toBe('commencement');
    expect(journeyReducer('commencement', 'CLOTURE')).toBe('commencement');
    expect(journeyReducer('voyage', 'CLOTURE')).toBe('voyage');
  });

  it('allows relaunching a past phase', () => {
    expect(journeyReducer('finale', 'TERRE_FEU_EAU')).toBe('voyage');
    expect(journeyReducer('lucidite', 'LUCIDITE')).toBe('lucidite');
    expect(journeyReducer('cloture', 'COMMENCEMENT')).toBe('commencement');
    expect(journeyReducer('cloture', 'DERNIERE_CASE')).toBe('finale');
  });

  it('allows skipping lucidite (permissive)', () => {
    expect(journeyReducer('voyage', 'DERNIERE_CASE')).toBe('finale');
  });

});

describe('isEventAllowed', () => {
  it('gates events on the minimum phase', () => {
    expect(isEventAllowed('attente', 'COMMENCEMENT')).toBe(true);
    expect(isEventAllowed('attente', 'TERRE_FEU_EAU')).toBe(false);
    expect(isEventAllowed('commencement', 'TERRE_FEU_EAU')).toBe(true);
    expect(isEventAllowed('commencement', 'DERNIERE_CASE')).toBe(false);
    expect(isEventAllowed('finale', 'CLOTURE')).toBe(true);
  });
});

describe('nextEvent', () => {
  it('suggests each step of the nominal journey', () => {
    let phase: Phase = 'attente';
    const suggested: (string | null)[] = [];
    for (let step = 0; step < 6; step++) {
      const event = nextEvent(phase);
      suggested.push(event);
      if (event) phase = journeyReducer(phase, event);
    }
    expect(suggested).toEqual([
      'COMMENCEMENT',
      'TERRE_FEU_EAU',
      'LUCIDITE',
      'DERNIERE_CASE',
      'CLOTURE',
      null,
    ]);
  });

  it('only ever suggests an allowed event', () => {
    const phases: Phase[] = ['attente', 'commencement', 'voyage', 'lucidite', 'finale', 'cloture'];
    for (const phase of phases) {
      const event = nextEvent(phase);
      if (event) expect(isEventAllowed(phase, event)).toBe(true);
    }
  });
});
