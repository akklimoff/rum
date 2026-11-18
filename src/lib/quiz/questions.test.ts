import { expect, test } from 'vitest';
import { FRET_COUNT, buildChord, diatonicChords, intervalInfo, intervalShapes } from '../theory';
import { QUIZ_IDS, makeRound, type Question } from './questions';
import { seeded } from './random';

const many = (id: (typeof QUIZ_IDS)[number]): Question[] =>
  Array.from({ length: 40 }, (_, seed) => makeRound(id, seeded(seed + 1))).flat();

test('there is a quiz for each of the eight lessons', () => {
  expect(QUIZ_IDS).toHaveLength(8);
});

test.each(QUIZ_IDS)('%s: every round is full and well formed', (id) => {
  for (let seed = 1; seed <= 40; seed++) expect(makeRound(id, seeded(seed))).toHaveLength(8);
  for (const question of many(id)) {
    expect(question.prompt).not.toMatch(/undefined|NaN/);
    expect(question.explain).not.toMatch(/undefined|NaN/);
    if (question.kind === 'choice') {
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.options.filter((option) => option === question.answer)).toHaveLength(1);
    } else {
      expect(question.targets.length).toBeGreaterThan(0);
      for (const target of question.targets) {
        expect(target.fret).toBeGreaterThanOrEqual(0);
        expect(target.fret).toBeLessThanOrEqual(FRET_COUNT);
      }
    }
  }
});

test('the same seed gives the same round', () => {
  expect(makeRound('intervals', seeded(7))).toEqual(makeRound('intervals', seeded(7)));
});

test('interval pictures match the interval named as the answer', () => {
  const pictured = many('intervals').filter((q) => q.kind === 'choice' && q.links);
  expect(pictured.length).toBeGreaterThan(10);
  for (const question of pictured) {
    if (question.kind !== 'choice') continue;
    const { from, to } = question.links![0]!;
    const semitones = Number(question.explain.match(/(\d+) полутон/)![1]);
    expect(intervalShapes(from, semitones)).toContainEqual(to);
  }
  expect(intervalInfo('P5').semitones).toBe(7);
});

test('chord answers agree with the theory layer', () => {
  const known = new Set(diatonicChords(0, 'major').map((c) => c.roman));
  expect(known.has('vi')).toBe(true);
  expect(buildChord(0, 'maj').tones.map((t) => t.note).join(' – ')).toBe('C – E – G');
  const asked = many('chord-building').find((q) => q.prompt === 'Из каких нот состоит аккорд C?');
  expect(asked).toMatchObject({ answer: 'C – E – G' });
});
