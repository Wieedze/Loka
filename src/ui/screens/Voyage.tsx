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

  // A step of the journey: ignored when it makes no sense yet, and it always
  // closes whatever panel was open.
  const geste =
    (event: JourneyEvent, jouer: () => void) =>
    (): void => {
      if (!isEventAllowed(phase, event)) return;
      setPanneau(null);
      jouer();
      dispatch(event);
    };

  const commencer = geste('COMMENCEMENT', () => void engine.playOneShot('accueil'));
  const ouvrirVoyage = geste('TERRE_FEU_EAU', () => engine.playAmbiance('tfe'));
  const passerParAir = geste('LUCIDITE', () => {
    void engine.playOneShot('lucidite');
    engine.playAmbiance('air');
  });
  const franchirLaPorte = geste('DERNIERE_CASE', () => {
    engine.stopAmbiance();
    void engine
      .playOneShot('porte')
      .then(() => engine.playAmbiance('renouveau'))
      .catch(() => undefined);
  });
  const clore = geste('CLOTURE', () => void engine.playOneShot('cloture'));

  // Momentary gestures: they overlay the journey instead of advancing it.
  const gestes = [
    { cle: 'meditations', label: 'Méditation', glyphe: 'lotus', angle: 225, joue: state.voiceId !== null },
    { cle: 'mantras', label: 'Mantra', glyphe: 'oreille', angle: 135, joue: state.mantraId !== null },
  ] as const;

  // The threshold appears once the journey has come far enough.
  const seuil = [
    { label: 'La Porte', glyphe: 'cle', attendu: attendu === 'DERNIERE_CASE', onPress: franchirLaPorte, visible: true },
    { label: 'Clôture', glyphe: 'lune', attendu: attendu === 'CLOTURE', onPress: clore, visible: isEventAllowed(phase, 'CLOTURE') },
  ] as const;

  const enTrainDeJouer = [
    state.ambianceId && engine.title(state.ambianceId),
    state.voiceId && engine.title(state.voiceId) + (state.voicePaused ? ' — en pause' : ''),
    state.mantraId && engine.title(state.mantraId),
  ].filter(Boolean);

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
            actif={element.passage ? state.ambianceId === 'air' : state.ambianceId === 'tfe'}
            attendu={attendu === (element.passage ? 'LUCIDITE' : 'TERRE_FEU_EAU')}
            onPress={element.passage ? passerParAir : ouvrirVoyage}
          />
        ))}

        {gestes.map((geste) => (
          <Noeud
            key={geste.cle}
            label={geste.label}
            glyphe={geste.glyphe}
            angle={geste.angle}
            orbite={0.54}
            petit
            actif={geste.joue || panneau === geste.cle}
            onPress={() => setPanneau(panneau === geste.cle ? null : geste.cle)}
          />
        ))}
      </div>

      <div className="seuil" data-visible={isEventAllowed(phase, 'DERNIERE_CASE')}>
        {seuil
          .filter((etape) => etape.visible)
          .map((etape) => (
            <button
              key={etape.label}
              type="button"
              className="seuil-bouton"
              data-attendu={etape.attendu}
              onClick={etape.onPress}
            >
              <Glyphe name={etape.glyphe} />
              <span>{etape.label}</span>
            </button>
          ))}
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
              <button type="button" onClick={() => (state.voicePaused ? engine.resumeVoice() : engine.pauseVoice())}>
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
