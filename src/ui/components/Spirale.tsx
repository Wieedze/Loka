const TURNS = 3.2;
const RADIUS = 40;
const POINTS = 320;

function spiralPath(): string {
  const steps: string[] = [];
  for (let i = 0; i <= POINTS; i++) {
    const progress = i / POINTS;
    const angle = progress * TURNS * Math.PI * 2;
    const radius = progress * RADIUS;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    steps.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return steps.join(' ');
}

const PATH = spiralPath();

interface SpiraleProps {
  label: string;
  /** Slowly turns and breathes while something is playing. */
  vivante: boolean;
  /** At the centre of the mandala the mark stands alone; on the opening
   *  screen it is captioned. */
  captionnee?: boolean;
  onPress: () => void;
}

export function Spirale({ label, vivante, captionnee = false, onPress }: SpiraleProps) {
  return (
    <button type="button" className="spirale" data-vivante={vivante} onClick={onPress} aria-label={label}>
      <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
        <circle className="spirale-halo" cx="50" cy="50" r="46" />
        <path className="spirale-trace" d={PATH} />
      </svg>
      {captionnee && (
        <span className="spirale-label" aria-hidden="true">
          {label}
        </span>
      )}
    </button>
  );
}
