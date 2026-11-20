import { Note } from 'tonal';
import { expect, test } from 'vitest';
import { CHORD_TYPES, STANDARD_TUNING, buildChord, chordVoicings, type ChordTypeId, type Voicing } from './index';

const ROOTS = Array.from({ length: 12 }, (_, pc) => pc);
const shapes = (root: number, type: ChordTypeId) => chordVoicings(buildChord(root, type)).map((v) => v.frets);
const everyChord = () => ROOTS.flatMap((root) => CHORD_TYPES.map((type) => ({ root, type: type.id })));

const sounding = (frets: Voicing['frets']) =>
  frets.flatMap((fret, string) => (fret === null ? [] : [{ string, fret, midi: Note.midi(STANDARD_TUNING[string]!)! + fret }]));

test('the classic shapes are found', () => {
  expect(shapes(0, 'maj')).toContainEqual([0, 1, 0, 2, 3, null]);
  expect(shapes(9, 'min')).toContainEqual([0, 1, 2, 2, 0, null]);
  expect(shapes(5, 'maj')).toContainEqual([1, 1, 2, 3, 3, 1]);
  expect(shapes(7, '7')).toContainEqual([1, 0, 0, 0, 2, 3]);
});

test('a barre broken by an open string cannot hide a higher fret between its ends', () => {
  const crossedFingers: [number, ChordTypeId, Voicing['frets']][] = [
    [5, 'maj', [null, 1, 2, 3, 0, 1]],
    [10, 'maj', [1, 3, 3, 0, 1, null]],
    [11, 'min', [2, 0, 4, 0, 2, null]],
    [6, 'min', [null, 2, 2, 4, 0, 2]],
    [7, 'm7', [1, 3, 0, 0, 1, 3]],
    [5, 'maj7', [0, 1, 2, 2, 0, 1]],
    [5, '7', [null, 1, 2, 1, 0, 1]],
    [10, 'maj7', [1, 3, 2, 0, 1, null]],
    [10, '7', [1, 3, 1, 0, 1, null]],
  ];
  for (const [root, type, frets] of crossedFingers) expect(shapes(root, type), `${buildChord(root, type).symbol}`).not.toContainEqual(frets);
  expect(shapes(9, '7')).toContainEqual([0, 2, 0, 2, 0, null]);
});

test('a shape needs at most four fingers, a barre on the lowest fret counting as one', () => {
  expect(shapes(7, 'm7')).not.toContainEqual([3, 3, 0, 3, 1, 3]);
  expect(shapes(5, 'maj')).toContainEqual([1, 1, 2, 3, 3, 1]);
});

test('pressed frets stay within three frets, the lowest and highest included', () => {
  expect(shapes(0, 'maj')).not.toContainEqual([8, 5, 5, 5, 7, 8]);
});

test('each string-group shape is movable, so the open shape has no near-copies', () => {
  expect(shapes(0, 'maj')).toContainEqual([3, 5, 5, 5, 3, null]);
  expect(shapes(7, 'maj')).toContainEqual([3, 3, 4, 5, 5, 3]);
  for (const { root, type } of everyChord()) {
    expect(shapes(root, type).filter((frets) => frets.includes(0)).length, buildChord(root, type).symbol).toBeLessThanOrEqual(1);
  }
});

test('a half-diminished shape never drops its flat fifth', () => {
  for (const root of ROOTS) {
    const chord = buildChord(root, 'm7b5');
    const flatFifth = chord.tones.find((tone) => tone.degree === '♭5')!;
    for (const { frets } of chordVoicings(chord)) {
      expect(sounding(frets).some((note) => note.midi % 12 === flatFifth.pc), `${chord.symbol} ${frets}`).toBe(true);
    }
  }
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
      const fifthMayGo = chord.tones.length === 4 && missing.every((tone) => (tone.pc - root + 12) % 12 === 7);
      expect(missing.length === 0 || fifthMayGo, `${chord.symbol} ${frets}`).toBe(true);
      const strings = notes.map((note) => note.string);
      expect(strings, `${chord.symbol} ${frets}`).toEqual(Array.from({ length: strings.length }, (_, i) => strings[0]! + i));
      expect(notes.length).toBeGreaterThanOrEqual(4);
      const pressed = notes.filter((note) => note.fret > 0).map((note) => note.fret);
      expect(Math.max(...pressed) - Math.min(...pressed), `${chord.symbol} ${frets}`).toBeLessThanOrEqual(2);
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
