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

export interface Manifest {
  version: number;
  mix: MixConfig;
  tracks: Track[];
}
