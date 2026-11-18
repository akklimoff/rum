import type { FretboardDot, FretboardLink } from '../components/Fretboard';
import type { ScaleNote } from './theory';
import { enharmonicSpellings, formatNote } from './theory/notes';

export interface TabNote {
  /** alphaTab numbering: 1 is the lowest string. */
  string: number;
  fret: number;
  /** Index of the beat inside the bar; notes of one chord share it. */
  beat: number;
  sounding: boolean;
  dead: boolean;
}

const neckString = (note: TabNote, tuning: readonly number[]) => tuning.length - note.string;

export type NeckLabels = 'degrees' | 'notes';

export function tabNeckDots(
  notes: TabNote[],
  tuning: readonly number[],
  scale: readonly ScaleNote[] = [],
  labels: NeckLabels = 'degrees',
): FretboardDot[] {
  const dots = new Map<string, FretboardDot>();
  for (const note of notes) {
    const string = neckString(note, tuning);
    const position = `${string}:${note.fret}`;
    if (dots.has(position) && !note.sounding) continue;
    const pc = (tuning[string]! + note.fret) % 12;
    const degree = note.dead ? undefined : scale.find((step) => step.pc === pc);
    const name = degree?.note ?? formatNote(enharmonicSpellings(pc)[0]!);
    const where = `Струна ${string + 1}, лад ${note.fret}: ${name}`;
    dots.set(position, {
      string,
      fret: note.fret,
      label: note.dead ? '×' : labels === 'degrees' ? (degree?.degree ?? name) : name,
      degreeNumber: degree?.degreeNumber ?? null,
      isTonic: degree?.degreeNumber === 1,
      dimmed: !note.sounding,
      description: note.dead ? `Струна ${string + 1}: приглушённая` : degree ? `${where}, ступень ${degree.degree}` : where,
    });
  }
  return [...dots.values()];
}

export function tabNeckLinks(notes: TabNote[], tuning: readonly number[]): FretboardLink[] {
  const path: { string: number; fret: number }[] = [];
  let lastBeat = -1;
  for (const note of notes) {
    if (note.dead || note.beat === lastBeat) continue;
    lastBeat = note.beat;
    path.push({ string: neckString(note, tuning), fret: note.fret });
  }
  const links = new Map<string, FretboardLink>();
  for (let i = 1; i < path.length; i++) {
    const [from, to] = [path[i - 1]!, path[i]!];
    if (from.string === to.string && from.fret === to.fret) continue;
    const ends = [`${from.string}:${from.fret}`, `${to.string}:${to.fret}`].sort().join('-');
    if (!links.has(ends)) links.set(ends, { from, to });
  }
  return [...links.values()];
}

export function tabNeckFocusFret(notes: TabNote[]): number | null {
  const frets = notes.filter((note) => !note.dead && note.fret > 0).map((note) => note.fret);
  return frets.length ? (Math.min(...frets) + Math.max(...frets)) / 2 : null;
}
