import { expect, test } from 'vitest';
import { sectionAt, songSections } from './sections';

const BARS = [
  { start: 0, section: 'End verse' },
  { start: 100, section: 'Solo' },
  { start: 200 },
  { start: 300, section: '  ' },
  { start: 400, section: 'Arpeggios' },
];

test('named bars become sections placed along the song from 0 to 1', () => {
  expect(songSections(BARS, 500)).toEqual([
    { name: 'End verse', start: 0 },
    { name: 'Solo', start: 0.2 },
    { name: 'Arpeggios', start: 0.8 },
  ]);
});

test('the section playing now is the last one that has started', () => {
  const sections = songSections(BARS, 500);
  expect(sectionAt(sections, 0)?.name).toBe('End verse');
  expect(sectionAt(sections, 0.79)?.name).toBe('Solo');
  expect(sectionAt(sections, 0.8)?.name).toBe('Arpeggios');
});

test('a song without sections, or a moment before the first one, has no section', () => {
  expect(songSections([{ start: 0 }], 100)).toEqual([]);
  expect(sectionAt(songSections([{ start: 50, section: 'Late' }], 100), 0.1)).toBeNull();
  expect(songSections(BARS, 0)).toEqual([]);
});
