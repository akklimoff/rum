import { expect, test } from 'vitest';
import { firstTrack, trackEntry, trackMenu } from './trackMenu';

test('the part is the last piece of a "musician | instrument | part" name, the rest goes under it', () => {
  expect(trackEntry('Noel Gallagher | Fender Stratocaster | Lead Guitar 1', 'guitar', 3)).toEqual({
    index: 3,
    kind: 'guitar',
    part: 'Lead Guitar 1',
    detail: 'Noel Gallagher · Fender Stratocaster',
  });
});

test('a plain name is the part itself, extra spaces are dropped', () => {
  expect(trackEntry('  Guitar Solo ', 'guitar', 0)).toMatchObject({ part: 'Guitar Solo', detail: '' });
  expect(trackEntry('Paul "Bonehead" Arthurs | Epiphone Riviera | Rhythm Guitar ', 'guitar', 7)).toMatchObject({
    part: 'Rhythm Guitar',
    detail: 'Paul "Bonehead" Arthurs · Epiphone Riviera',
  });
});

test('a nameless track is called by its number', () => {
  expect(trackEntry('   ', 'other', 4)).toMatchObject({ part: 'Дорожка 5', detail: '' });
  expect(trackEntry(' | ', 'other', 0)).toMatchObject({ part: 'Дорожка 1', detail: '' });
});

test('guitars go first, everything else after them, each keeping the order of the file', () => {
  const entries = (['other', 'guitar', 'drums', 'guitar', 'bass'] as const).map((kind, index) => trackEntry(`T${index}`, kind, index));
  const menu = trackMenu(entries);
  expect(menu.guitars.map((entry) => entry.index)).toEqual([1, 3]);
  expect(menu.others.map((entry) => entry.index)).toEqual([0, 2, 4]);
});

test('a song opens on its first guitar, or on its first track when it has none', () => {
  expect(firstTrack(['other', 'other', 'guitar', 'guitar'])).toBe(2);
  expect(firstTrack(['guitar', 'bass'])).toBe(0);
  expect(firstTrack(['other', 'drums'])).toBe(0);
  expect(firstTrack([])).toBe(0);
});
