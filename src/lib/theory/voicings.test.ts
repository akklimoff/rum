import { Note } from 'tonal';
import { expect, test } from 'vitest';
import { CHORD_TYPES, STANDARD_TUNING, buildChord, chordVoicings, type ChordTypeId, type Voicing } from './index';

const ROOTS = Array.from({ length: 12 }, (_, pc) => pc);
const shapes = (root: number, type: ChordTypeId) => chordVoicings(buildChord(root, type)).map((v) => v.frets);
const everyChord = () => ROOTS.flatMap((root) => CHORD_TYPES.map((type) => ({ root, type: type.id })));

const sounding = (frets: Voicing['frets']) =>
  frets.flatMap((fret, string) => (fret === null ? [] : [{ string, fret, midi: Note.midi(STANDARD_TUNING[string]!)! + fret }]));

const fingers = (frets: Voicing['frets']) => {
  const fretted = sounding(frets).filter((note) => note.fret > 0);
  const lowest = Math.min(...fretted.map((note) => note.fret));
  const barre = fretted.filter((note) => note.fret === lowest).map((note) => note.string);
  const overOpen = frets.slice(Math.min(...barre), Math.max(...barre) + 1).includes(0);
  return overOpen ? fretted.length : fretted.length - barre.length + 1;
};

test('the classic shapes are found', () => {
  expect(shapes(0, 'maj')).toContainEqual([0, 1, 0, 2, 3, null]);
  expect(shapes(9, 'min')).toContainEqual([0, 1, 2, 2, 0, null]);
  expect(shapes(5, 'maj')).toContainEqual([1, 1, 2, 3, 3, 1]);
  expect(shapes(7, '7')).toContainEqual([1, 0, 0, 0, 2, 3]);
});

test('every shape is playable and is the chord', () => {
  for (const { root, type } of everyChord()) {
    const chord = buildChord(root, type);
    for (const { frets, startFret } of chordVoicings(chord)) {
      const notes = sounding(frets);
      const bass = notes.reduce((low, note) => (note.midi < low.midi ? note : low));
      expect(bass.midi % 12, `${chord.symbol} ${frets}`).toBe(root);
      const heard = new Set(notes.map((note) => note.midi % 12));
      const missing = chord.tones.filter((tone) => !heard.has(tone.pc));
      const fifthMayGo = chord.tones.length === 4 && missing.every((tone) => tone.degreeNumber === 5);
      expect(missing.length === 0 || fifthMayGo, `${chord.symbol} ${frets}`).toBe(true);
      const strings = notes.map((note) => note.string);
      expect(strings, `${chord.symbol} ${frets}`).toEqual(Array.from({ length: strings.length }, (_, i) => strings[0]! + i));
      expect(notes.length).toBeGreaterThanOrEqual(4);
      const pressed = notes.filter((note) => note.fret > 0).map((note) => note.fret);
      expect(Math.max(...pressed) - Math.min(...pressed), `${chord.symbol} ${frets}`).toBeLessThanOrEqual(3);
      expect(fingers(frets), `${chord.symbol} ${frets}`).toBeLessThanOrEqual(4);
      const firstFret = Math.max(startFret, 1);
      expect(pressed.every((fret) => fret >= firstFret && fret < firstFret + 4), `${chord.symbol} ${frets} from ${startFret}`).toBe(true);
    }
  }
});

test('major, minor and seventh chords on every root have at least two shapes', () => {
  for (const root of ROOTS) {
    for (const type of ['maj', 'min', '7', 'm7', 'maj7'] as const) {
      expect(shapes(root, type).length, `${buildChord(root, type).symbol}`).toBeGreaterThanOrEqual(2);
    }
  }
});

test('at most four shapes, ordered along the neck, the open one first', () => {
  for (const { root, type } of everyChord()) {
    const voicings = chordVoicings(buildChord(root, type));
    expect(voicings.length).toBeLessThanOrEqual(4);
    const starts = voicings.map((voicing) => voicing.startFret);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
    if (voicings.some((voicing) => voicing.frets.includes(0))) expect(voicings[0]!.frets).toContain(0);
  }
});

test('first-position shapes are drawn from the nut, higher ones from their lowest fret', () => {
  const start = (root: number, type: ChordTypeId, frets: Voicing['frets']) =>
    chordVoicings(buildChord(root, type)).find((voicing) => voicing.frets.join() === frets.join())?.startFret;
  expect(start(5, 'maj', [1, 1, 2, 3, 3, 1])).toBe(0);
  expect(start(7, '7', [1, 0, 0, 0, 2, 3])).toBe(0);
  const high = chordVoicings(buildChord(0, 'maj')).filter((voicing) => Math.max(...voicing.frets.map((fret) => fret ?? 0)) > 4);
  expect(high.length).toBeGreaterThan(0);
  for (const { frets, startFret } of high) {
    expect(startFret).toBe(Math.min(...frets.filter((fret): fret is number => fret !== null && fret > 0)));
  }
});
