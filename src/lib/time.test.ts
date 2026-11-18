import { expect, test } from 'vitest';
import { formatTime } from './time';

test('formats playback time as minutes and seconds', () => {
  expect(formatTime(0)).toBe('0:00');
  expect(formatTime(9_400)).toBe('0:09');
  expect(formatTime(75_000)).toBe('1:15');
  expect(formatTime(-5)).toBe('0:00');
});
