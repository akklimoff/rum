import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test } from 'vitest';
import { IntervalsExplorer } from './IntervalsExplorer';

const group = (name: string) => screen.getByRole('group', { name });
const summary = () => screen.getByTestId('interval-summary').textContent;
const shapes = () => within(screen.getByRole('list', { name: 'Формы' })).getAllByRole('listitem').map((li) => li.textContent);

test('opens on a perfect fifth from C', () => {
  render(<IntervalsExplorer />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Чистая квинта');
  expect(summary()).toBe('7 полутонов · C → G');
  expect(shapes()).toEqual(['3-я струна · на 3 лада ниже', '4-я струна · на 2 лада выше', 'та же струна · на 7 ладов выше']);
});

test('choosing an interval redraws the shapes', async () => {
  const { container } = render(<IntervalsExplorer />);
  await userEvent.click(within(group('Интервал')).getByRole('button', { name: 'м3' }));
  expect(summary()).toBe('3 полутона · C → E♭');
  expect(container.querySelectorAll('.fretboard-link')).toHaveLength(shapes().length);
  expect(container.querySelector('[data-dot][data-tonic] text')).toHaveTextContent('1');
});

test('clicking the neck moves the root', async () => {
  const { container } = render(<IntervalsExplorer />);
  await userEvent.click(within(group('Интервал')).getByRole('button', { name: 'б3' }));
  await userEvent.click(container.querySelector('[data-hit="5:0"]')!);
  expect(summary()).toBe('4 полутона · E → G♯');
  expect(within(group('Струна')).getByRole('button', { pressed: true })).toHaveTextContent('6');
});

test('the fret stepper stops at the ends of the neck', async () => {
  render(<IntervalsExplorer />);
  const lower = within(group('Лад')).getByRole('button', { name: 'Лад ниже' });
  await userEvent.click(lower);
  await userEvent.click(lower);
  await userEvent.click(lower);
  expect(lower).toBeDisabled();
  expect(summary()).toBe('7 полутонов · A → E');
});

test('note labels can replace degrees', async () => {
  const { container } = render(<IntervalsExplorer />);
  await userEvent.click(within(group('Подписи')).getByRole('button', { name: 'ноты' }));
  expect(container.querySelector('[data-dot][data-tonic] text')).toHaveTextContent('C');
});
