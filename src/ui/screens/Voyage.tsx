import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { engine } from '../../audio/engine';
import type { ElementPreset } from '../../content/types';
import { isEventAllowed, nextEvent } from '../../journey/machine';
import type { JourneyEvent, Phase } from '../../journey/machine';
import { Glyphe } from '../components/Glyphe';
import type { GlypheName } from '../components/Glyphe';
import { Noeud } from '../components/Noeud';
import { PageElement } from '../components/PageElement';
import { Spirale } from '../components/Spirale';
import { useEngine } from '../hooks/useEngine';

type Panneau = 'meditations' | 'mantras' | null;

interface VoyageProps {
  phase: Phase;
  dispatch: (event: JourneyEvent) => void;
}

// Mise en page seule — l'orientation du plateau : Nord / Est / Sud / Ouest.
// Ce que chaque élément raconte et déclenche vient du manifeste.
const PLACES: Record<string, { cardinal: string; angle: number; glyphe: GlypheName }> = {
  terre: { cardinal: 'N', angle: 0, glyphe: 'terre' },
  air: { cardinal: 'E', angle: 90, glyphe: 'air' },
  feu: { cardinal: 'S', angle: 180, glyphe: 'feu' },
  eau: { cardinal: 'O', angle: 270, glyphe: 'eau' },
};

const doux = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const duree = (secondes: number): number => (doux ? 0 : secondes);

