import { Note } from 'tonal';
import type { BuiltChord } from './chordTypes';
import { FRET_COUNT, STANDARD_TUNING } from './fretboard';

export interface Voicing {
  frets: (number | null)[];
  startFret: number;
}

type Frets = Voicing['frets'];

interface SoundingNote {
  string: number;
  fret: number;
  midi: number;
}

interface Candidate extends Voicing {
  sounding: number;
  fingers: number;
  stretch: number;
  topFret: number;
  bassString: number;
}

const HAND_SPAN = 4;
const LAST_WINDOW = FRET_COUNT - HAND_SPAN + 1;
const MAX_STRETCH = 2;
const MIN_STRINGS = 4;
const MAX_FINGERS = 4;
const PERFECT_FIFTH = 7;
const ROOT_STRINGS = 3;

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const pcOf = (midi: number) => ((midi % 12) + 12) % 12;

function product<T>(choices: T[][]): T[][] {
  return choices.reduce<T[][]>((combos, options) => combos.flatMap((combo) => options.map((option) => [...combo, option])), [[]]);
}

function windowShapes(openMidis: number[], chordPcs: Set<number>, firstFret: number): Frets[] {
  const choices = openMidis.map((open) => {
    const fretted = range(firstFret, firstFret + HAND_SPAN - 1).filter((fret) => chordPcs.has(pcOf(open + fret)));
    return firstFret === 1 && chordPcs.has(pcOf(open)) ? [0, ...fretted] : fretted;
  });
  const strings = openMidis.length;
  return range(0, strings - MIN_STRINGS).flatMap((first) =>
    range(first + MIN_STRINGS - 1, strings - 1).flatMap((last) =>
      product(choices.slice(first, last + 1)).map((run) => [
        ...Array<null>(first).fill(null),
        ...run,
        ...Array<null>(strings - last - 1).fill(null),
      ]),
    ),
  );
}

function fingerCount(frets: Frets): number {
  const fretted = frets.flatMap((fret, string) => (fret ? [{ string, fret }] : []));
  if (fretted.length === 0) return 0;
  const lowest = Math.min(...fretted.map((note) => note.fret));
  const barre = fretted.filter((note) => note.fret === lowest).map((note) => note.string);
  const underBarre = frets.slice(Math.min(...barre), Math.max(...barre) + 1);
  if (!underBarre.includes(0)) return fretted.length - barre.length + 1;
  // Without a barre, a higher fret between two lowest-fret fingers could only be reached with crossed fingers or the thumb.
  return underBarre.some((fret) => fret !== null && fret > lowest) ? Infinity : fretted.length;
}

function measure(frets: Frets, notes: SoundingNote[], bass: SoundingNote): Candidate {
  const pressed = notes.map((note) => note.fret).filter((fret) => fret > 0);
  const topFret = Math.max(0, ...pressed);
  const lowFret = pressed.length > 0 ? Math.min(...pressed) : 0;
  return {
    frets,
    startFret: topFret <= HAND_SPAN ? 0 : lowFret,
    sounding: notes.length,
    fingers: fingerCount(frets),
    stretch: topFret - lowFret,
    topFret,
    bassString: bass.string,
  };
}

const better = (a: Candidate, b: Candidate) =>
  b.sounding - a.sounding || a.fingers - b.fingers || a.startFret - b.startFret || a.topFret - b.topFret;

export function chordVoicings(chord: BuiltChord, tuning: readonly string[] = STANDARD_TUNING, limit = 4): Voicing[] {
  const openMidis = tuning.map((note) => Note.midi(note)!);
  const root = chord.tones[0]!.pc;
  const chordPcs = new Set(chord.tones.map((tone) => tone.pc));
  const fifthMayGo = chord.tones.length > 3;
  const required = chord.tones.filter((tone) => !(fifthMayGo && pcOf(tone.pc - root) === PERFECT_FIFTH));

  const found = new Map<string, Candidate>();
  for (const firstFret of range(1, LAST_WINDOW)) {
    for (const frets of windowShapes(openMidis, chordPcs, firstFret)) {
      const key = frets.join();
      if (found.has(key)) continue;
      const notes = frets.flatMap((fret, string) => (fret === null ? [] : [{ string, fret, midi: openMidis[string]! + fret }]));
      const bass = notes.reduce((low, note) => (note.midi < low.midi ? note : low));
      const heard = new Set(notes.map((note) => pcOf(note.midi)));
      if (pcOf(bass.midi) !== root || !required.every((tone) => heard.has(tone.pc))) continue;
      const candidate = measure(frets, notes, bass);
      if (candidate.fingers <= MAX_FINGERS && candidate.stretch <= MAX_STRETCH) found.set(key, candidate);
    }
  }

  const ranked = [...found.values()].sort(better);
  const picks: Candidate[] = [];
  const pick = (accept: (candidate: Candidate) => boolean) => {
    const best = ranked.find(accept);
    if (best) picks.push(best);
  };
  const usesOpenString = (candidate: Candidate) => candidate.frets.includes(0);
  pick(usesOpenString);
  for (const fromBass of range(1, ROOT_STRINGS)) {
    pick((candidate) => !usesOpenString(candidate) && candidate.bassString === tuning.length - fromBass);
  }

  return picks
    .slice(0, limit)
    .sort((a, b) => a.startFret - b.startFret)
    .map(({ frets, startFret }) => ({ frets, startFret }));
}
