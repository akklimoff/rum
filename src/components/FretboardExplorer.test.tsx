import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test } from 'vitest';
import { FretboardExplorer } from './FretboardExplorer';

const open = (search = '') => {
  history.replaceState(null, '', `/theory/fretboard${search}`);
  const { container } = render(<FretboardExplorer />);
  return container;
};

const group = (name: string) => screen.getByRole('group', { name });
const pressed = (name: string) =>
  within(group(name))
    .getAllByRole('button')
    .filter((b) => b.getAttribute('aria-pressed') === 'true')
    .map((b) => b.textContent);
const chordCards = () => within(group('Аккорды тональности')).getAllByRole('button');
const title = () => screen.getByRole('heading', { level: 1 }).textContent;
const dimmedDegrees = (container: HTMLElement) =>
  new Set([...container.querySelectorAll('[data-dot][data-dimmed]')].map((d) => d.getAttribute('data-degree')));
const brightDegrees = (container: HTMLElement) =>
  new Set([...container.querySelectorAll('[data-dot]:not([data-dimmed])')].map((d) => d.getAttribute('data-degree')));

beforeEach(() => {
  history.replaceState(null, '', '/theory/fretboard');
});

test('opens on C major with its seven triads', () => {
  open();
  expect(title()).toBe('До мажор');
  expect(chordCards().map((c) => c.dataset.symbol)).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim']);
  expect(pressed('Тоника')).toEqual(['C']);
  expect(pressed('Лад')).toEqual(['мажор']);
});

test('choosing A and minor updates title, numerals and address', async () => {
  const user = userEvent.setup();
  open();
  await user.click(within(group('Тоника')).getByRole('button', { name: 'A' }));
  await user.click(within(group('Лад')).getByRole('button', { name: 'минор' }));
  expect(title()).toBe('Ля минор');
  expect(chordCards().map((c) => c.dataset.roman)).toEqual(['i', 'ii°', '♭III', 'iv', 'v', '♭VI', '♭VII']);
  expect(location.search).toBe('?key=A&scale=minor');
});

test('an enharmonic key in the address is shown in its usual spelling', () => {
  open('?key=A%23&scale=major');
  expect(title()).toBe('Си-бемоль мажор');
  expect(screen.getByTestId('scale-notes').firstElementChild).toHaveTextContent('B♭');
  expect(pressed('Тоника')).toEqual(['B♭']);
});

test('garbage in the address opens C major', () => {
  open('?key=H&scale=foo&labels=x');
  expect(title()).toBe('До мажор');
  expect(pressed('Подписи')).toEqual(['ступени']);
});

test('clicking a chord leaves only its notes bright, clicking again restores all', async () => {
  const user = userEvent.setup();
  const container = open();
  const g = chordCards()[4]!;
  await user.click(g);
  expect(g).toHaveAttribute('aria-pressed', 'true');
  expect(brightDegrees(container)).toEqual(new Set(['5', '7', '2']));
  await user.click(g);
  expect(g).toHaveAttribute('aria-pressed', 'false');
  expect(dimmedDegrees(container).size).toBe(0);
});

test('switching to a pentatonic drops the chord selection and the chord table', async () => {
  const user = userEvent.setup();
  const container = open();
  await user.click(chordCards()[4]!);
  await user.click(within(group('Лад')).getByRole('button', { name: 'минорная пентатоника' }));
  expect(screen.queryByRole('group', { name: 'Аккорды тональности' })).toBeNull();
  expect(dimmedDegrees(container).size).toBe(0);
  expect(container.querySelectorAll('[data-dot]').length).toBeGreaterThan(0);
});

test('switching the tonic drops the chord selection', async () => {
  const user = userEvent.setup();
  const container = open();
  await user.click(chordCards()[4]!);
  await user.click(within(group('Тоника')).getByRole('button', { name: 'G' }));
  expect(dimmedDegrees(container).size).toBe(0);
  expect(chordCards().every((c) => c.getAttribute('aria-pressed') === 'false')).toBe(true);
});

test('the tonic button is respelled when the scale family changes', async () => {
  const user = userEvent.setup();
  open();
  await user.click(within(group('Тоника')).getByRole('button', { name: 'D♭' }));
  expect(title()).toBe('Ре-бемоль мажор');
  await user.click(within(group('Лад')).getByRole('button', { name: 'минор' }));
  expect(pressed('Тоника')).toEqual(['C♯']);
  expect(title()).toBe('До-диез минор');
});

test('note labels replace degrees and are kept in the address', async () => {
  const user = userEvent.setup();
  const container = open();
  expect(container.querySelector('[data-dot][data-tonic] text')).toHaveTextContent('1');
  await user.click(within(group('Подписи')).getByRole('button', { name: 'ноты' }));
  expect(container.querySelector('[data-dot][data-tonic] text')).toHaveTextContent('C');
  expect(location.search).toBe('?key=C&scale=major&labels=notes');
});

test('the rest of the modes are behind «ещё»', async () => {
  const user = userEvent.setup();
  open();
  expect(within(group('Лад')).queryByRole('button', { name: 'дорийский' })).toBeNull();
  await user.click(within(group('Лад')).getByRole('button', { name: /ещё/ }));
  for (const name of ['дорийский', 'фригийский', 'лидийский', 'локрийский']) {
    expect(within(group('Лад')).getByRole('button', { name })).toBeInTheDocument();
  }
  await user.click(within(group('Лад')).getByRole('button', { name: 'дорийский' }));
  expect(pressed('Лад')).toEqual(['дорийский']);
  expect(title()).toBe('До дорийский');
});

test('a mode from the address is visible without opening «ещё»', () => {
  open('?key=E&scale=phrygian');
  expect(pressed('Лад')).toEqual(['фригийский']);
});

test('the label switch reports which option the sliding pill sits under', async () => {
  const user = userEvent.setup();
  const container = open();
  const pillIndex = () => (container.querySelector('.segmented') as HTMLElement).style.getPropertyValue('--active');
  expect(pillIndex()).toBe('0');
  await user.click(within(group('Подписи')).getByRole('button', { name: 'ноты' }));
  expect(pillIndex()).toBe('1');
});

test('dots enter again when the key changes but not when a chord is picked', async () => {
  const user = userEvent.setup();
  const container = open();
  const firstDot = () => container.querySelector('[data-dot]');
  const before = firstDot();
  await user.click(chordCards()[0]);
  expect(firstDot()).toBe(before);
  await user.click(within(group('Тоника')).getByRole('button', { name: 'D' }));
  expect(firstDot()).not.toBe(before);
});
