import { expect, test } from 'vitest';
import { DEFAULT_STATE, parseState, serializeState } from './explorerState';

test('empty query is C major with degree labels', () => {
  expect(parseState('')).toEqual(DEFAULT_STATE);
  expect(DEFAULT_STATE).toEqual({ tonicPc: 0, scale: 'major', labels: 'degrees' });
});

test('reads key, scale and labels', () => {
  expect(parseState('?key=Bb&scale=mixolydian&labels=notes')).toEqual({
    tonicPc: 10,
    scale: 'mixolydian',
    labels: 'notes',
  });
});

test('accepts an enharmonic spelling of the key', () => {
  expect(parseState('?key=A%23&scale=major').tonicPc).toBe(10);
});

test('garbage falls back to defaults field by field', () => {
  expect(parseState('?key=H&scale=foo&labels=x')).toEqual(DEFAULT_STATE);
  expect(parseState('?key=G&scale=foo')).toEqual({ tonicPc: 7, scale: 'major', labels: 'degrees' });
});

test('writes the key in the spelling of its scale and omits default labels', () => {
  expect(serializeState(DEFAULT_STATE)).toBe('?key=C&scale=major');
  expect(serializeState({ tonicPc: 1, scale: 'minor', labels: 'notes' })).toBe('?key=C%23&scale=minor&labels=notes');
});

test('round-trips', () => {
  const state = { tonicPc: 6, scale: 'lydian', labels: 'notes' } as const;
  expect(parseState(serializeState(state))).toEqual(state);
});
