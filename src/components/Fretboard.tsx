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

interface FretboardProps {
  dots: FretboardDot[];
  stringCount: number;
  fretCount: number;
  ariaLabel: string;
  replayKey?: string;
  links?: FretboardLink[];
  mutedStrings?: readonly number[];
  onPositionClick?: (string: number, fret: number) => void;
}

const NUT_X = 46;
const OPEN_X = 22;
const FRET_WIDTH = 52;
const TOP_Y = 24;
const STRING_GAP = 28;
const EDGE = 12;
const CROSS_BASELINE = 5;
const SINGLE_INLAYS = [3, 5, 7, 9, 15];
const DOUBLE_INLAYS = [12];

const range = (length: number) => Array.from({ length }, (_, i) => i);
const fretCenterX = (fret: number) => (fret === 0 ? OPEN_X : NUT_X + FRET_WIDTH * (fret - 0.5));
const stringY = (string: number) => TOP_Y + STRING_GAP * string;

const totalWidth = (fretCount: number) => NUT_X + FRET_WIDTH * fretCount + 8;

export function fretPositionRatio(fret: number, fretCount: number): number {
  return fretCenterX(fret) / totalWidth(fretCount);
}

export function Fretboard({ dots, stringCount, fretCount, ariaLabel, replayKey, links = [], mutedStrings = [], onPositionClick }: FretboardProps) {
  const boardWidth = FRET_WIDTH * fretCount;
  const boardBottom = stringY(stringCount - 1);
  const width = totalWidth(fretCount);
  const height = boardBottom + 46;
  const middleY = (TOP_Y + boardBottom) / 2;

  return (
    <svg className="fretboard" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={ariaLabel}>
      <g aria-hidden="true">
      {SINGLE_INLAYS.filter((fret) => fret <= fretCount).map((fret) => (
        <circle key={fret} className="fretboard-inlay" cx={fretCenterX(fret)} cy={middleY} r={5} />
      ))}
      {DOUBLE_INLAYS.filter((fret) => fret <= fretCount).flatMap((fret) =>
        [-STRING_GAP, STRING_GAP].map((offset) => (
          <circle key={`${fret}:${offset}`} className="fretboard-inlay" cx={fretCenterX(fret)} cy={middleY + offset} r={5} />
        )),
      )}
      {range(fretCount + 1).map((fret) => (
        <line
          key={fret}
          className={fret === 0 ? 'fretboard-nut' : 'fretboard-fret'}
          x1={NUT_X + FRET_WIDTH * fret}
          x2={NUT_X + FRET_WIDTH * fret}
          y1={TOP_Y - EDGE}
          y2={boardBottom + EDGE}
        />
      ))}
      {range(stringCount).map((string) => (
        <line
          key={string}
          className="fretboard-string"
          x1={NUT_X}
          x2={NUT_X + boardWidth}
          y1={stringY(string)}
          y2={stringY(string)}
          strokeWidth={1 + string * 0.35}
        />
      ))}
      {range(fretCount + 1).map((fret) => (
        <text key={fret} className="fretboard-number" data-fret-number x={fretCenterX(fret)} y={height - 8} textAnchor="middle">
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
          x1={fretCenterX(from.fret)}
          y1={stringY(from.string)}
          x2={fretCenterX(to.fret)}
          y2={stringY(to.string)}
        />
      ))}
      {mutedStrings.map((string) => (
        <text
          key={`muted:${string}`}
          className="fretboard-muted"
          aria-hidden="true"
          x={fretCenterX(0)}
          y={stringY(string) + CROSS_BASELINE}
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
            cx={fretCenterX(dot.fret)}
            cy={stringY(dot.string)}
            r={dot.isTonic ? 11.5 : 10}
            style={dot.degreeNumber === null ? undefined : { fill: `var(--d${dot.degreeNumber})` }}
          />
          <text x={fretCenterX(dot.fret)} y={stringY(dot.string) + 4} textAnchor="middle">
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
                x={fret === 0 ? 0 : NUT_X + FRET_WIDTH * (fret - 1)}
                y={stringY(string) - STRING_GAP / 2}
                width={fret === 0 ? NUT_X : FRET_WIDTH}
                height={STRING_GAP}
                onClick={() => onPositionClick(string, fret)}
              />
            )),
          )}
        </g>
      )}
    </svg>
  );
}
