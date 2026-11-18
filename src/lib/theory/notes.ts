import { Note } from 'tonal';

const MAJOR_TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_TONICS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];

const RUSSIAN_LETTERS: Record<string, string> = {
  C: 'до',
  D: 'ре',
  E: 'ми',
  F: 'фа',
  G: 'соль',
  A: 'ля',
  B: 'си',
};

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const normalizePc = (pc: number) => ((pc % 12) + 12) % 12;

export function tonicSpelling(tonicPc: number, minorLike: boolean): string {
  const tonics = minorLike ? MINOR_TONICS : MAJOR_TONICS;
  return tonics[normalizePc(tonicPc)]!;
}

export function enharmonicSpellings(pc: number): string[] {
  return [...new Set([SHARP_NAMES[normalizePc(pc)]!, FLAT_NAMES[normalizePc(pc)]!])];
}

export const accidentalCount = (ascii: string) => ascii.length - 1;

export function withoutDoubleAccidental(ascii: string): string {
  return accidentalCount(ascii) > 1 ? Note.simplify(ascii) : ascii;
}

export function formatNote(ascii: string): string {
  return ascii.replaceAll('b', '♭').replaceAll('#', '♯');
}

export function parseNote(input: string): number | null {
  const ascii = input.trim().replaceAll('♭', 'b').replaceAll('♯', '#');
  if (!/^[a-gA-G][b#]*$/.test(ascii)) return null;
  const note = Note.get(ascii[0]!.toUpperCase() + ascii.slice(1));
  return note.empty ? null : note.chroma;
}

export function russianNoteName(ascii: string): string {
  const letter = RUSSIAN_LETTERS[ascii[0]!]!;
  const accidental = ascii.slice(1);
  if (accidental === '#') return `${letter}-диез`;
  if (accidental === 'b') return `${letter}-бемоль`;
  return letter;
}
