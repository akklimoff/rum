import { Chord, Interval, Note } from 'tonal';
import { formatNote } from './notes';
import type { DetectedKey } from './key';
import { scaleNotes, type DegreeNumber } from './scales';

const ROMAN_BY_SEMITONES = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♭V', 'V', '♭VI', 'VI', '♭VII', 'VII'];

const MARKS: Record<string, string> = {
  'minor seventh': '7',
  diminished: '°',
  'half-diminished': 'ø7',
  'diminished seventh': '°7',
  augmented: '+',
  'dominant seventh': '7',
  'major seventh': 'maj7',
};

const toAscii = (name: string) =>
  name.replaceAll('♯', '#').replaceAll('♭', 'b').replaceAll('(', '').replaceAll(')', '');

export function transposeChordName(name: string, semitones: number): string {
  if (semitones === 0) return name;
  return formatNote(Chord.transpose(toAscii(name), Interval.fromSemitones(semitones)));
}

export function chordRoman(name: string, key: DetectedKey): { roman: string; degreeNumber: DegreeNumber | null } {
  const ascii = toAscii(name).split('/')[0]!;
  const root = /^[A-G][#b]*/.exec(ascii)?.[0];
  const rootPc = root === undefined ? null : Note.chroma(root);
  if (rootPc === null || rootPc === undefined) return { roman: '', degreeNumber: null };

  const numeral = ROMAN_BY_SEMITONES[(rootPc - key.tonicPc + 12) % 12]!;
  const { type, quality } = Chord.get(ascii);
  const lowerCase = quality === 'Minor' || quality === 'Diminished';
  const mark = MARKS[type] ?? '';
  const degreeNumber = scaleNotes(key.tonicPc, key.scale).find((note) => note.pc === rootPc)?.degreeNumber ?? null;
  return { roman: `${lowerCase ? numeral.toLowerCase() : numeral}${mark}`, degreeNumber };
}
