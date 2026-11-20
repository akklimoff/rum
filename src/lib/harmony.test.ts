import { expect, test } from 'vitest';
import { chordAt, chordPlacements, harmonyTimeline, type ChordMark } from './harmony';

const mark = (bar: number, tick: number, name: string) => ({ bar, tick, name });
const part = (capo: number, ...marks: ChordMark[]) => ({ capo, marks });

test('the timeline is in sounding pitch, in time order, without repeats', () => {
  expect(harmonyTimeline([part(5, mark(1, 3840, 'Em'), mark(0, 0, 'G'), mark(0, 1920, 'G'))]))
    .toEqual([{ tick: 0, name: 'C' }, { tick: 3840, name: 'Am' }]);
});

test('in each bar the part with chords in the most bars wins, the earliest on a tie', () => {
  const main = part(0, mark(1, 3840, 'C'), mark(2, 7680, 'F'), mark(3, 11520, 'G'));
  const other = part(0, mark(0, 0, 'Em7'), mark(1, 3840, 'Am'));
  expect(harmonyTimeline([other, main]).map((c) => c.name)).toEqual(['Em7', 'C', 'F', 'G']);
  expect(harmonyTimeline([part(0, mark(0, 0, 'D')), part(0, mark(0, 0, 'G'))]).map((c) => c.name)).toEqual(['D']);
});

test('each part is shifted by its own capo', () => {
  expect(harmonyTimeline([part(0, mark(1, 3840, 'C'), mark(2, 7680, 'F')), part(7, mark(0, 0, 'Em'))]).map((c) => c.name))
    .toEqual(['Bm', 'C', 'F']);
});

test('no chord marks anywhere means no harmony', () => {
  expect(harmonyTimeline([part(0)])).toEqual([]);
  expect(harmonyTimeline([])).toEqual([]);
});

test('the chord at a moment is the last change before it', () => {
  const timeline = [{ tick: 960, name: 'C' }, { tick: 3840, name: 'Am' }];
  expect(chordAt(timeline, 0)).toBeNull();
  expect(chordAt(timeline, 960)?.name).toBe('C');
  expect(chordAt(timeline, 5000)?.name).toBe('Am');
});

test('a chord goes on the beat that starts with it, or on the one still sounding', () => {
  const beats = [{ tick: 0, duration: 1920 }, { tick: 1920, duration: 1920 }, { tick: 3840, duration: 960 }];
  const placed = chordPlacements(beats, [{ tick: 0, name: 'C' }, { tick: 2880, name: 'F' }, { tick: 3840, name: 'G' }]);
  expect([...placed]).toEqual([[0, 'C'], [1, 'F'], [2, 'G']]);
});

test('one beat carries one chord: the first change inside it', () => {
  expect([...chordPlacements([{ tick: 0, duration: 3840 }], [{ tick: 0, name: 'C' }, { tick: 1920, name: 'G' }])]).toEqual([[0, 'C']]);
});
