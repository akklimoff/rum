import type { CSSProperties } from 'react';
import type { DegreeNumber } from '../lib/theory';
import './fretboard.css';

export interface FretboardDot {
  string: number;
  fret: number;
  label: string;
  degreeNumber: DegreeNumber | null;
  isTonic: boolean;
  dimmed: boolean;
  description: string;
}

export interface FretboardLink {
  from: { string: number; fret: number };
  to: { string: number; fret: number };
}

export type FretboardOrientation = 'horizontal' | 'vertical';

interface FretboardProps {
  dots: FretboardDot[];
  stringCount: number;
  fretCount: number;
  ariaLabel: string;
  replayKey?: string;
  links?: FretboardLink[];
  mutedStrings?: readonly number[];
  orientation?: FretboardOrientation;
  onPositionClick?: (string: number, fret: number) => void;
}

interface Point {
  x: number;
  y: number;
}

const OPEN = 22;
const NUT = 46;
const FRET_SPAN = 52;
const NECK_END = 8;
const FIRST_STRING = 24;
const STRING_GAP = 28;
const EDGE = 12;
const NUMBERS_BEYOND_BASS = 34;
const MARGIN_BEYOND_BASS = 46;
const LABEL_BASELINE = 4;
const CROSS_BASELINE = 5;
const SINGLE_INLAYS = [3, 5, 7, 9, 15];
const DOUBLE_INLAYS = [12];

const range = (length: number) => Array.from({ length }, (_, i) => i);
const fretCenter = (fret: number) => (fret === 0 ? OPEN : NUT + FRET_SPAN * (fret - 0.5));
const fretWire = (fret: number) => NUT + FRET_SPAN * fret;
const stringLine = (string: number) => FIRST_STRING + STRING_GAP * string;
const neckLength = (fretCount: number) => fretWire(fretCount) + NECK_END;

export function fretPositionRatio(fret: number, fretCount: number): number {
  return fretCenter(fret) / neckLength(fretCount);
}

function neckCanvas(orientation: FretboardOrientation, stringCount: number, fretCount: number) {
  const length = neckLength(fretCount);
  const breadth = stringLine(stringCount - 1) + MARGIN_BEYOND_BASS;
  const vertical = orientation === 'vertical';
  const place = (along: number, across: number): Point => (vertical ? { x: breadth - across, y: along } : { x: along, y: across });
  return {
    width: vertical ? breadth : length,
    height: vertical ? length : breadth,
    place,
    point: (string: number, fret: number) => place(fretCenter(fret), stringLine(string)),
  };
}

const circleAt = ({ x, y }: Point) => ({ cx: x, cy: y });
const textAt = ({ x, y }: Point, baseline: number) => ({ x, y: y + baseline });
const lineBetween = (from: Point, to: Point) => ({ x1: from.x, y1: from.y, x2: to.x, y2: to.y });
const boxBetween = (a: Point, b: Point) => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(b.x - a.x),
  height: Math.abs(b.y - a.y),
});

export function Fretboard({
  dots,
  stringCount,
  fretCount,
  ariaLabel,
  replayKey,
  links = [],
  mutedStrings = [],
  orientation = 'horizontal',
  onPositionClick,
}: FretboardProps) {
  const { width, height, place, point } = neckCanvas(orientation, stringCount, fretCount);
  const bassString = stringCount - 1;
  const middleString = bassString / 2;
  const boardStart = stringLine(0) - EDGE;
  const boardEnd = stringLine(bassString) + EDGE;

  return (
    <svg className="fretboard" data-orientation={orientation} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={ariaLabel}>
      <g aria-hidden="true">
      {SINGLE_INLAYS.filter((fret) => fret <= fretCount).map((fret) => (
        <circle key={fret} className="fretboard-inlay" {...circleAt(point(middleString, fret))} r={5} />
      ))}
      {DOUBLE_INLAYS.filter((fret) => fret <= fretCount).flatMap((fret) =>
        [middleString - 1, middleString + 1].map((string) => (
          <circle key={`${fret}:${string}`} className="fretboard-inlay" {...circleAt(point(string, fret))} r={5} />
        )),
      )}
      {range(fretCount + 1).map((fret) => (
        <line
          key={fret}
          className={fret === 0 ? 'fretboard-nut' : 'fretboard-fret'}
          {...lineBetween(place(fretWire(fret), boardStart), place(fretWire(fret), boardEnd))}
        />
      ))}
      {range(stringCount).map((string) => (
        <line
          key={string}
          className="fretboard-string"
          {...lineBetween(place(fretWire(0), stringLine(string)), place(fretWire(fretCount), stringLine(string)))}
          strokeWidth={1 + string * 0.35}
        />
      ))}
      {range(fretCount + 1).map((fret) => (
        <text
          key={fret}
          className="fretboard-number"
          data-fret-number
          {...textAt(place(fretCenter(fret), stringLine(bassString) + NUMBERS_BEYOND_BASS), LABEL_BASELINE)}
          textAnchor="middle"
        >
          {fret}
        </text>
      ))}
      </g>
      <g key={replayKey}>
      {links.map(({ from, to }) => (
        <line
          key={`${from.string}:${from.fret}-${to.string}:${to.fret}`}
          className="fretboard-link"
          aria-hidden="true"
          {...lineBetween(point(from.string, from.fret), point(to.string, to.fret))}
        />
      ))}
      {mutedStrings.map((string) => (
        <text
          key={`muted:${string}`}
          className="fretboard-muted"
          aria-hidden="true"
          {...textAt(point(string, 0), CROSS_BASELINE)}
          textAnchor="middle"
        >
          ×
        </text>
      ))}
      {dots.filter((dot) => !(dot.fret === 0 && mutedStrings.includes(dot.string))).map((dot) => (
        <g
          key={`${dot.string}:${dot.fret}`}
          className="fretboard-dot"
          role="img"
          aria-label={dot.description}
          data-dot
          data-degree={dot.degreeNumber ?? undefined}
          data-neutral={dot.degreeNumber === null ? '' : undefined}
          data-tonic={dot.isTonic ? '' : undefined}
          data-dimmed={dot.dimmed ? '' : undefined}
          style={{ '--fret': dot.fret } as CSSProperties}
        >
          <title>{dot.description}</title>
          <circle
            {...circleAt(point(dot.string, dot.fret))}
            r={dot.isTonic ? 11.5 : 10}
            style={dot.degreeNumber === null ? undefined : { fill: `var(--d${dot.degreeNumber})` }}
          />
          <text {...textAt(point(dot.string, dot.fret), LABEL_BASELINE)} textAnchor="middle">
            {dot.label}
          </text>
        </g>
      ))}
      </g>
      {onPositionClick && (
        <g aria-hidden="true">
          {range(stringCount).flatMap((string) =>
            range(fretCount + 1).map((fret) => (
              <rect
                key={`${string}:${fret}`}
                className="fretboard-hit"
                data-hit={`${string}:${fret}`}
                {...boxBetween(
                  place(fret === 0 ? 0 : fretWire(fret - 1), stringLine(string) - STRING_GAP / 2),
                  place(fretWire(fret), stringLine(string) + STRING_GAP / 2),
                )}
                onClick={() => onPositionClick(string, fret)}
              />
            )),
          )}
        </g>
      )}
    </svg>
  );
}
