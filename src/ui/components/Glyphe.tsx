export type GlypheName = 'terre' | 'feu' | 'eau' | 'air' | 'etoile' | 'lotus' | 'oreille' | 'cle' | 'lune';

// Single-stroke marks so every symbol reads as one family, at any size.
const PATHS: Record<GlypheName, string> = {
  // feuille — l'ambiance du voyage
  terre: 'M12 21c0-6 3-11 9-13-1 7-4 11-9 13zM12 21c0-5-2-9-6-11 0 5 2 9 6 11z',
  feu: 'M12 21c3.6 0 6-2.4 6-5.4 0-3.6-3-5-4.2-9.6-2.4 2.4-1.2 5.4-2.4 6.6-.9.9-1.8-.6-1.8-2.4C8 12 6 13.4 6 15.6 6 18.6 8.4 21 12 21z',
  eau: 'M12 3c3.6 4.5 6 7.8 6 10.8A6 6 0 0 1 6 13.8C6 10.8 8.4 7.5 12 3z',
  // souffle — le quatrième élément, à l'Est
  air: 'M3 8.5h9.5a2.75 2.75 0 1 0-2.75-2.9M3 12.5h13a2.75 2.75 0 1 1-2.75 2.9M3 16.5h6.5a2.25 2.25 0 1 1-2.25 2.4',
  // étoile filante — la carte Lucidité du plateau
  etoile: 'M17 4l-1.6 3.6L11.8 9l3.6 1.4L17 14l1.4-3.6L22 9l-3.6-1.4zM11 14l-8 6M9 11l-4 2.6',
  lotus: 'M12 20c-4 0-7-2.6-7-6 2.4 0 4 .8 5 2 0-3 1-5 2-7 1 2 2 4 2 7 1-1.2 2.6-2 5-2 0 3.4-3 6-7 6z',
  oreille: 'M9 21c0-3-3-4-3-9a6 6 0 0 1 12 0c0 2.4-1.4 3.4-3 3.4-1.2 0-2-.8-2-2a2 2 0 1 1 2 2',
  cle: 'M14 3a5 5 0 1 0-3.4 8.7L4 18.3V21h2.7l1-1v-2h2v-2h2l1.3-1.3A5 5 0 0 0 14 3zm.8 3.4a1.4 1.4 0 1 1-2 2 1.4 1.4 0 0 1 2-2z',
  lune: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
};

interface GlypheProps {
  name: GlypheName;
  filled?: boolean;
}

export function Glyphe({ name, filled = false }: GlypheProps) {
  return (
    <svg className="glyphe" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d={PATHS[name]}
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
