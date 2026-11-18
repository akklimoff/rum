import { scaleNotes, type ScaleId, type ScaleNote } from './scales';

export interface DiatonicChord {
  symbol: string;
  roman: string;
  notes: string[];
  pcs: number[];
  function?: HarmonicFunction;
}

export type HarmonicFunction = 'T' | 'S' | 'D';
export type ChordSize = 'triads' | 'sevenths';

interface TriadQuality {
  suffix: string;
  upperCase: boolean;
  mark: string;
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

const QUALITIES: Record<string, TriadQuality> = {
  '4-7': { suffix: '', upperCase: true, mark: '' },
  '3-7': { suffix: 'm', upperCase: false, mark: '' },
  '3-6': { suffix: 'dim', upperCase: false, mark: '°' },
  '4-8': { suffix: 'aug', upperCase: true, mark: '+' },
};

const SEVENTH_QUALITIES: Record<string, TriadQuality> = {
  '4-7-11': { suffix: 'maj7', upperCase: true, mark: 'maj7' },
  '4-7-10': { suffix: '7', upperCase: true, mark: '7' },
  '3-7-10': { suffix: 'm7', upperCase: false, mark: '7' },
  '3-6-10': { suffix: 'm7♭5', upperCase: false, mark: 'ø7' },
  '3-6-9': { suffix: 'dim7', upperCase: false, mark: '°7' },
  '3-7-11': { suffix: 'm(maj7)', upperCase: false, mark: 'maj7' },
  '4-8-11': { suffix: 'maj7♯5', upperCase: true, mark: '+maj7' },
  '4-8-10': { suffix: '7♯5', upperCase: true, mark: '+7' },
};

const FUNCTIONS: Partial<Record<ScaleId, readonly HarmonicFunction[]>> = {
  major: ['T', 'S', 'T', 'S', 'D', 'T', 'D'],
  minor: ['T', 'S', 'T', 'S', 'D', 'S', 'D'],
};

const semitonesAbove = (root: ScaleNote, other: ScaleNote) => (other.pc - root.pc + 12) % 12;

function chordOn(scale: ScaleNote[], index: number, size: ChordSize, fn: HarmonicFunction | undefined): DiatonicChord {
  const steps = size === 'triads' ? [0, 2, 4] : [0, 2, 4, 6];
  const tones = steps.map((step) => scale[(index + step) % 7]!);
  const root = tones[0]!;
  const shape = tones.slice(1).map((tone) => semitonesAbove(root, tone)).join('-');
  const quality = (size === 'triads' ? QUALITIES : SEVENTH_QUALITIES)[shape]!;
  const numeral = NUMERALS[root.degreeNumber - 1]!;
  const accidental = root.degree.replace(/\d/, '');
  return {
    symbol: `${root.note}${quality.suffix}`,
    roman: `${accidental}${quality.upperCase ? numeral : numeral.toLowerCase()}${quality.mark}`,
    notes: tones.map((tone) => tone.note),
    pcs: tones.map((tone) => tone.pc),
    function: fn,
  };
}

export function diatonicChords(tonicPc: number, scale: ScaleId, size: ChordSize = 'triads'): DiatonicChord[] {
  const notes = scaleNotes(tonicPc, scale);
  if (notes.length !== 7) return [];
  return notes.map((_, index) => chordOn(notes, index, size, FUNCTIONS[scale]?.[index]));
}
