import { expect, test } from 'vitest';
import { scaleNotes } from './theory';
import { tabNeckDots, tabNeckFocusFret, tabNeckLinks, tabNeckMutedStrings, type TabNote } from './tabNeck';

const GUITAR = [64, 59, 55, 50, 45, 40];

test('the sounding note is bright and named, on the string counted from the top', () => {
  expect(tabNeckDots([{ string: 5, fret: 12, sounding: true, dead: false, beat: 0 }], GUITAR)).toEqual([
    { string: 1, fret: 12, label: 'B', degreeNumber: null, isTonic: false, dimmed: false, description: 'Струна 2, лад 12: B' },
  ]);
});

test('the rest of the bar is dimmed and sharps are printed as ♯', () => {
  const [dot] = tabNeckDots([{ string: 4, fret: 11, sounding: false, dead: false, beat: 0 }], GUITAR);
  expect(dot).toMatchObject({ string: 2, fret: 11, label: 'F♯', dimmed: true });
});

test('a position played twice in the bar is drawn once, bright if it sounds now', () => {
  const dots = tabNeckDots(
    [
      { string: 4, fret: 9, sounding: false, dead: false, beat: 0 },
      { string: 4, fret: 9, sounding: true, dead: false, beat: 0 },
      { string: 4, fret: 9, sounding: false, dead: false, beat: 0 },
    ],
    GUITAR,
  );
  expect(dots).toHaveLength(1);
  expect(dots[0]!.dimmed).toBe(false);
});

test('a dead note is a cross', () => {
  const [dot] = tabNeckDots([{ string: 6, fret: 0, sounding: true, dead: true, beat: 0 }], GUITAR);
  expect(dot).toMatchObject({ string: 0, label: '×', description: 'Струна 1: приглушённая' });
});

test('a four-string bass uses its own tuning', () => {
  const [dot] = tabNeckDots([{ string: 1, fret: 2, sounding: true, dead: false, beat: 0 }], [43, 38, 33, 28]);
  expect(dot).toMatchObject({ string: 3, fret: 2, label: 'F♯' });
});

const B_MINOR = scaleNotes(11, 'minor');
const note = (string: number, fret: number, beat: number, extra: Partial<TabNote> = {}): TabNote => ({
  string, fret, beat, sounding: false, dead: false, ...extra,
});

test('in a known key a note carries its degree, and the tonic is marked', () => {
  const [tonic, third, outside] = tabNeckDots([note(5, 12, 0), note(4, 7, 1), note(4, 8, 2)], GUITAR, B_MINOR);
  expect(tonic).toMatchObject({ label: '1', degreeNumber: 1, isTonic: true, description: 'Струна 2, лад 12: B, ступень 1' });
  expect(third).toMatchObject({ label: '♭3', degreeNumber: 3, isTonic: false });
  expect(outside).toMatchObject({ label: 'D♯', degreeNumber: null });
});

test('the shape is drawn as a path through the bar in playing order', () => {
  expect(tabNeckLinks([note(4, 7, 0), note(4, 9, 1), note(5, 7, 2)], GUITAR)).toEqual([
    { from: { string: 2, fret: 7 }, to: { string: 2, fret: 9 } },
    { from: { string: 2, fret: 9 }, to: { string: 1, fret: 7 } },
  ]);
});

test('going back and forth between two notes draws one line, repeats and dead notes draw none', () => {
  const links = tabNeckLinks(
    [note(4, 7, 0), note(4, 9, 1), note(4, 7, 2), note(4, 7, 3), note(3, 0, 4, { dead: true }), note(4, 9, 5)],
    GUITAR,
  );
  expect(links).toHaveLength(1);
});

test('a chord joins the path by its first note only', () => {
  expect(tabNeckLinks([note(4, 7, 0), note(5, 8, 1), note(6, 7, 1)], GUITAR)).toEqual([
    { from: { string: 2, fret: 7 }, to: { string: 1, fret: 8 } },
  ]);
});

test('the neck is centred on the middle of the fretted notes of the bar', () => {
  expect(tabNeckFocusFret([note(4, 7, 0), note(4, 9, 1), note(5, 12, 2)])).toBe(9.5);
});

test('open and dead strings do not pull the view to the nut, and an empty bar keeps the view', () => {
  expect(tabNeckFocusFret([note(4, 14, 0), note(3, 0, 1), note(2, 3, 2, { dead: true })])).toBe(14);
  expect(tabNeckFocusFret([note(3, 0, 0)])).toBeNull();
  expect(tabNeckFocusFret([])).toBeNull();
});

test('with note labels the dot keeps its degree colour but shows the note name', () => {
  const [third] = tabNeckDots([note(4, 7, 0)], GUITAR, B_MINOR, 'notes');
  expect(third).toMatchObject({ label: 'D', degreeNumber: 3 });
});

const soundingNote = (string: number, overrides: Partial<TabNote> = {}): TabNote => ({
  string,
  fret: 2,
  beat: 0,
  sounding: true,
  dead: false,
  ...overrides,
});

test('a chord on the sounding beat marks the strings it leaves out', () => {
  expect(tabNeckMutedStrings([5, 4, 3].map((string) => soundingNote(string)), GUITAR)).toEqual([0, 4, 5]);
});

test('a melody note marks nothing', () => {
  expect(tabNeckMutedStrings([soundingNote(3, { fret: 5 })], GUITAR)).toEqual([]);
});

test('a muted note counts as a played string', () => {
  const chord = [soundingNote(6), soundingNote(5), soundingNote(4, { dead: true })];
  expect(tabNeckMutedStrings(chord, GUITAR)).toEqual([3, 4, 5]);
});

test('notes of the dimmed rest of the bar do not count', () => {
  const chord = [soundingNote(6), soundingNote(5), soundingNote(4), soundingNote(3, { sounding: false })];
  expect(tabNeckMutedStrings(chord, GUITAR)).toEqual([3, 4, 5]);
});
