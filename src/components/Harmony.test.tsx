import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { STRUM, playNotes } from '../lib/audio';
import { ChordExplorer } from './ChordExplorer';
import { FretboardExplorer } from './FretboardExplorer';
import { ProgressionExplorer } from './ProgressionExplorer';

vi.mock('../lib/audio', async (importOriginal) => ({ ...(await importOriginal<object>()), playNotes: vi.fn() }));

const group = (name: string) => screen.getByRole('group', { name });
const click = (groupName: string, name: string) => userEvent.click(within(group(groupName)).getByRole('button', { name }));
const cards = (groupName: string) => [...group(groupName).querySelectorAll('.chord-card b')].map((b) => b.textContent);

test('the chord builder opens on C major and rebuilds on choice', async () => {
  const { container } = render(<ChordExplorer />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('C');
  expect(screen.getByTestId('chord-summary')).toHaveTextContent('1 – 3 – 5 · C – E – G');
  expect(screen.getByTestId('chord-structure')).toHaveTextContent('Трезвучие: большая терция + малая терция');
  await click('Основной тон', 'A');
  await click('Септаккорды', 'm7');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Am7');
  expect(screen.getByTestId('chord-summary')).toHaveTextContent('1 – ♭3 – 5 – ♭7 · A – C – E – G');
  expect(new Set([...container.querySelectorAll('[data-dot]')].map((d) => d.getAttribute('data-degree')))).toEqual(new Set(['1', '3', '5', '7']));
});

test('a lesson can embed a tool with a second-level heading and a preset', () => {
  render(<ChordExplorer embedded initialType="7" />);
  expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('C7');
});

const shapeButtons = () => within(screen.getByRole('list', { name: 'Формы' })).getAllByRole('button');
const litDots = (neck: HTMLElement) =>
  [...neck.querySelectorAll('[data-dot]:not([data-dimmed])')].map((dot) => dot.getAttribute('aria-label')!.split(':')[0]);

test('pressing a shape dims the neck outside it and strums it from the bass up', async () => {
  render(<ChordExplorer />);
  const neck = group('Гриф: аккорд C');
  const allDots = neck.querySelectorAll('[data-dot]').length;
  const [open] = shapeButtons();
  await userEvent.click(open!);
  expect(open).toHaveAttribute('aria-pressed', 'true');
  expect(neck.querySelectorAll('[data-dot][data-dimmed]').length).toBeGreaterThan(0);
  expect(litDots(neck)).toEqual(['Струна 1, лад 0', 'Струна 2, лад 1', 'Струна 3, лад 0', 'Струна 4, лад 2', 'Струна 5, лад 3']);
  expect(playNotes).toHaveBeenLastCalledWith([48, 52, 55, 60, 64], STRUM);
  await userEvent.click(open!);
  expect(open).toHaveAttribute('aria-pressed', 'false');
  expect(neck.querySelectorAll('[data-dot][data-dimmed]')).toHaveLength(0);
  expect(neck.querySelectorAll('[data-dot]')).toHaveLength(allDots);
});

test('a new root or chord type clears the chosen shape', async () => {
  render(<ChordExplorer />);
  await userEvent.click(shapeButtons()[1]!);
  await click('Основной тон', 'D');
  expect(group('Гриф: аккорд D').querySelectorAll('[data-dimmed]')).toHaveLength(0);
  expect(shapeButtons().every((button) => button.getAttribute('aria-pressed') === 'false')).toBe(true);
  await userEvent.click(shapeButtons()[0]!);
  await click('Трезвучия', 'минор');
  expect(group('Гриф: аккорд Dm').querySelectorAll('[data-dimmed]')).toHaveLength(0);
});

test('shape diagrams start at their own fret and follow the labels switch', async () => {
  render(<ChordExplorer />);
  const diagrams = shapeButtons().map((button) => button.querySelector('svg')!);
  expect(diagrams.every((svg) => svg.getAttribute('data-orientation') === 'vertical')).toBe(true);
  const open = diagrams[0]!;
  expect(open.querySelector('.fretboard-nut')).not.toBeNull();
  expect(open.querySelectorAll('.fretboard-muted')).toHaveLength(1);
  const labels = () => [...open.querySelectorAll('[data-dot] text')].map((text) => text.textContent);
  expect(labels()).toEqual(['3', '1', '5', '3', '1']);
  const high = diagrams.at(-1)!;
  expect(high.querySelector('.fretboard-nut')).toBeNull();
  expect(high.querySelector('[data-fret-number]')).toHaveTextContent('8');
  await click('Подписи', 'ноты');
  expect(labels()).toEqual(['E', 'C', 'G', 'E', 'C']);
});

test('progressions resolve in the chosen key and highlight the picked chord', async () => {
  const { container } = render(<ProgressionExplorer />);
  expect(cards('Аккорды прогрессии')).toEqual(['C', 'G', 'Am', 'F']);
  await click('Каденции', 'Плагальная каденция');
  await click('Тональность', 'G');
  expect(cards('Аккорды прогрессии')).toEqual(['C', 'G']);
  await userEvent.click(group('Аккорды прогрессии').querySelector('.chord-card')!);
  const bright = new Set([...container.querySelectorAll('[data-dot]:not([data-dimmed])')].map((d) => d.getAttribute('data-degree')));
  expect(bright).toEqual(new Set(['4', '6', '1']));
});

test('the scale page shows the formula, functions and seventh chords', async () => {
  render(<FretboardExplorer />);
  expect(screen.getByTestId('scale-formula')).toHaveTextContent('ТТПТТТП');
  expect([...group('Аккорды тональности').querySelectorAll('i')].map((i) => i.textContent)).toEqual(['T', 'S', 'T', 'S', 'D', 'T', 'D']);
  await click('Аккорды', 'септаккорды');
  expect(cards('Аккорды тональности')).toEqual(['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7♭5']);
});

test('the progression is drawn on the circle of fifths', async () => {
  const { container } = render(<ProgressionExplorer />);
  const inKey = () => [...container.querySelectorAll('.circle-cell[data-in-key] text:first-of-type')].map((t) => t.textContent);
  expect(new Set(inKey())).toEqual(new Set(['C', 'G', 'F', 'Am', 'Em', 'Bdim', 'Dm']));
  expect(container.querySelectorAll('.circle-move')).toHaveLength(4);
  await userEvent.click(group('Аккорды прогрессии').querySelectorAll('.chord-card')[2]!);
  expect(container.querySelector('.circle-cell[data-active] text')).toHaveTextContent('Am');
  await userEvent.click(container.querySelector('[data-cell="major:1"]')!);
  expect(cards('Аккорды прогрессии')).toEqual(['G', 'D', 'Em', 'C']);
  expect(container.querySelector('.circle-cell[data-tonic] text')).toHaveTextContent('G');
});