export function Voyage({ phase, dispatch }: VoyageProps) {
  const state = useEngine();
  const [panneau, setPanneau] = useState<Panneau>(null);
  const [ouvert, setOuvert] = useState<ElementPreset | null>(null);
  const mandala = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const attendu = nextEvent(phase);

  const geste =
    (event: JourneyEvent, jouer: () => void) =>
    (): void => {
      if (!isEventAllowed(phase, event)) return;
      setPanneau(null);
      jouer();
      dispatch(event);
    };

  const commencer = geste('COMMENCEMENT', () => void engine.playOneShot('accueil'));
  const franchirLaPorte = geste('DERNIERE_CASE', () => {
    engine.stopAmbiance();
    void engine
      .playOneShot('porte')
      .then(() => engine.playAmbiance('renouveau'))
      .catch(() => undefined);
  });
  const clore = geste('CLOTURE', () => void engine.playOneShot('cloture'));

  // Ouvrir un élément : son son démarre, et son icône vient prendre le centre
  // pendant que le reste du mandala s'efface.
  const ouvrir = (preset: ElementPreset): void => {
    const passage = preset.passage;
    const event: JourneyEvent = passage === undefined ? 'TERRE_FEU_EAU' : 'LUCIDITE';
    geste(event, () => {
      if (passage !== undefined) void engine.playOneShot(passage);
      engine.playAmbiance(preset.piste);
    })();
    setOuvert(preset);
  };

  const fermer = (): void => {
    const conteneur = mandala.current;
    if (!conteneur) {
      setOuvert(null);
      return;
    }
    gsap
      .timeline({ onComplete: () => setOuvert(null) })
      .to(page.current, { autoAlpha: 0, y: 12, duration: duree(0.3), ease: 'power2.in' })
      .to(conteneur.querySelectorAll('.noeud, .spirale'), {
        autoAlpha: 1,
        scale: 1,
        x: 0,
        y: 0,
        duration: duree(0.55),
        ease: 'power3.out',
        stagger: { each: 0.03, from: 'center' },
      })
      .set(conteneur.querySelectorAll('.noeud'), { clearProps: 'zIndex' });
  };

  // L'animation vit ici plutôt que dans le composant de page : c'est le nœud du
  // mandala lui-même qui se déplace, pour que le geste reste continu.
  useLayoutEffect(() => {
    const conteneur = mandala.current;
    if (!ouvert || !conteneur) return;

    const contexte = gsap.context(() => {
      const cible = conteneur.querySelector<HTMLElement>(`[data-cle="${ouvert.id}"]`);
      const autres = [...conteneur.querySelectorAll<HTMLElement>('.noeud, .spirale')].filter((n) => n !== cible);
      if (!cible) return;

      const rc = conteneur.getBoundingClientRect();
      const rt = cible.getBoundingClientRect();
      const dx = rc.left + rc.width / 2 - (rt.left + rt.width / 2);
      const dy = rc.top + rc.height / 2 - (rt.top + rt.height / 2);

      gsap.set(cible, { zIndex: 3 });
      gsap
        .timeline()
        .to(autres, {
          autoAlpha: 0,
          scale: 0.82,
          duration: duree(0.42),
          ease: 'power2.inOut',
          stagger: { each: 0.03, from: 'edges' },
        })
        .to(cible, { x: dx, y: dy, scale: 1.85, duration: duree(0.75), ease: 'power3.inOut' }, duree(0.12))
        .fromTo(
          page.current,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: duree(0.45), ease: 'power2.out' },
          duree(0.45),
        );
    }, conteneur);

    return () => contexte.revert();
  }, [ouvert]);

  const gestes = [
    { cle: 'meditations', label: 'Méditation', glyphe: 'lotus', angle: 225, joue: state.voiceId !== null },
    { cle: 'mantras', label: 'Mantra', glyphe: 'oreille', angle: 135, joue: state.mantraId !== null },
  ] as const;

  const seuil = [
    { label: 'La Porte', glyphe: 'cle', attendu: attendu === 'DERNIERE_CASE', onPress: franchirLaPorte, visible: true },
    {
      label: 'Clôture',
      glyphe: 'lune',
      attendu: attendu === 'CLOTURE',
      onPress: clore,
      visible: isEventAllowed(phase, 'CLOTURE'),
    },
  ] as const;

  const enTrainDeJouer = [
    state.ambianceId && engine.title(state.ambianceId) + (state.ambiancePaused ? ' — en pause' : ''),
    state.voiceId && engine.title(state.voiceId) + (state.voicePaused ? ' — en pause' : ''),
    state.mantraId && engine.title(state.mantraId),
  ].filter(Boolean);

  const place = ouvert ? PLACES[ouvert.id] : undefined;

  return (
    <main className="voyage" data-ouvert={ouvert !== null}>
      <div className="mandala" ref={mandala}>
        <Spirale
          label="Commencement"
          vivante={state.ambianceId !== null || state.voiceId !== null}
          onPress={commencer}
        />

        {engine.elements().map((preset) => {
          const p = PLACES[preset.id];
          if (!p) return null;
          return (
            <Noeud
              key={preset.id}
              cle={preset.id}
              label={preset.titre}
              cardinal={p.cardinal}
              glyphe={p.glyphe}
              element={preset.id as 'terre' | 'feu' | 'eau' | 'air'}
              angle={p.angle}
              aide={preset.texte}
              actif={state.ambianceId === preset.piste}
              attendu={attendu === (preset.passage === undefined ? 'TERRE_FEU_EAU' : 'LUCIDITE')}
              onPress={() => ouvrir(preset)}
            />
          );
        })}

        {gestes.map((g) => (
          <Noeud
            key={g.cle}
            cle={g.cle}
            label={g.label}
            glyphe={g.glyphe}
            angle={g.angle}
            orbite={0.54}
            petit
            actif={g.joue || panneau === g.cle}
            onPress={() => setPanneau(panneau === g.cle ? null : g.cle)}
          />
        ))}
      </div>

      {ouvert && place && (
        <PageElement
          ref={page}
          preset={ouvert}
          glyphe={place.glyphe}
          cardinal={place.cardinal}
          joue={state.ambianceId === ouvert.piste}
          enPause={state.ambiancePaused}
          onRetour={fermer}
          onLecture={() => {
            if (state.ambianceId !== ouvert.piste) engine.playAmbiance(ouvert.piste);
            else if (state.ambiancePaused) engine.resumeAmbiance();
            else engine.pauseAmbiance();
          }}
        />
      )}

      {!ouvert && (
        <>
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
        </>
      )}

      {panneau !== null && !ouvert && (
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
