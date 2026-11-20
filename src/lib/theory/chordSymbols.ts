import { Chord, Interval, Note } from 'tonal';
import { formatNote } from './notes';
import type { DetectedKey } from './key';
import { scaleNotes, type DegreeNumber } from './scales';

interface RomanMark {
  lowerCase: boolean;
  mark: string;
}

const ROMAN_BY_SEMITONES = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♭V', 'V', '♭VI', 'VI', '♭VII', 'VII'];

const MARKS: Record<string, RomanMark> = {
  minor: { lowerCase: true, mark: '' },
  'minor seventh': { lowerCase: true, mark: '7' },
  diminished: { lowerCase: true, mark: '°' },
  'half-diminished': { lowerCase: true, mark: 'ø7' },
  'diminished seventh': { lowerCase: true, mark: '°7' },
  augmented: { lowerCase: false, mark: '+' },
  'dominant seventh': { lowerCase: false, mark: '7' },
  'major seventh': { lowerCase: false, mark: 'maj7' },
};

const PLAIN: RomanMark = { lowerCase: false, mark: '' };

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
  if (rootPc === null || rootPc === undefined) return { roman: ascii, degreeNumber: null };

  const numeral = ROMAN_BY_SEMITONES[(rootPc - key.tonicPc + 12) % 12]!;
  const { lowerCase, mark } = MARKS[Chord.get(ascii).type] ?? PLAIN;
  const degreeNumber = scaleNotes(key.tonicPc, key.scale).find((note) => note.pc === rootPc)?.degreeNumber ?? null;
  return { roman: `${lowerCase ? numeral.toLowerCase() : numeral}${mark}`, degreeNumber };
}
