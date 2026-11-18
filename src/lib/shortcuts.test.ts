import { expect, test } from 'vitest';
import { shortcutAction } from './shortcuts';

const key = (code: string, extra: Partial<Parameters<typeof shortcutAction>[0]> = {}) =>
  shortcutAction({ code, ctrlKey: false, metaKey: false, altKey: false, typing: false, ...extra });

test('space plays or pauses', () => {
  expect(key('Space')).toBe('playPause');
});

test('letters work by key position, whatever the keyboard layout', () => {
  expect(['KeyL', 'KeyM', 'KeyC', 'KeyG'].map((code) => key(code))).toEqual(['loop', 'metronome', 'countIn', 'neck']);
});

test('arrows move by a bar, digits pick the speed, Home rewinds', () => {
  expect(['ArrowLeft', 'ArrowRight', 'Digit1', 'Digit2', 'Digit3', 'Home'].map((code) => key(code))).toEqual([
    'previousBar', 'nextBar', 'speed50', 'speed75', 'speed100', 'toStart',
  ]);
});

test('nothing happens while typing or with a modifier held', () => {
  expect(key('Space', { typing: true })).toBeNull();
  expect(key('KeyL', { metaKey: true })).toBeNull();
  expect(key('KeyC', { ctrlKey: true })).toBeNull();
  expect(key('ArrowLeft', { altKey: true })).toBeNull();
});

test('other keys are left alone', () => {
  expect(key('KeyQ')).toBeNull();
});
