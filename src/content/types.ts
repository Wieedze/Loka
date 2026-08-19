export type TrackRole = 'jingle' | 'ambiance' | 'meditation' | 'mantra' | 'transition' | 'cloture';

export interface Track {
  id: string;
  role: TrackRole;
  file: string;
  title?: string;
  loop?: boolean;
}

export interface MixConfig {
  duckLevel: number;
  duckInSec: number;
  duckOutSec: number;
  crossfadeSec: number;
  // Shorter than a crossfade: stopping or replacing a voice should not linger.
  voiceFadeSec: number;
}

/** Ce qu'une page d'élément affiche et déclenche. */
export interface ElementPreset {
  id: string;
  titre: string;
  texte: string;
  /** Ambiance lancée en ouvrant la page. */
  piste: string;
  /** Son de passage joué par-dessus l'entrée, s'il y en a un. */
  passage?: string;
}

export interface Manifest {
  version: number;
  mix: MixConfig;
  tracks: Track[];
  elements: ElementPreset[];
}
