import { Note } from 'tonal';
import { enharmonicSpellings } from './notes';
import type { ScaleNote } from './scales';

export const STANDARD_TUNING: readonly string[] = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
export const FRET_COUNT = 15;

export interface FretPosition {
  string: number;
  fret: number;
  note: ScaleNote;
}

export function fretboardPositions(
  notes: ScaleNote[],
  tuning: readonly string[] = STANDARD_TUNING,
  frets: number = FRET_COUNT,
): FretPosition[] {
  const byPc = new Map(notes.map((note) => [note.pc, note]));
  return tuning.flatMap((open, string) => {
    const openPc = Note.chroma(open)!;
    const positions: FretPosition[] = [];
    for (let fret = 0; fret <= frets; fret++) {
      const note = byPc.get((openPc + fret) % 12);
      if (note) positions.push({ string, fret, note });
    }
    return positions;
  });
}

export interface NeckNote {
  string: number;
  fret: number;
  note: string;
  pc: number;
  natural: boolean;
}

export function neckNotes(
  accidentals: 'sharps' | 'flats',
  tuning: readonly string[] = STANDARD_TUNING,
  frets: number = FRET_COUNT,
): NeckNote[] {
  return tuning.flatMap((open, string) => {
    const openPc = Note.chroma(open)!;
    return Array.from({ length: frets + 1 }, (_, fret) => {
      const pc = (openPc + fret) % 12;
      const spellings = enharmonicSpellings(pc);
      const note = accidentals === 'sharps' ? spellings[0]! : spellings.at(-1)!;
      return { string, fret, note, pc, natural: note.length === 1 };
    });
  });
}

export function positionMidi(string: number, fret: number, tuning: readonly string[] = STANDARD_TUNING): number {
  return Note.midi(tuning[string]!)! + fret;
}
