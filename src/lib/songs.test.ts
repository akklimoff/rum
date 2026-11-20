// @vitest-environment node
import { copyFileSync, existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { loadSongs, slugFromFileName } from './songs';

const HOTEL = 'public/tabs/hotel-california-solo.gp';
// Tab files are not kept in git, so a fresh clone has nothing to read here.
const withTab = test.skipIf(!existsSync(HOTEL));

const folderWith = (files: Record<string, string | null>) => {
  const dir = mkdtempSync(join(tmpdir(), 'rum-tabs-'));
  for (const [name, source] of Object.entries(files)) {
    if (source) copyFileSync(source, join(dir, name));
    else writeFileSync(join(dir, name), 'not a tab');
  }
  return dir;
};

test('a slug is the file name in lower case with dashes', () => {
  expect(slugFromFileName('Eagles-Hotel California Solo-11-12-2026.gp')).toBe('eagles-hotel-california-solo-11-12-2026');
  expect(slugFromFileName('Nothing_Else  Matters (intro).gp5')).toBe('nothing-else-matters-intro');
});

withTab('a song is described by what its file says', () => {
  const [song] = loadSongs(folderWith({ 'hotel-california-solo.gp': HOTEL }));
  expect(song).toEqual({
    slug: 'hotel-california-solo',
    title: 'Hotel California Solo',
    artist: 'Eagles',
    tempo: 75,
    bars: 42,
    tracks: 7,
    file: '/tabs/hotel-california-solo.gp',
    firstTrack: 0,
  });
});

const OASIS = 'public/tabs/dont-look-back-in-anger.gp';

test.skipIf(!existsSync(OASIS))('a song opens on its first guitar, not on the vocal melody before it', () => {
  const [song] = loadSongs(folderWith({ 'anger.gp': OASIS }));
  expect(song?.firstTrack).toBe(2);
});

withTab('every Guitar Pro file in the folder is a song, other files are ignored', () => {
  const songs = loadSongs(folderWith({ 'b-side.gp': HOTEL, 'A Side.gp': HOTEL, 'notes.txt': null, '.DS_Store': null }));
  expect(songs.map((song) => song.slug)).toEqual(['a-side', 'b-side']);
});

test('a missing folder means no songs', () => {
  expect(loadSongs(join(tmpdir(), 'rum-no-such-folder'))).toEqual([]);
});

test('a broken file is named in the error', () => {
  expect(() => loadSongs(folderWith({ 'broken.gp': null }))).toThrow(/broken\.gp/);
});

withTab('two files with the same slug are refused', () => {
  expect(() => loadSongs(folderWith({ 'My Song.gp': HOTEL, 'my-song.gp': HOTEL }))).toThrow(/my-song/);
});
