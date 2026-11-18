import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test } from 'vitest';
import { makeRound, type Question } from '../lib/quiz/questions';
import { seeded } from '../lib/quiz/random';
import { Quiz } from './Quiz';

const SEED = 3;
const expectedRound = (lesson: Parameters<typeof makeRound>[0]) => makeRound(lesson, seeded(SEED));
const openQuiz = (lesson: Parameters<typeof makeRound>[0]) => render(<Quiz lesson={lesson} rng={seeded(SEED)} />).container;
const optionsGroup = () => screen.getByRole('group', { name: 'Варианты ответа' });

async function answer(container: HTMLElement, question: Question, right: boolean) {
  if (question.kind === 'choice') {
    const option = right ? question.answer : question.options.find((o) => o !== question.answer)!;
    await userEvent.click(within(optionsGroup()).getByRole('button', { name: option }));
  } else {
    const target = right ? question.targets[0]! : { string: question.targets[0]!.string, fret: (question.targets[0]!.fret + 1) % 12 };
    const reallyWrong = question.targets.every((t) => t.fret !== target.fret);
    await userEvent.click(container.querySelector(`[data-hit="${target.string}:${right || reallyWrong ? target.fret : (target.fret + 1) % 12}"]`)!);
  }
}

beforeEach(() => localStorage.clear());

test('a right answer is confirmed, counted and explained', async () => {
  const container = openQuiz('diatonic-chords');
  const [first] = expectedRound('diatonic-chords');
  expect(screen.getByText(first!.prompt)).toBeInTheDocument();
  await answer(container, first!, true);
  expect(screen.getByRole('status')).toHaveTextContent('Верно.');
  expect(screen.getByRole('status')).toHaveTextContent(first!.explain);
  expect(screen.getByText(/Вопрос 1 из 8 · верно 1/)).toBeInTheDocument();
});

test('a wrong answer shows the right one and does not score', async () => {
  const container = openQuiz('diatonic-chords');
  const [first] = expectedRound('diatonic-chords');
  await answer(container, first!, false);
  expect(screen.getByRole('status')).toHaveTextContent('Неверно.');
  if (first!.kind === 'choice') expect(within(optionsGroup()).getByRole('button', { name: first!.answer })).toHaveAttribute('data-state', 'correct');
  expect(screen.getByText(/верно 0/)).toBeInTheDocument();
  expect(within(optionsGroup()).getAllByRole('button').every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
});

test('a full round ends with the score, remembers the best and can restart', async () => {
  const container = openQuiz('intervals');
  const round = expectedRound('intervals');
  for (const [i, question] of round.entries()) {
    await answer(container, question, i !== 0);
    await userEvent.click(screen.getByRole('button', { name: i === round.length - 1 ? 'Результат' : 'Дальше' }));
  }
  expect(screen.getByRole('status')).toHaveTextContent('7 из 8');
  expect(localStorage.getItem('rum-quiz-intervals')).toBe('7');
  await userEvent.click(screen.getByRole('button', { name: 'Ещё раз' }));
  expect(screen.getByText(/Вопрос 1 из 8 · верно 0/)).toBeInTheDocument();
});

test('a fretboard question is answered by clicking the neck', async () => {
  const container = openQuiz('notes');
  const round = expectedRound('notes');
  const neckIndex = round.findIndex((q) => q.kind === 'neck');
  for (let i = 0; i < neckIndex; i++) {
    await answer(container, round[i]!, true);
    await userEvent.click(screen.getByRole('button', { name: 'Дальше' }));
  }
  const question = round[neckIndex]!;
  await answer(container, question, true);
  expect(screen.getByRole('status')).toHaveTextContent('Верно.');
  expect(container.querySelectorAll('[data-dot]').length).toBeGreaterThanOrEqual(question.kind === 'neck' ? question.targets.length : 1);
  expect(container.querySelector('[data-hit]')).toBeNull();
});
