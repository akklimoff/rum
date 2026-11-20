import { expect, test } from 'vitest';
import { kindOfTrack, trackKind } from './trackKind';

test('a percussion staff is drums whatever its program', () => {
  expect(trackKind({ percussion: true, program: 30 })).toBe('drums');
});

test('bass programs are bass', () => {
  expect([32, 33, 39].map((program) => trackKind({ percussion: false, program }))).toEqual(['bass', 'bass', 'bass']);
});

test('guitar programs are guitar', () => {
  expect([24, 27, 30, 31].map((program) => trackKind({ percussion: false, program }))).toEqual([
    'guitar', 'guitar', 'guitar', 'guitar',
  ]);
});

test('anything else is just an instrument', () => {
  expect(trackKind({ percussion: false, program: 0 })).toBe('other');
  expect(trackKind({ percussion: false, program: 52 })).toBe('other');
});

test('a track is judged by its first staff and its sound', () => {
  expect(kindOfTrack({ staves: [{ isPercussion: true }], playbackInfo: { program: 0 } })).toBe('drums');
  expect(kindOfTrack({ staves: [{ isPercussion: false }], playbackInfo: { program: 25 } })).toBe('guitar');
  expect(kindOfTrack({ staves: [], playbackInfo: { program: 67 } })).toBe('other');
});
