// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import * as alphaTab from '@coderline/alphatab';
import { expect, test } from 'vitest';
import { chordAt } from './harmony';
import { addHarmony, chordMarks, songHarmony } from './scoreChords';

const WYWH = 'public/tabs/wish-you-were-here.gp';
const HOTEL = 'public/tabs/hotel-california-solo.gp';
const OASIS = 'public/tabs/dont-look-back-in-anger.gp';

const load = (path: string) => alphaTab.importer.ScoreLoader.loadScoreFromBytes(new Uint8Array(readFileSync(path)));

test.skipIf(!existsSync(WYWH))('Wish You Were Here gets its intro chords from the 12-string and the verse from the Martin D-35', () => {
  const harmony = songHarmony(load(WYWH));
  expect(harmony.slice(0, 2)).toEqual([{ tick: 7680, name: 'Em7' }, { tick: 11520, name: 'G' }]);
  expect(chordAt(harmony, 76320)?.name).toBe('G');
});

test.skipIf(!existsSync(HOTEL))('Hotel California sounds a fifth above its capo-7 shapes', () => {
  expect(songHarmony(load(HOTEL))[0]).toEqual({ tick: 1200, name: 'F♯7' });
});

test.skipIf(!existsSync(OASIS))('Oasis follows the piano', () => {
  expect(songHarmony(load(OASIS)).slice(0, 2).map((c) => c.name)).toEqual(['C', 'F']);
});

test.skipIf(!existsSync(OASIS))('after adding the harmony the lead part shows chords, drums do not, rhythm parts keep their own names', () => {
  const oasis = load(OASIS);
  const ownNames = chordMarks(oasis.tracks[2]!).map((m) => m.name);
  addHarmony(alphaTab, oasis, songHarmony(oasis));
  expect(chordMarks(oasis.tracks[3]!).length).toBeGreaterThan(0);
  expect(chordMarks(oasis.tracks[15]!)).toEqual([]);
  expect(chordMarks(oasis.tracks[2]!).map((m) => m.name)).toEqual(ownNames);
});

test.skipIf(!existsSync(OASIS))('a song without chords is left as it was', () => {
  const oasis = load(OASIS);
  const before = oasis.tracks.map((track) => chordMarks(track).length);
  addHarmony(alphaTab, oasis, []);
  expect(oasis.tracks.map((track) => chordMarks(track).length)).toEqual(before);
});
