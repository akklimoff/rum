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

// Not Chord.tokenize: it drops spaces after the root ("A7 sus4" → "7sus4"), and names from files keep their text.
const CHORD_PARTS = /^([A-G](?:#+|b+)?)(.*?)(?:\/([A-G](?:#+|b+)?))?$/;

const asciiAccidentals = (name: string) => name.replaceAll('♯', '#').replaceAll('♭', 'b');

const toAscii = (name: string) => asciiAccidentals(name).replaceAll('(', '').replaceAll(')', '');

const spellSuffix = (suffix: string) => suffix.replaceAll('#', '♯').replace(/b(?=\d)/g, '♭');

function spell(ascii: string, moveNote: (note: string) => string): string {
  const parts = CHORD_PARTS.exec(ascii);
  if (!parts) return spellSuffix(ascii);
  const [, root, suffix, bass] = parts;
  return `${formatNote(moveNote(root!))}${spellSuffix(suffix!)}${bass ? `/${formatNote(moveNote(bass))}` : ''}`;
}

export function spellChordName(name: string): string {
  return spell(asciiAccidentals(name), (note) => note);
}

export function transposeChordName(name: string, semitones: number): string {
  if (semitones === 0) return spellChordName(name);
  const interval = Interval.fromSemitones(semitones);
  return spell(toAscii(name), (note) => Note.simplify(Note.transpose(note, interval)));
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
