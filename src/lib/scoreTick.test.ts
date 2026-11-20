// @vitest-environment node
import * as alphaTab from '@coderline/alphatab';
import { expect, test } from 'vitest';
import { scoreTick } from './scoreTick';

const BAR = 3840;
const played = (start: number, scoreStart: number) => ({ start, end: start + BAR, scoreStart });

test('the second pass of a repeated bar maps back to that bar in the score', () => {
  const bars = [played(0, 0), played(BAR, 0), played(2 * BAR, BAR)];
  expect(scoreTick(960, bars)).toBe(960);
  expect(scoreTick(BAR + 960, bars)).toBe(960);
  expect(scoreTick(2 * BAR + 960, bars)).toBe(BAR + 960);
});

test('a tick at or after the end stays in the last bar played', () => {
  const bars = [played(0, 0), played(BAR, 0)];
  expect(scoreTick(2 * BAR, bars)).toBe(BAR);
  expect(scoreTick(2 * BAR + 960, bars)).toBe(BAR + 960);
});

test('before the bars are known the tick is taken as it is', () => {
  expect(scoreTick(1234, [])).toBe(1234);
});

test("alphaTab's tick cache plays a repeat twice and maps it back", () => {
  const score = alphaTab.importer.ScoreLoader.loadAlphaTex('\\ro :1 0.6 | \\rc 2 2.6 | 3.6');
  const generator = new alphaTab.midi.MidiFileGenerator(score, null, new alphaTab.midi.AlphaSynthMidiFileHandler(new alphaTab.midi.MidiFile()));
  generator.generate();
  const bars = generator.tickLookup.masterBars.map((bar) => ({ start: bar.start, end: bar.end, scoreStart: bar.masterBar.start }));
  expect(bars.map((bar) => bar.scoreStart)).toEqual([0, BAR, 0, BAR, 2 * BAR]);
  expect(scoreTick(2 * BAR + 960, bars)).toBe(960);
  expect(scoreTick(4 * BAR + 960, bars)).toBe(2 * BAR + 960);
});
