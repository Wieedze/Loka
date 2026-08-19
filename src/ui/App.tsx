import { useReducer } from 'react';
import { engine } from '../audio/engine';
import { journeyReducer } from '../journey/machine';
import { watchVisibility } from '../system/visibility';
import { acquireWakeLock } from '../system/wakeLock';
import { Accueil } from './screens/Accueil';
import { Voyage } from './screens/Voyage';

export function App() {
  const [phase, dispatch] = useReducer(journeyReducer, 'attente');

  const startJourney = async (): Promise<void> => {
    await engine.init();
    void acquireWakeLock();
    watchVisibility();
    engine.playOneShot('accueil').catch(console.error);
    dispatch('COMMENCEMENT');
  };

  if (phase === 'attente') {
    return <Accueil onCommencement={() => startJourney().catch(console.error)} />;
  }
  return <Voyage phase={phase} dispatch={dispatch} />;
}
