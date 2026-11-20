import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

function fakeMatchMedia(initial: boolean) {
  const listeners = new Set<() => void>();
  const list = {
    matches: initial,
    addEventListener: (_: 'change', listener: () => void) => listeners.add(listener),
    removeEventListener: (_: 'change', listener: () => void) => listeners.delete(listener),
  };
  vi.stubGlobal('matchMedia', () => list);
  return {
    listeners,
    change(matches: boolean) {
      list.matches = matches;
      listeners.forEach((listener) => listener());
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test('follows the media query as it starts and stops matching', () => {
  const media = fakeMatchMedia(true);
  const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 1300px)'));
  expect(result.current).toBe(true);
  act(() => media.change(false));
  expect(result.current).toBe(false);
  unmount();
  expect(media.listeners.size).toBe(0);
});

test('does not match where the browser cannot answer media queries', () => {
  vi.stubGlobal('matchMedia', undefined);
  const { result } = renderHook(() => useMediaQuery('(min-width: 1300px)'));
  expect(result.current).toBe(false);
});
