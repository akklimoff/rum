import { expect, test } from 'vitest';
import {
  CHORD_TYPES,
  PROGRESSIONS,
  buildChord,
  closeVoicing,
  diatonicChords,
  positionMidi,
  progressionChords,
  scaleSteps,
} from './index';

test('the major scale formula is tone-tone-semitone-tone-tone-tone-semitone', () => {
  expect(scaleSteps('major')).toEqual(['Т', 'Т', 'П', 'Т', 'Т', 'Т', 'П']);
  expect(scaleSteps('minor-pentatonic')).toEqual(['Т+П', 'Т', 'Т', 'Т+П', 'Т']);
});

test('chords of a major key carry their function', () => {
  expect(diatonicChords(0, 'major').map((c) => c.function)).toEqual(['T', 'S', 'T', 'S', 'D', 'T', 'D']);
  expect(diatonicChords(9, 'minor').map((c) => c.function)).toEqual(['T', 'S', 'T', 'S', 'D', 'S', 'D']);
  expect(diatonicChords(0, 'dorian')[0]!.function).toBeUndefined();
});

test('seventh chords of C major', () => {
  const chords = diatonicChords(0, 'major', 'sevenths');
  expect(chords.map((c) => c.symbol)).toEqual(['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7♭5']);
  expect(chords.map((c) => c.roman)).toEqual(['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7']);
  expect(chords[4]!.notes).toEqual(['G', 'B', 'D', 'F']);
});

test('eight chord types: four triads and four sevenths', () => {
  expect(CHORD_TYPES.map((t) => t.id)).toEqual(['maj', 'min', 'dim', 'aug', 'maj7', '7', 'm7', 'm7b5']);
});

test('a chord is built from its root by stacked thirds', () => {
  expect(buildChord(0, 'maj')).toMatchObject({ symbol: 'C', thirds: ['б3', 'м3'] });
  expect(buildChord(0, 'maj').tones.map((t) => [t.degree, t.note])).toEqual([['1', 'C'], ['3', 'E'], ['5', 'G']]);
  expect(buildChord(9, 'min').tones.map((t) => [t.degree, t.note])).toEqual([['1', 'A'], ['♭3', 'C'], ['5', 'E']]);
  expect(buildChord(7, '7')).toMatchObject({ symbol: 'G7', thirds: ['б3', 'м3', 'м3'] });
  expect(buildChord(7, '7').tones.map((t) => t.degree)).toEqual(['1', '3', '5', '♭7']);
  expect(buildChord(11, 'm7b5').tones.map((t) => [t.degree, t.note])).toEqual([['1', 'B'], ['♭3', 'D'], ['♭5', 'F'], ['♭7', 'A']]);
  expect(buildChord(3, 'maj').symbol).toBe('E♭');
  expect(buildChord(0, 'aug').tones.at(-1)).toMatchObject({ degree: '♯5', note: 'G♯' });
});

test('a close voicing climbs from the root', () => {
  expect(closeVoicing([0, 4, 7])).toEqual([48, 52, 55]);
  expect(closeVoicing([7, 11, 2, 5])).toEqual([55, 59, 62, 65]);
});

test('a fretted position has a pitch', () => {
  expect(positionMidi(5, 0)).toBe(40);
  expect(positionMidi(0, 12)).toBe(76);
});

test('cadences and progressions resolve in any major key', () => {
  expect(PROGRESSIONS.map((p) => p.id)).toEqual(['authentic', 'plagal', 'deceptive', 'pop', 'two-five-one', 'fifties', 'blues']);
  expect(progressionChords(0, 'plagal').map((c) => c.symbol)).toEqual(['F', 'C']);
  expect(progressionChords(7, 'pop').map((c) => c.symbol)).toEqual(['G', 'D', 'Em', 'C']);
  expect(progressionChords(0, 'two-five-one').map((c) => c.roman)).toEqual(['ii', 'V', 'I']);
  expect(progressionChords(0, 'blues')).toHaveLength(12);
});
