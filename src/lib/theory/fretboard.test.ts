import { expect, test } from 'vitest';
import { STANDARD_TUNING, fretboardPositions, scaleNotes } from './index';

const cOnly = scaleNotes(0, 'major').filter((n) => n.note === 'C');

test('finds every C on a standard-tuned neck up to fret 15', () => {
  expect(fretboardPositions(cOnly).map((p) => [p.string, p.fret])).toEqual([
    [0, 8],
    [1, 1],
    [1, 13],
    [2, 5],
    [3, 10],
    [4, 3],
    [4, 15],
    [5, 8],
  ]);
});

test('open strings of standard tuning are all in C major', () => {
  const open = fretboardPositions(scaleNotes(0, 'major')).filter((p) => p.fret === 0);
  expect(open.map((p) => p.note.note)).toEqual(['E', 'B', 'G', 'D', 'A', 'E']);
});

test('fret count limits the neck', () => {
  expect(fretboardPositions(cOnly, STANDARD_TUNING, 12)).toHaveLength(6);
});
