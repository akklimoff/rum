import { Note } from 'tonal';
import { formatNote, tonicSpelling, withoutDoubleAccidental } from './notes';
import { degreeLabel, type DegreeNumber } from './scales';

export type ChordTypeId = 'maj' | 'min' | 'dim' | 'aug' | 'maj7' | '7' | 'm7' | 'm7b5';

export interface ChordType {
  id: ChordTypeId;
  label: string;
  suffix: string;
  intervals: readonly string[];
  size: 'triad' | 'seventh';
}

export interface ChordTone {
  note: string;
  pc: number;
  degree: string;
  degreeNumber: DegreeNumber;
}

export interface BuiltChord {
  symbol: string;
  tones: ChordTone[];
  thirds: string[];
}

export const CHORD_TYPES: readonly ChordType[] = [
  { id: 'maj', label: 'мажор', suffix: '', intervals: ['1P', '3M', '5P'], size: 'triad' },
  { id: 'min', label: 'минор', suffix: 'm', intervals: ['1P', '3m', '5P'], size: 'triad' },
  { id: 'dim', label: 'уменьшённый', suffix: 'dim', intervals: ['1P', '3m', '5d'], size: 'triad' },
  { id: 'aug', label: 'увеличенный', suffix: 'aug', intervals: ['1P', '3M', '5A'], size: 'triad' },
  { id: 'maj7', label: 'maj7', suffix: 'maj7', intervals: ['1P', '3M', '5P', '7M'], size: 'seventh' },
  { id: '7', label: '7', suffix: '7', intervals: ['1P', '3M', '5P', '7m'], size: 'seventh' },
  { id: 'm7', label: 'm7', suffix: 'm7', intervals: ['1P', '3m', '5P', '7m'], size: 'seventh' },
  { id: 'm7b5', label: 'm7♭5', suffix: 'm7♭5', intervals: ['1P', '3m', '5d', '7m'], size: 'seventh' },
];

const THIRD_NAMES: Record<number, string> = { 3: 'м3', 4: 'б3' };

export function chordType(id: ChordTypeId): ChordType {
  return CHORD_TYPES.find((type) => type.id === id)!;
}

export function buildChord(rootPc: number, id: ChordTypeId): BuiltChord {
  const type = chordType(id);
  const root = tonicSpelling(rootPc, type.intervals[1] === '3m');
  const tones = type.intervals.map((interval) => {
    const name = withoutDoubleAccidental(Note.transpose(root, interval));
    return { note: formatNote(name), pc: Note.chroma(name)!, ...degreeLabel(interval.replace('1P', '1')) };
  });
  const thirds = tones.slice(1).map((tone, i) => THIRD_NAMES[(tone.pc - tones[i]!.pc + 12) % 12]!);
  return { symbol: `${formatNote(root)}${type.suffix}`, tones, thirds };
}

export function closeVoicing(pcs: readonly number[], lowest = 48): number[] {
  const midis: number[] = [];
  for (const pc of pcs) {
    const floor = midis.length === 0 ? lowest : midis.at(-1)! + 1;
    midis.push(floor + ((pc - floor) % 12 + 12) % 12);
  }
  return midis;
}
