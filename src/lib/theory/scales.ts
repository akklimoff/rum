import { Note, Scale } from 'tonal';
import {
  accidentalCount,
  enharmonicSpellings,
  formatNote,
  russianNoteName,
  tonicSpelling,
  withoutDoubleAccidental,
} from './notes';

export type ScaleId =
  | 'major'
  | 'minor'
  | 'major-pentatonic'
  | 'minor-pentatonic'
  | 'blues'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'locrian';

export type DegreeNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ScaleInfo {
  id: ScaleId;
  label: string;
  primary: boolean;
  minorLike: boolean;
}

export interface ScaleNote {
  note: string;
  pc: number;
  degree: string;
  degreeNumber: DegreeNumber;
}

export const SCALES: readonly ScaleInfo[] = [
  { id: 'major', label: 'мажор', primary: true, minorLike: false },
  { id: 'minor', label: 'минор', primary: true, minorLike: true },
  { id: 'major-pentatonic', label: 'мажорная пентатоника', primary: true, minorLike: false },
  { id: 'minor-pentatonic', label: 'минорная пентатоника', primary: true, minorLike: true },
  { id: 'blues', label: 'блюзовый', primary: true, minorLike: true },
  { id: 'mixolydian', label: 'миксолидийский', primary: true, minorLike: false },
  { id: 'dorian', label: 'дорийский', primary: false, minorLike: true },
  { id: 'phrygian', label: 'фригийский', primary: false, minorLike: true },
  { id: 'lydian', label: 'лидийский', primary: false, minorLike: false },
  { id: 'locrian', label: 'локрийский', primary: false, minorLike: true },
];

const TONAL_NAMES: Record<ScaleId, string> = {
  major: 'major',
  minor: 'minor',
  'major-pentatonic': 'major pentatonic',
  'minor-pentatonic': 'minor pentatonic',
  blues: 'minor blues',
  dorian: 'dorian',
  phrygian: 'phrygian',
  lydian: 'lydian',
  mixolydian: 'mixolydian',
  locrian: 'locrian',
};

const PERFECT_DEGREES = new Set([1, 4, 5]);

export function scaleInfo(scale: ScaleId): ScaleInfo {
  return SCALES.find((s) => s.id === scale)!;
}

const tonalNotes = (tonic: string, scale: ScaleId) => Scale.get(`${tonic} ${TONAL_NAMES[scale]}`).notes;

const tonicNames = new Map<string, string>();

// A seven-note mode is spelled from whichever enharmonic tonic needs fewer accidentals (E♭ locrian
// would need B♭♭, D♯ locrian does not). Ties and shorter scales keep the conventional key names.
function chooseTonicName(tonicPc: number, scale: ScaleId): string {
  const conventional = tonicSpelling(tonicPc, scaleInfo(scale).minorLike);
  if (tonalNotes(conventional, scale).length !== 7) return conventional;

  const cost = (tonic: string) => {
    const counts = tonalNotes(tonic, scale).map(accidentalCount);
    return counts.some((count) => count > 1) ? Infinity : counts.reduce((sum, count) => sum + count, 0);
  };
  const other = enharmonicSpellings(tonicPc).find((name) => name !== conventional);
  return other !== undefined && cost(other) < cost(conventional) ? other : conventional;
}

export function tonicName(tonicPc: number, scale: ScaleId): string {
  const key = `${tonicPc}:${scale}`;
  if (!tonicNames.has(key)) tonicNames.set(key, chooseTonicName(tonicPc, scale));
  return tonicNames.get(key)!;
}

export function keyTitle(tonicPc: number, scale: ScaleId): string {
  const name = russianNoteName(tonicName(tonicPc, scale));
  return `${name[0]!.toUpperCase()}${name.slice(1)} ${scaleInfo(scale).label}`;
}

export function degreeLabel(interval: string): { degree: string; degreeNumber: DegreeNumber } {
  const degreeNumber = Number.parseInt(interval, 10) as DegreeNumber;
  const quality = interval.slice(String(degreeNumber).length);
  const lowered = PERFECT_DEGREES.has(degreeNumber) ? quality === 'd' : quality === 'm';
  const accidental = lowered ? '♭' : quality === 'A' ? '♯' : '';
  return { degree: `${accidental}${degreeNumber}`, degreeNumber };
}

export function scaleNotes(tonicPc: number, scale: ScaleId): ScaleNote[] {
  const { notes, intervals } = Scale.get(`${tonicName(tonicPc, scale)} ${TONAL_NAMES[scale]}`);
  return notes.map((name, i) => ({
    note: formatNote(withoutDoubleAccidental(name)),
    pc: Note.chroma(name)!,
    ...degreeLabel(intervals[i]!),
  }));
}

const STEP_NAMES: Record<number, string> = { 1: 'П', 2: 'Т', 3: 'Т+П' };

export function scaleSteps(scale: ScaleId): string[] {
  const pcs = scaleNotes(0, scale).map((note) => note.pc);
  return pcs.map((pc, i) => STEP_NAMES[((pcs[(i + 1) % pcs.length]! - pc + 12) % 12) || 12]!);
}
