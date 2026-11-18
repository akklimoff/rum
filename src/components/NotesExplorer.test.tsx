import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { NotesExplorer } from './NotesExplorer';

const group = (name: string) => screen.getByRole('group', { name });
const labels = (container: HTMLElement, selector = '[data-dot]') =>
  [...container.querySelectorAll(selector)].map((d) => d.querySelector('text')!.textContent);

test('opens with every note of the neck, sharps by default', () => {
  const { container } = render(<NotesExplorer />);
  expect(container.querySelectorAll('[data-dot]')).toHaveLength(96);
  expect(labels(container)).toContain('F♯');
});

test('flats respell the accidentals', async () => {
  const { container } = render(<NotesExplorer />);
  await userEvent.click(within(group('Знаки')).getByRole('button', { name: '♭' }));
  expect(labels(container)).toContain('G♭');
  expect(labels(container)).not.toContain('F♯');
});

test('«без знаков» leaves only natural notes', async () => {
  const { container } = render(<NotesExplorer />);
  await userEvent.click(within(group('Показать')).getByRole('button', { name: 'без знаков' }));
  expect(labels(container).every((label) => label!.length === 1)).toBe(true);
});

test('picking a note highlights it and dims the rest', async () => {
  const { container } = render(<NotesExplorer />);
  await userEvent.click(within(group('Найти ноту')).getByRole('button', { name: 'A' }));
  expect(new Set(labels(container, '[data-dot]:not([data-dimmed])'))).toEqual(new Set(['A']));
  expect(container.querySelectorAll('[data-dot]:not([data-dimmed])')).toHaveLength(8);
  expect(screen.getByText(/ля/i)).toBeInTheDocument();
});
