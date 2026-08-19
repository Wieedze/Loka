import { forwardRef } from 'react';
import type { ElementPreset } from '../../content/types';
import type { GlypheName } from './Glyphe';
import { Glyphe } from './Glyphe';

interface PageElementProps {
  preset: ElementPreset;
  glyphe: GlypheName;
  cardinal: string;
  /** L'ambiance de cet élément joue-t-elle, et est-elle suspendue ? */
  joue: boolean;
  enPause: boolean;
  onRetour: () => void;
  onLecture: () => void;
}

// Gabarit unique : chaque élément affiche la même page, remplie par son preset.
// L'icône centrale n'est pas rendue ici — c'est le nœud du mandala lui-même qui
// vient s'y poser en s'animant, pour que le geste reste continu.
export const PageElement = forwardRef<HTMLDivElement, PageElementProps>(function PageElement(
  { preset, glyphe, cardinal, joue, enPause, onRetour, onLecture },
  ref,
) {
  return (
    <div className="page-element" ref={ref}>
      <button type="button" className="retour" onClick={onRetour} aria-label="Revenir au mandala">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            d="M15 5l-7 7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <header className="page-element-titre">
        <span className="page-element-cardinal">{cardinal}</span>
        <h2>{preset.titre}</h2>
      </header>

      <p className="page-element-texte">{preset.texte}</p>

      <div className="page-element-pied">
        <button
          type="button"
          className="lecture"
          onClick={onLecture}
          aria-label={joue && !enPause ? 'Mettre en pause' : 'Lancer'}
        >
          <span className="lecture-glyphe" aria-hidden="true">
            {joue && !enPause ? (
              <svg viewBox="0 0 24 24">
                <path d="M9 5v14M15 5v14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24">
                <path d="M8 5.5l11 6.5-11 6.5z" fill="currentColor" />
              </svg>
            )}
          </span>
        </button>
        <span className="lecture-etat" aria-live="polite">
          {!joue ? 'Prêt' : enPause ? 'En pause' : 'En cours'}
        </span>
      </div>

      <span className="page-element-marque" aria-hidden="true">
        <Glyphe name={glyphe} />
      </span>
    </div>
  );
});
