import { diatonicChords } from './chords';
import { formatNote } from './notes';
import { progression, type ProgressionId } from './progressions';
import { tonicName } from './scales';

export interface CircleCell {
  ring: 'major' | 'minor';
  position: number;
  label: string;
  pc: number;
  degree?: number;
  roman?: string;
}

const POSITIONS = Array.from({ length: 12 }, (_, position) => position);

export function circleOfFifths(tonicPc: number): CircleCell[] {
  const chords = diatonicChords(tonicPc, 'major');
  const cell = (ring: CircleCell['ring'], position: number): CircleCell => {
    const majorPc = (position * 7) % 12;
    const pc = ring === 'major' ? majorPc : (majorPc + 9) % 12;
    const degree = chords.findIndex((chord) => chord.pcs[0] === pc && (chord.roman === chord.roman.toUpperCase()) === (ring === 'major'));
    if (degree >= 0) return { ring, position, pc, label: chords[degree]!.symbol, degree, roman: chords[degree]!.roman };
    const label = ring === 'major' ? formatNote(tonicName(pc, 'major')) : `${formatNote(tonicName(pc, 'minor'))}m`;
    return { ring, position, pc, label };
  };
  return [...POSITIONS.map((position) => cell('major', position)), ...POSITIONS.map((position) => cell('minor', position))];
}

export function progressionPath(id: ProgressionId): [number, number][] {
  const { degrees, kind } = progression(id);
  const steps = kind === 'progression' ? [...degrees, degrees[0]!] : [...degrees];
  const moves = new Map<string, [number, number]>();
  steps.slice(1).forEach((to, i) => {
    const from = steps[i]!;
    if (from !== to) moves.set(`${from}>${to}`, [from, to]);
  });
  return [...moves.values()];
}
