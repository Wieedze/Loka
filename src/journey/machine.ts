export type Phase = 'attente' | 'commencement' | 'voyage' | 'lucidite' | 'finale' | 'cloture';

export type JourneyEvent = 'COMMENCEMENT' | 'TERRE_FEU_EAU' | 'LUCIDITE' | 'DERNIERE_CASE' | 'CLOTURE';

const ORDER: Record<Phase, number> = {
  attente: 0,
  commencement: 1,
  voyage: 2,
  lucidite: 3,
  finale: 4,
  cloture: 5,
};

interface Rule {
  // Earliest phase from which the event makes sense; pressed earlier, it is
  // ignored. Pressed later, it re-enters its phase ("tout est rattrapable").
  minPhase: Phase;
  target: Phase;
}

const RULES: Record<JourneyEvent, Rule> = {
  COMMENCEMENT: { minPhase: 'attente', target: 'commencement' },
  TERRE_FEU_EAU: { minPhase: 'commencement', target: 'voyage' },
  LUCIDITE: { minPhase: 'voyage', target: 'lucidite' },
  DERNIERE_CASE: { minPhase: 'voyage', target: 'finale' },
  CLOTURE: { minPhase: 'finale', target: 'cloture' },
};

// The step the interface highlights as the expected next move. Nothing is
// locked: any allowed event stays pressable.
const NEXT_EVENT: Record<Phase, JourneyEvent | null> = {
  attente: 'COMMENCEMENT',
  commencement: 'TERRE_FEU_EAU',
  voyage: 'LUCIDITE',
  lucidite: 'DERNIERE_CASE',
  finale: 'CLOTURE',
  cloture: null,
};

export function nextEvent(phase: Phase): JourneyEvent | null {
  return NEXT_EVENT[phase];
}

export function isEventAllowed(phase: Phase, event: JourneyEvent): boolean {
  return ORDER[phase] >= ORDER[RULES[event].minPhase];
}

export function journeyReducer(phase: Phase, event: JourneyEvent): Phase {
  if (!isEventAllowed(phase, event)) return phase;
  return RULES[event].target;
}
