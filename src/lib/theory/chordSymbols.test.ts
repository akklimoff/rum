import { expect, test } from 'vitest';
import { chordRoman, transposeChordName } from './chordSymbols';

const C = { tonicPc: 0, scale: 'major' } as const;
const Am = { tonicPc: 9, scale: 'minor' } as const;

test('roman numerals in a major key', () => {
  expect(['Am', 'E', 'Fm', 'G7', 'Bdim', 'Bm7b5', 'Fmaj7', 'C/E', 'Gadd11'].map((n) => chordRoman(n, C).roman))
    .toEqual(['vi', 'III', 'iv', 'V7', 'vii°', 'viiø7', 'IVmaj7', 'I', 'V']);
});

test('a minor seventh is lowercase with a 7', () => {
  expect(chordRoman('Em7', { tonicPc: 7, scale: 'major' }).roman).toBe('vi7');
});

test('extended and added-tone minor chords stay lowercase without extra marks', () => {
  expect(['Am9', 'Am6', 'Amadd9'].map((n) => chordRoman(n, C).roman)).toEqual(['vi', 'vi', 'vi']);
});

test('a name without a root has no numeral', () => {
  expect(chordRoman('N.C.', C)).toEqual({ roman: '', degreeNumber: null });
});

test('roman numerals in a minor key are counted from the major scale', () => {
  expect(['Am', 'C', 'G', 'E', 'Bdim', 'F'].map((n) => chordRoman(n, Am).roman))
    .toEqual(['i', '♭III', '♭VII', 'V', 'ii°', '♭VI']);
});

test('the colour degree is the root inside the key, or none', () => {
  expect(chordRoman('Am', C).degreeNumber).toBe(6);
  expect(chordRoman('E', C).degreeNumber).toBe(3);
  expect(chordRoman('B♭', C).degreeNumber).toBeNull();
});

test('names from Guitar Pro files are read with their own sharps, flats and brackets', () => {
  expect(chordRoman('C♯m7(♭5)', { tonicPc: 2, scale: 'major' }).roman).toBe('viiø7');
});

test('a capo shifts chord shapes to what sounds', () => {
  expect(['G', 'G/F♯', 'Em', 'B7/D♯'].map((n) => transposeChordName(n, 5))).toEqual(['C', 'C/B', 'Am', 'E7/G♯']);
  expect(transposeChordName('C♯m7(♭5)', 7)).toBe('G♯m7♭5');
  expect(transposeChordName('Gadd11', 0)).toBe('Gadd11');
});

test('names without a capo are shown with ♯ and ♭ too', () => {
  expect(transposeChordName('E/G#', 0)).toBe('E/G♯');
  expect(transposeChordName('C#m7b5', 0)).toBe('C♯m7♭5');
  expect(transposeChordName('Bbm7(b5)/Ab', 0)).toBe('B♭m7(♭5)/A♭');
  expect(transposeChordName('E7#9', 0)).toBe('E7♯9');
  expect(transposeChordName('F#7 sus4', 0)).toBe('F♯7 sus4');
  expect(transposeChordName('N.C.', 0)).toBe('N.C.');
});

test('a lowercase b that is not a flat stays a letter', () => {
  expect(transposeChordName('Bbsus2 (barre)', 0)).toBe('B♭sus2 (barre)');
  expect(transposeChordName('Ebsus4 barre', 2)).toBe('Fsus4 barre');
});

test('a capo never spells a chord with E♯, B♯, C♭, F♭ or a double flat', () => {
  expect(transposeChordName('C♯m', 4)).toBe('Fm');
  expect(transposeChordName('G♯m', 4)).toBe('Cm');
  expect(transposeChordName('B♭', 1)).toBe('B');
  expect(transposeChordName('A♭maj7', 1)).toBe('Amaj7');
  expect(transposeChordName('E♭', 6)).toBe('A');
  expect(transposeChordName('E♭', 8)).toBe('B');
  expect(transposeChordName('G♯m', 9)).toBe('Fm');
  expect(transposeChordName('A/C♯', 4)).toBe('C♯/F');
});
