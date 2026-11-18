import { Note } from 'tonal';
import { FRET_COUNT, STANDARD_TUNING } from './fretboard';
import { tonicSpelling, withoutDoubleAccidental } from './notes';
import type { DegreeNumber } from './scales';

export type IntervalId = 'm2' | 'M2' | 'm3' | 'M3' | 'P4' | 'TT' | 'P5' | 'm6' | 'M6' | 'm7' | 'M7' | 'P8';

export interface IntervalInfo {
  id: IntervalId;
  semitones: number;
  short: string;
  name: string;
  degree: string;
  degreeNumber: DegreeNumber;
  tonalName: string;
}

export interface NeckPosition {
  string: number;
  fret: number;
}

export const INTERVALS: readonly IntervalInfo[] = [
  { id: 'm2', semitones: 1, short: 'м2', name: 'малая секунда', degree: '♭2', degreeNumber: 2, tonalName: '2m' },
  { id: 'M2', semitones: 2, short: 'б2', name: 'большая секунда', degree: '2', degreeNumber: 2, tonalName: '2M' },
  { id: 'm3', semitones: 3, short: 'м3', name: 'малая терция', degree: '♭3', degreeNumber: 3, tonalName: '3m' },
  { id: 'M3', semitones: 4, short: 'б3', name: 'большая терция', degree: '3', degreeNumber: 3, tonalName: '3M' },
  { id: 'P4', semitones: 5, short: 'ч4', name: 'чистая кварта', degree: '4', degreeNumber: 4, tonalName: '4P' },
  { id: 'TT', semitones: 6, short: 'тритон', name: 'тритон', degree: '♭5', degreeNumber: 5, tonalName: '5d' },
  { id: 'P5', semitones: 7, short: 'ч5', name: 'чистая квинта', degree: '5', degreeNumber: 5, tonalName: '5P' },
  { id: 'm6', semitones: 8, short: 'м6', name: 'малая секста', degree: '♭6', degreeNumber: 6, tonalName: '6m' },
  { id: 'M6', semitones: 9, short: 'б6', name: 'большая секста', degree: '6', degreeNumber: 6, tonalName: '6M' },
  { id: 'm7', semitones: 10, short: 'м7', name: 'малая септима', degree: '♭7', degreeNumber: 7, tonalName: '7m' },
  { id: 'M7', semitones: 11, short: 'б7', name: 'большая септима', degree: '7', degreeNumber: 7, tonalName: '7M' },
  { id: 'P8', semitones: 12, short: 'ч8', name: 'чистая октава', degree: '8', degreeNumber: 1, tonalName: '8P' },
];

export function intervalInfo(id: IntervalId): IntervalInfo {
  return INTERVALS.find((interval) => interval.id === id)!;
}

const SHAPE_REACH = 4;

export function intervalShapes(
  root: NeckPosition,
  semitones: number,
  tuning: readonly string[] = STANDARD_TUNING,
  frets: number = FRET_COUNT,
): NeckPosition[] {
  const targetMidi = Note.midi(tuning[root.string]!)! + root.fret + semitones;
  return tuning.flatMap((open, string) => {
    const fret = targetMidi - Note.midi(open)!;
    const onNeck = fret >= 0 && fret <= frets;
    const reachable = string === root.string || Math.abs(fret - root.fret) <= SHAPE_REACH;
    return onNeck && reachable ? [{ string, fret }] : [];
  });
}

export function intervalNoteNames(
  root: NeckPosition,
  id: IntervalId,
  tuning: readonly string[] = STANDARD_TUNING,
): { root: string; target: string } {
  const rootName = tonicSpelling(Note.chroma(tuning[root.string]!)! + root.fret, false);
  return { root: rootName, target: withoutDoubleAccidental(Note.transpose(rootName, intervalInfo(id).tonalName)) };
}
