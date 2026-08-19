import { useState } from 'react';
import { engine } from '../../audio/engine';
import { isEventAllowed, nextEvent } from '../../journey/machine';
import type { JourneyEvent, Phase } from '../../journey/machine';
import { Glyphe } from '../components/Glyphe';
import { Noeud } from '../components/Noeud';
import { Spirale } from '../components/Spirale';
import { useEngine } from '../hooks/useEngine';

type Panneau = 'meditations' | 'mantras' | null;

interface VoyageProps {
  phase: Phase;
  dispatch: (event: JourneyEvent) => void;
}

// Same orientation as the board: Nord / Est / Sud / Ouest, with the classic
// elemental correspondence the plateau uses (water drops sit at Ouest).
// Terre, Feu and Eau share one soundtrack, so they light up together; Air is
// the passage of Lucidité.
const ELEMENTS = [
  { id: 'terre', label: 'Terre', cardinal: 'N', angle: 0, passage: false },
  { id: 'air', label: 'Air', cardinal: 'E', angle: 90, passage: true },
  { id: 'feu', label: 'Feu', cardinal: 'S', angle: 180, passage: false },
  { id: 'eau', label: 'Eau', cardinal: 'O', angle: 270, passage: false },
] as const;

export function Voyage({ phase, dispatch }: VoyageProps) {
  const state = useEngine();
  const [panneau, setPanneau] = useState<Panneau>(null);
  const attendu = nextEvent(phase);

  const press = (event: JourneyEvent, action: () => void): void => {
    if (!isEventAllowed(phase, event)) return;
    setPanneau(null);
    action();
    dispatch(event);
  };

  const voyageEnCours = state.ambianceId === 'tfe';
  const porteOuverte = isEventAllowed(phase, 'DERNIERE_CASE');
  const clotureOuverte = isEventAllowed(phase, 'CLOTURE');

  const enTrainDeJouer: string[] = [];
  if (state.ambianceId) enTrainDeJouer.push(engine.title(state.ambianceId));
  if (state.voiceId) enTrainDeJouer.push(engine.title(state.voiceId) + (state.voicePaused ? ' — en pause' : ''));
  if (state.mantraId) enTrainDeJouer.push(engine.title(state.mantraId));

  const commencer = (): void => {
    press('COMMENCEMENT', () => {
      void engine.playOneShot('accueil');
    });
  };

  const ouvrirVoyage = (): void => {
    press('TERRE_FEU_EAU', () => engine.playAmbiance('tfe'));
  };

  const passerParAir = (): void => {
    press('LUCIDITE', () => {
      void engine.playOneShot('lucidite');
      engine.playAmbiance('air');
    });
  };

  const franchirLaPorte = (): void => {
    press('DERNIERE_CASE', () => {
      engine.stopAmbiance();
      engine
        .playOneShot('porte')
        .then(() => {
          engine.playAmbiance('renouveau');
        })
        .catch(() => undefined);
    });
  };

  const clore = (): void => {
    press('CLOTURE', () => {
      void engine.playOneShot('cloture');
    });
  };

  return (
    <main className="voyage">
      <div className="mandala">
        <Spirale
          label="Commencement"
          vivante={state.ambianceId !== null || state.voiceId !== null}
          onPress={commencer}
        />

        {ELEMENTS.map((element) => (
          <Noeud
            key={element.id}
            label={element.label}
            cardinal={element.cardinal}
            glyphe={element.id}
            element={element.id}
            angle={element.angle}
            aide={element.passage ? 'passage de Lucidité' : 'bande-son du voyage'}
            actif={element.passage ? state.ambianceId === 'air' : voyageEnCours}
            attendu={attendu === (element.passage ? 'LUCIDITE' : 'TERRE_FEU_EAU')}
            onPress={element.passage ? passerParAir : ouvrirVoyage}
          />
        ))}

        <Noeud
          label="Méditation"
          glyphe="lotus"
          angle={225}
          orbite={0.54}
          petit
          actif={state.voiceId !== null || panneau === 'meditations'}
          onPress={() => setPanneau(panneau === 'meditations' ? null : 'meditations')}
        />

        <Noeud
          label="Mantra"
          glyphe="oreille"
          angle={135}
          orbite={0.54}
          petit
          actif={state.mantraId !== null || panneau === 'mantras'}
          onPress={() => setPanneau(panneau === 'mantras' ? null : 'mantras')}
        />
      </div>

      <div className="seuil" data-visible={porteOuverte}>
        <button type="button" className="seuil-bouton" data-attendu={attendu === 'DERNIERE_CASE'} onClick={franchirLaPorte}>
          <Glyphe name="cle" />
          <span>La Porte</span>
        </button>
        {clotureOuverte && (
          <button type="button" className="seuil-bouton" data-attendu={attendu === 'CLOTURE'} onClick={clore}>
            <Glyphe name="lune" />
            <span>Clôture</span>
          </button>
        )}
      </div>

      <p className="ce-qui-joue" aria-live="polite">
        {enTrainDeJouer.length > 0 ? enTrainDeJouer.join(' · ') : 'Silence'}
      </p>

      {panneau !== null && (
        <section className="panneau" aria-label={panneau === 'meditations' ? 'Méditations' : 'Mantras'}>
          <ul>
            {engine.tracks(panneau === 'meditations' ? 'meditation' : 'mantra').map((track) => (
              <li key={track.id}>
                <button
                  type="button"
                  data-actif={track.id === state.voiceId || track.id === state.mantraId}
                  onClick={() => {
                    if (panneau === 'meditations') engine.playVoice(track.id);
                    else engine.playMantra(track.id);
                    setPanneau(null);
                  }}
                >
                  {track.title ?? track.id}
                </button>
              </li>
            ))}
          </ul>
          {panneau === 'meditations' && state.voiceId !== null && (
            <div className="panneau-controles">
              <button
                type="button"
                onClick={() => (state.voicePaused ? engine.resumeVoice() : engine.pauseVoice())}
              >
                {state.voicePaused ? 'Reprendre' : 'Pause'}
              </button>
              <button type="button" onClick={() => engine.stopVoice()}>
                Arrêter
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
