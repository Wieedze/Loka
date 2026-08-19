import { useReducer, useState } from 'react';
import { engine } from '../audio/engine';
import { journeyReducer } from '../journey/machine';
import { watchVisibility } from '../system/visibility';
import { acquireWakeLock } from '../system/wakeLock';
import { Accueil } from './screens/Accueil';
import type { EtatAccueil } from './screens/Accueil';
import { Voyage } from './screens/Voyage';

export function App() {
  const [phase, dispatch] = useReducer(journeyReducer, 'attente');
  const [etat, setEtat] = useState<EtatAccueil>('pret');

  const commencer = (): void => {
    // L'application n'a qu'une porte d'entrée : si elle échoue en silence,
    // il ne reste rien à tenter. Tout échec doit se voir et se réessayer.
    if (etat === 'chargement') return;
    setEtat('chargement');
    engine
      .init()
      .then(() => {
        void acquireWakeLock();
        watchVisibility();
        void engine.playOneShot('accueil');
        setEtat('pret');
        dispatch('COMMENCEMENT');
      })
      .catch(() => setEtat('erreur'));
  };

  if (phase === 'attente') {
    return <Accueil etat={etat} onCommencement={commencer} />;
  }
  return <Voyage phase={phase} dispatch={dispatch} />;
}
