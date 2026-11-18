import { expect, test } from 'vitest';
import { diatonicChords } from './index';

test('C major triads', () => {
  expect(diatonicChords(0, 'major').map((c) => c.symbol)).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
  expect(diatonicChords(0, 'major').map((c) => c.roman)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
});

test('roman numerals in minor are written relative to major', () => {
  expect(diatonicChords(9, 'minor').map((c) => c.roman)).toEqual(['i', 'ii°', '♭III', 'iv', 'v', '♭VI', '♭VII']);
});

test('C mixolydian has the borrowed-sounding B♭ as ♭VII', () => {
  expect(diatonicChords(0, 'mixolydian')[6]).toEqual({
    symbol: 'B♭',
    roman: '♭VII',
    notes: ['B♭', 'D', 'F'],
    pcs: [10, 2, 5],
  });
});

test('raised degrees keep their sharp in the numeral', () => {
  expect(diatonicChords(5, 'lydian')[3]!.roman).toBe('♯iv°');
});

test('scales without seven notes have no diatonic chords', () => {
  expect(diatonicChords(4, 'minor-pentatonic')).toEqual([]);
  expect(diatonicChords(9, 'blues')).toEqual([]);
});
