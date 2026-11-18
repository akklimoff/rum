import { expect, test } from 'vitest';
import { INTERVALS, intervalInfo, intervalNoteNames, intervalShapes, neckNotes } from './index';

const at = (positions: { string: number; fret: number }[]) => positions.map((p) => [p.string, p.fret]);

test('there are twelve intervals from a minor second to an octave', () => {
  expect(INTERVALS.map((i) => i.semitones)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  expect(intervalInfo('P5')).toMatchObject({ short: 'ч5', name: 'чистая квинта', degree: '5', degreeNumber: 5 });
  expect(intervalInfo('m3')).toMatchObject({ short: 'м3', degree: '♭3', degreeNumber: 3 });
  expect(intervalInfo('P8')).toMatchObject({ degree: '8', degreeNumber: 1 });
});

test('a fifth from C on the fifth string: nearby strings plus the same string', () => {
  expect(at(intervalShapes({ string: 4, fret: 3 }, 7))).toEqual([
    [2, 0],
    [3, 5],
    [4, 10],
  ]);
});

test('the major third shape shifts by a fret across the G and B strings', () => {
  expect(at(intervalShapes({ string: 3, fret: 5 }, 4))).toEqual([
    [2, 4],
    [3, 9],
  ]);
  expect(at(intervalShapes({ string: 2, fret: 5 }, 4))).toEqual([
    [1, 5],
    [2, 9],
  ]);
});

test('shapes never leave the neck', () => {
  expect(at(intervalShapes({ string: 0, fret: 14 }, 7))).toEqual([]);
});

test('interval notes are spelled by letter distance', () => {
  expect(intervalNoteNames({ string: 4, fret: 3 }, 'P5')).toEqual({ root: 'C', target: 'G' });
  expect(intervalNoteNames({ string: 4, fret: 3 }, 'm3')).toEqual({ root: 'C', target: 'Eb' });
  expect(intervalNoteNames({ string: 5, fret: 0 }, 'M3')).toEqual({ root: 'E', target: 'G#' });
});

test('every position of the neck has a note name', () => {
  const sharps = neckNotes('sharps');
  expect(sharps).toHaveLength(6 * 16);
  const firstString = sharps.filter((n) => n.string === 0).map((n) => n.note);
  expect(firstString.slice(0, 4)).toEqual(['E', 'F', 'F#', 'G']);
  expect(neckNotes('flats').find((n) => n.string === 0 && n.fret === 2)).toMatchObject({ note: 'Gb', pc: 6, natural: false });
  expect(sharps.filter((n) => n.natural && n.string === 5 && n.fret <= 12).map((n) => n.note)).toEqual([
    'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E',
  ]);
});
