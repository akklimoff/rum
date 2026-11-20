import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { Fretboard, fretPositionRatio, type FretboardDot } from './Fretboard';

const dot = (overrides: Partial<FretboardDot>): FretboardDot => ({
  string: 0,
  fret: 3,
  label: '5',
  degreeNumber: 5,
  isTonic: false,
  dimmed: false,
  description: 'Струна 1, лад 3: G, ступень 5',
  ...overrides,
});

const renderBoard = (dots: FretboardDot[]) =>
  render(<Fretboard dots={dots} stringCount={6} fretCount={15} ariaLabel="Гриф: До мажор" />).container;

test('draws one mark per dot', () => {
  const board = renderBoard([dot({}), dot({ string: 1, fret: 1 }), dot({ string: 5, fret: 0 })]);
  expect(board.querySelectorAll('[data-dot]')).toHaveLength(3);
});

test('exposes degree, tonic and dimmed state on the mark', () => {
  const board = renderBoard([
    dot({}),
    dot({ string: 1, fret: 1, label: '1', degreeNumber: 1, isTonic: true }),
    dot({ string: 2, fret: 2, dimmed: true }),
  ]);
  const marks = board.querySelectorAll('[data-dot]');
  expect(marks[0]).toHaveAttribute('data-degree', '5');
  expect(marks[0]).not.toHaveAttribute('data-tonic');
  expect(marks[1]).toHaveAttribute('data-tonic');
  expect(marks[2]).toHaveAttribute('data-dimmed');
  expect(marks[0]).not.toHaveAttribute('data-dimmed');
});

test('is a labelled group whose dots are readable one by one', () => {
  renderBoard([dot({}), dot({ string: 1, fret: 1, description: 'Струна 2, лад 1: C, ступень 1' })]);
  expect(screen.getByRole('group', { name: 'Гриф: До мажор' })).toBeInTheDocument();
  expect(screen.getAllByRole('img').map((d) => d.getAttribute('aria-label'))).toEqual([
    'Струна 1, лад 3: G, ступень 5',
    'Струна 2, лад 1: C, ступень 1',
  ]);
});

test('shows the label inside the dot and hides decoration from assistive tech', () => {
  const board = renderBoard([dot({})]);
  expect(board.querySelector('[data-dot] text')).toHaveTextContent('5');
  expect(board.querySelector('[data-fret-number]')!.closest('[aria-hidden="true"]')).not.toBeNull();
});

test('numbers every fret from the open string to the last one', () => {
  const board = renderBoard([]);
  const numbers = [...board.querySelectorAll('[data-fret-number]')].map((n) => n.textContent);
  expect(numbers).toEqual(Array.from({ length: 16 }, (_, i) => String(i)));
});

test('dots enter in fret order', () => {
  const board = renderBoard([dot({ fret: 7 })]);
  expect((board.querySelector('[data-dot]') as SVGElement).style.getPropertyValue('--fret')).toBe('7');
});

test('a new replay key redraws the dots so they enter again', () => {
  const board = (replayKey: string) => (
    <Fretboard dots={[dot({})]} stringCount={6} fretCount={15} ariaLabel="Гриф" replayKey={replayKey} />
  );
  const { container, rerender } = render(board('C:major'));
  const first = container.querySelector('[data-dot]');
  rerender(board('C:major'));
  expect(container.querySelector('[data-dot]')).toBe(first);
  rerender(board('D:major'));
  expect(container.querySelector('[data-dot]')).not.toBe(first);
});

test('a dot without a degree is drawn neutral', () => {
  const board = renderBoard([dot({ degreeNumber: null })]);
  const mark = board.querySelector('[data-dot]')!;
  expect(mark).toHaveAttribute('data-neutral');
  expect(mark).not.toHaveAttribute('data-degree');
});

test('links connect positions and clicking the neck reports string and fret', async () => {
  const clicks: [number, number][] = [];
  const { container } = render(
    <Fretboard
      dots={[dot({})]}
      stringCount={6}
      fretCount={15}
      ariaLabel="Гриф"
      links={[{ from: { string: 4, fret: 3 }, to: { string: 3, fret: 5 } }]}
      onPositionClick={(string, fret) => clicks.push([string, fret])}
    />,
  );
  expect(container.querySelectorAll('.fretboard-link')).toHaveLength(1);
  expect(container.querySelectorAll('[data-hit]')).toHaveLength(6 * 16);
  (container.querySelector('[data-hit="2:7"]') as SVGElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(clicks).toEqual([[2, 7]]);
});

test('reports where along its width a fret sits, for callers that pan the neck', () => {
  expect(fretPositionRatio(0, 12)).toBeLessThan(0.05);
  expect(fretPositionRatio(12, 12)).toBeGreaterThan(0.9);
  expect(fretPositionRatio(6.5, 12)).toBeCloseTo(0.5, 1);
});

test('muted strings get a cross at the nut', () => {
  const { container } = render(
    <Fretboard dots={[]} stringCount={6} fretCount={15} ariaLabel="Гриф" mutedStrings={[0, 5]} />,
  );
  const crosses = container.querySelectorAll('.fretboard-muted');
  expect(crosses).toHaveLength(2);
  expect([...crosses].map((cross) => cross.textContent)).toEqual(['×', '×']);
  expect(crosses[0]!.getAttribute('aria-hidden')).toBe('true');
  const open = renderBoard([dot({ string: 0, fret: 0 })]).querySelector('[data-dot] circle');
  expect(crosses[0]!.getAttribute('x')).toBe(open!.getAttribute('cx'));
});

test('a cross takes the open position over a dot on that string', () => {
  const { container } = render(
    <Fretboard
      dots={[dot({ string: 5, fret: 0 }), dot({ string: 5, fret: 3 })]}
      stringCount={6}
      fretCount={15}
      ariaLabel="Гриф"
      mutedStrings={[5]}
    />,
  );
  expect(container.querySelectorAll('.fretboard-muted')).toHaveLength(1);
  expect(container.querySelectorAll('[data-dot]')).toHaveLength(1);
  expect(container.querySelector('[data-dot] circle')!.getAttribute('cx')).not.toBe(
    container.querySelector('.fretboard-muted')!.getAttribute('x'),
  );
});

test('no crosses unless strings are muted', () => {
  expect(renderBoard([]).querySelectorAll('.fretboard-muted')).toHaveLength(0);
});
