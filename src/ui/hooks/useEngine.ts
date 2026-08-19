import { useSyncExternalStore } from 'react';
import { engine } from '../../audio/engine';
import type { EngineState } from '../../audio/engine';

export function useEngine(): EngineState {
  return useSyncExternalStore(engine.subscribe, engine.getState);
}
