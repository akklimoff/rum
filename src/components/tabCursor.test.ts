// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import type * as AlphaTab from '@coderline/alphatab';
import { tabCursorHandler } from './tabCursor';

type Handler = AlphaTab.ICursorHandler;
type Container = Parameters<Handler['placeBarCursor']>[0];
type BeatBounds = Parameters<Handler['placeBarCursor']>[1];
type Cursors = Parameters<Handler['onAttach']>[0];
type Mode = Parameters<Handler['transitionBeatCursor']>[5];

const bounds = (x: number, y: number, w: number, h: number, onNotesX = 0) =>
  ({ onNotesX, barBounds: { masterBarBounds: { visualBounds: { x, y, w, h } } } }) as unknown as BeatBounds;

const container = () => ({ element: document.createElement('div') }) as unknown as Container;

function setup() {
  const wrapper = container();
  const cursors = { cursorWrapper: wrapper } as unknown as Cursors;
  const handler = tabCursorHandler();
  handler.onAttach(cursors);
  const host = (wrapper as unknown as { element: HTMLElement }).element;
  return {
    handler,
    cursors,
    host,
    frame: host.querySelector('.tabplayer-bar-frame') as HTMLElement,
    mark: host.querySelector('.tabplayer-beat-mark') as HTMLElement,
  };
}

const mode = 0 as Mode;

describe('tabCursorHandler', () => {
  it('adds the frame and the mark on attach and removes them on detach', () => {
    const { handler, cursors, host } = setup();
    expect(host.children).toHaveLength(2);
    handler.onDetach(cursors);
    expect(host.children).toHaveLength(0);
  });

  it('puts the frame at the bar bounds in pixels', () => {
    const { handler, frame } = setup();
    handler.placeBarCursor(container(), bounds(10, 20, 300, 80));
    expect([frame.style.left, frame.style.top, frame.style.width, frame.style.height]).toEqual(['10px', '20px', '300px', '80px']);
  });

  it('centres a 14px mark on the beat notes position', () => {
    const { handler, mark } = setup();
    handler.placeBeatCursor(container(), bounds(10, 20, 300, 80, 100), 90);
    expect([mark.style.left, mark.style.width, mark.style.top, mark.style.height]).toEqual(['93px', '14px', '20px', '80px']);
  });

  it('moves the mark to the played beat on transition and ignores the next beat', () => {
    const { handler, mark } = setup();
    handler.placeBeatCursor(container(), bounds(10, 20, 300, 80, 100), 90);
    handler.transitionBeatCursor(container(), bounds(10, 20, 300, 80, 160), 90, 400, 450, mode);
    expect(mark.style.left).toBe('153px');
  });
});
