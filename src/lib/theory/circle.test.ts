import { expect, test } from 'vitest';
import { circleOfFifths, progressionPath } from './index';

test('the circle goes by fifths with relative minors inside', () => {
  const cells = circleOfFifths(0);
  expect(cells.filter((c) => c.ring === 'major').map((c) => c.label)).toEqual(['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F']);
  expect(cells.filter((c) => c.ring === 'minor').slice(0, 4).map((c) => c.label)).toEqual(['Am', 'Em', 'Bdim', 'F♯m']);
});

test('the seven chords of a key sit next to each other', () => {
  const inKey = circleOfFifths(0).filter((c) => c.degree !== undefined);
  expect(inKey.map((c) => [c.ring, c.position, c.label, c.roman])).toEqual([
    ['major', 0, 'C', 'I'],
    ['major', 1, 'G', 'V'],
    ['major', 11, 'F', 'IV'],
    ['minor', 0, 'Am', 'vi'],
    ['minor', 1, 'Em', 'iii'],
    ['minor', 2, 'Bdim', 'vii°'],
    ['minor', 11, 'Dm', 'ii'],
  ]);
  expect(circleOfFifths(7).filter((c) => c.roman === 'I')[0]).toMatchObject({ position: 1, label: 'G' });
});

test('a progression becomes a path of moves without repeats', () => {
  expect(progressionPath('pop')).toEqual([[0, 4], [4, 5], [5, 3], [3, 0]]);
  expect(progressionPath('plagal')).toEqual([[3, 0]]);
  expect(progressionPath('blues')).toEqual([[0, 3], [3, 0], [0, 4], [4, 3], [4, 0]]);
});
