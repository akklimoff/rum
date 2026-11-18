import { expect, test } from 'vitest';
import { detectKey, keyShortName } from './key';

const counts = (weights: Record<number, number>) => Array.from({ length: 12 }, (_, pc) => weights[pc] ?? 0);

test('a melody resting on C, E and G of the white keys is in C major', () => {
  expect(detectKey(counts({ 0: 8, 2: 3, 4: 5, 5: 3, 7: 6, 9: 3, 11: 2 }))).toEqual({ tonicPc: 0, scale: 'major' });
});

test('the same notes resting on A, C and E are in A minor', () => {
  expect(detectKey(counts({ 9: 8, 11: 3, 0: 5, 2: 3, 4: 6, 5: 3, 7: 2 }))).toEqual({ tonicPc: 9, scale: 'minor' });
});

test('B minor with a raised seventh from the dominant chord is still B minor', () => {
  expect(detectKey(counts({ 11: 9, 1: 4, 2: 6, 4: 4, 6: 7, 7: 3, 9: 3, 10: 2 }))).toEqual({ tonicPc: 11, scale: 'minor' });
});

test('silence has no key', () => {
  expect(detectKey(counts({}))).toBeNull();
});

test('a key is written short: tonic and min or maj', () => {
  expect(keyShortName({ tonicPc: 11, scale: 'minor' })).toBe('Bmin');
  expect(keyShortName({ tonicPc: 0, scale: 'major' })).toBe('Cmaj');
  expect(keyShortName({ tonicPc: 10, scale: 'major' })).toBe('B♭maj');
  expect(keyShortName({ tonicPc: 6, scale: 'minor' })).toBe('F♯min');
});
