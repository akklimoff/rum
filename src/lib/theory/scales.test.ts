import { describe, expect, test } from 'vitest';
import { SCALES, formatNote, keyTitle, parseNote, scaleNotes, tonicName, type ScaleId } from './index';

const names = (pc: number, scale: ScaleId) => scaleNotes(pc, scale).map((n) => n.note);
const degrees = (pc: number, scale: ScaleId) => scaleNotes(pc, scale).map((n) => n.degree);

describe('scaleNotes', () => {
  test('C major has no accidentals and plain degrees', () => {
    expect(names(0, 'major')).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    expect(degrees(0, 'major')).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  test('A minor lowers the third, sixth and seventh', () => {
    expect(names(9, 'minor')).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    expect(degrees(9, 'minor')).toEqual(['1', '2', '♭3', '4', '5', '♭6', '♭7']);
  });

  test('F major spells its fourth as B♭', () => {
    expect(names(5, 'major')).toEqual(['F', 'G', 'A', 'B♭', 'C', 'D', 'E']);
  });

  test('E minor pentatonic has five notes', () => {
    expect(names(4, 'minor-pentatonic')).toEqual(['E', 'G', 'A', 'B', 'D']);
    expect(degrees(4, 'minor-pentatonic')).toEqual(['1', '♭3', '4', '5', '♭7']);
  });

  test('C mixolydian has B♭ as ♭7', () => {
    expect(scaleNotes(0, 'mixolydian')[6]).toEqual({ note: 'B♭', pc: 10, degree: '♭7', degreeNumber: 7 });
  });

  test('phrygian has ♭2 and lydian has ♯4', () => {
    expect(degrees(4, 'phrygian')[1]).toBe('♭2');
    expect(degrees(5, 'lydian')[3]).toBe('♯4');
  });

  test('blues scale keeps both fifths under degree number 5', () => {
    expect(degrees(9, 'blues')).toEqual(['1', '♭3', '4', '♭5', '5', '♭7']);
    expect(scaleNotes(9, 'blues').map((n) => n.degreeNumber)).toEqual([1, 3, 4, 5, 5, 7]);
  });
});

describe('note spelling', () => {
  test('tonic spelling follows the scale family', () => {
    expect(tonicName(1, 'major')).toBe('Db');
    expect(tonicName(1, 'minor')).toBe('C#');
    expect(tonicName(8, 'major')).toBe('Ab');
    expect(tonicName(8, 'minor')).toBe('G#');
  });

  test('formatNote uses music accidentals', () => {
    expect(formatNote('Bb')).toBe('B♭');
    expect(formatNote('F#')).toBe('F♯');
  });

  test('parseNote accepts any spelling and rejects non-notes', () => {
    expect(parseNote('B♭')).toBe(10);
    expect(parseNote('a#')).toBe(10);
    expect(parseNote('H')).toBeNull();
    expect(parseNote('')).toBeNull();
  });

  test('keyTitle is the Russian key name', () => {
    expect(keyTitle(0, 'major')).toBe('До мажор');
    expect(keyTitle(10, 'major')).toBe('Си-бемоль мажор');
    expect(keyTitle(1, 'minor')).toBe('До-диез минор');
  });
});

test('six scales are shown before the rest', () => {
  expect(SCALES.filter((s) => s.primary).map((s) => s.id)).toEqual([
    'major',
    'minor',
    'major-pentatonic',
    'minor-pentatonic',
    'blues',
    'mixolydian',
  ]);
  expect(SCALES).toHaveLength(10);
});

describe('spelling across every key', () => {
  const all = SCALES.flatMap((scale) => Array.from({ length: 12 }, (_, pc) => ({ pc, scale: scale.id })));

  test('no key shows a double accidental', () => {
    const doubled = all.filter(({ pc, scale }) => names(pc, scale).some((n) => n.length > 2));
    expect(doubled).toEqual([]);
  });

  test('every key starts on its tonic and never repeats a pitch', () => {
    for (const { pc, scale } of all) {
      const notes = scaleNotes(pc, scale);
      expect(notes[0]!.pc).toBe(pc);
      expect(new Set(notes.map((n) => n.pc)).size).toBe(notes.length);
    }
  });

  test('seven-note modes take the spelling with fewer accidentals', () => {
    expect(tonicName(3, 'locrian')).toBe('D#');
    expect(tonicName(3, 'phrygian')).toBe('D#');
    expect(tonicName(10, 'locrian')).toBe('A#');
    expect(tonicName(6, 'lydian')).toBe('Gb');
    expect(tonicName(6, 'major')).toBe('F#');
    expect(tonicName(3, 'minor')).toBe('Eb');
  });

  test('E♭ blues keeps its name and writes the lowered fifth as A', () => {
    expect(tonicName(3, 'blues')).toBe('Eb');
    expect(names(3, 'blues')).toEqual(['E♭', 'G♭', 'A♭', 'A', 'B♭', 'D♭']);
    expect(degrees(3, 'blues')[3]).toBe('♭5');
  });
});
