import type { GlypheName } from './Glyphe';
import { Glyphe } from './Glyphe';

interface NoeudProps {
  /** Repère stable pour retrouver le nœud au moment de l'animer. */
  cle?: string;
  label: string;
  glyphe: GlypheName;
  /** Degrees clockwise from the top of the mandala. */
  angle: number;
  /** Distance from the centre, as a fraction of the mandala radius. */
  orbite?: number;
  /** Extra description read after the label. */
  aide?: string;
  /** Direction on the board: N, E, S, O. */
  cardinal?: string;
  /** Currently sounding. */
  actif?: boolean;
  /** The step the journey is waiting for: breathes gently. */
  attendu?: boolean;
  petit?: boolean;
  element?: 'terre' | 'feu' | 'eau' | 'air';
  onPress: () => void;
}

export function Noeud({
  cle,
  label,
  glyphe,
  angle,
  orbite = 0.82,
  aide,
  cardinal,
  actif = false,
  attendu = false,
  petit = false,
  element,
  onPress,
}: NoeudProps) {
  const radians = ((angle - 90) * Math.PI) / 180;
  const distance = 50 * orbite;
  const left = 50 + distance * Math.cos(radians);
  const top = 50 + distance * Math.sin(radians);

  return (
    <button
      type="button"
      className="noeud"
      data-cle={cle}
      data-actif={actif}
      data-attendu={attendu}
      data-petit={petit}
      data-element={element}
      style={{ left: `${left}%`, top: `${top}%` }}
      onClick={onPress}
      aria-label={aide ? `${label} — ${aide}` : label}
    >
      <span className="noeud-cercle">
        <Glyphe name={glyphe} />
      </span>
      <span className="noeud-label" aria-hidden="true">
        {label}
      </span>
      {cardinal !== undefined && (
        <span className="noeud-cardinal" data-cardinal={cardinal} aria-hidden="true">
          {cardinal}
        </span>
      )}
    </button>
  );
}
