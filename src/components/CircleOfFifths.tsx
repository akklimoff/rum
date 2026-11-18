import './circle.css';

export interface CircleSegment {
  ring: 'major' | 'minor';
  position: number;
  label: string;
  caption?: string;
  inKey: boolean;
  active: boolean;
  tonic: boolean;
}

export interface CircleMove {
  from: { ring: 'major' | 'minor'; position: number };
  to: { ring: 'major' | 'minor'; position: number };
}

interface CircleOfFifthsProps {
  segments: CircleSegment[];
  moves: CircleMove[];
  ariaLabel: string;
  onPick?: (segment: CircleSegment) => void;
}

const SIZE = 340;
const CENTER = SIZE / 2;
const RADII = { major: [112, 164], minor: [66, 112] } as const;
const STEP = 30;
const ARROW_INSET = 17;

const point = (radius: number, degrees: number) => {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(radians), CENTER + radius * Math.sin(radians)] as const;
};

const middle = ({ ring, position }: { ring: 'major' | 'minor'; position: number }) =>
  point((RADII[ring][0] + RADII[ring][1]) / 2, position * STEP);

function wedge(ring: 'major' | 'minor', position: number): string {
  const [inner, outer] = RADII[ring];
  const [start, end] = [position * STEP - STEP / 2, position * STEP + STEP / 2];
  const [a, b, c, d] = [point(outer, start), point(outer, end), point(inner, end), point(inner, start)];
  return `M${a} A${outer} ${outer} 0 0 1 ${b} L${c} A${inner} ${inner} 0 0 0 ${d} Z`;
}

function arrow({ from, to }: CircleMove): string {
  const [x1, y1] = middle(from);
  const [x2, y2] = middle(to);
  const length = Math.hypot(x2 - x1, y2 - y1);
  const [ux, uy] = [(x2 - x1) / length, (y2 - y1) / length];
  const bend = Math.min(14, length / 6);
  const [mx, my] = [(x1 + x2) / 2 - uy * bend, (y1 + y2) / 2 + ux * bend];
  return `M${x1 + ux * ARROW_INSET} ${y1 + uy * ARROW_INSET} Q${mx} ${my} ${x2 - ux * ARROW_INSET} ${y2 - uy * ARROW_INSET}`;
}

export function CircleOfFifths({ segments, moves, ariaLabel, onPick }: CircleOfFifthsProps) {
  return (
    <svg className="circle" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={ariaLabel}>
      <defs>
        <marker id="circle-arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path className="circle-arrowhead" d="M0 0 L10 5 L0 10 Z" />
        </marker>
      </defs>
      {[...segments].sort((a, b) => Number(a.tonic) - Number(b.tonic)).map((segment) => {
        const [x, y] = middle(segment);
        return (
          <g
            key={`${segment.ring}:${segment.position}`}
            className="circle-cell"
            data-cell={`${segment.ring}:${segment.position}`}
            data-in-key={segment.inKey ? '' : undefined}
            data-active={segment.active ? '' : undefined}
            data-tonic={segment.tonic ? '' : undefined}
            data-pickable={onPick && segment.ring === 'major' ? '' : undefined}
            onClick={onPick && segment.ring === 'major' ? () => onPick(segment) : undefined}
          >
            <path d={wedge(segment.ring, segment.position)} />
            <text x={x} y={y + (segment.caption ? 0 : 4)} textAnchor="middle">{segment.label}</text>
            {segment.caption && <text className="circle-caption" x={x} y={y + 13} textAnchor="middle">{segment.caption}</text>}
          </g>
        );
      })}
      <g key={moves.map((move) => `${move.from.ring}${move.from.position}>${move.to.ring}${move.to.position}`).join()} aria-hidden="true">
        {moves.map((move, index) => (
          <path key={index} className="circle-move" d={arrow(move)} markerEnd="url(#circle-arrow)" style={{ animationDelay: `${index * 90}ms` }} />
        ))}
      </g>
    </svg>
  );
}
