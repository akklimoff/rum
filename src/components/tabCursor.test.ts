// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as AlphaTab from '@coderline/alphatab';
import { tabCursorHandler } from './tabCursor';

type Handler = AlphaTab.ICursorHandler;
type Container = Parameters<Handler['placeBarCursor']>[0];
type BeatBounds = Parameters<Handler['placeBarCursor']>[1];
type Cursors = Parameters<Handler['onAttach']>[0];
type Mode = Parameters<Handler['transitionBeatCursor']>[5];

const TO_NEXT_BEAT = 1 as Mode;
const TO_END_OF_BEAT = 3 as Mode;

const bounds = (x: number, y: number, w: number, h: number, onNotesX = 0, isFullBarRest = false) =>
  ({ onNotesX, beat: { isFullBarRest }, barBounds: { masterBarBounds: { visualBounds: { x, y, w, h } } } }) as unknown as BeatBounds;

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

const bar = (onNotesX: number) => bounds(10, 20, 300, 80, onNotesX);
const restBar = () => bounds(10, 20, 300, 80, 160, true);

function recordGlideStart(mark: HTMLElement) {
  const start = { transform: '' };
  Object.defineProperty(mark, 'offsetWidth', {
    get: () => {
      start.transform = mark.style.transform;
      return 0;
    },
  });
  return start;
}

afterEach(() => vi.unstubAllGlobals());

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

  it('centres a 14px mark on the start position without animating', () => {
    const { handler, mark } = setup();
    handler.placeBeatCursor(container(), bar(100), 90);
    expect([mark.style.transform, mark.style.width, mark.style.top, mark.style.height]).toEqual(['translateX(83px)', '14px', '20px', '80px']);
    expect(mark.style.transition).toBe('none');
  });

  it('glides on past the next beat at the same speed so a late update does not stall it', () => {
    const { handler, mark } = setup();
    handler.transitionBeatCursor(container(), bar(100), 100, 160, 500, TO_NEXT_BEAT);
    expect(mark.style.transform).toBe('translateX(213px)');
    expect(mark.style.transition).toBe('transform 1000ms linear');
  });

  it('stops at the end of the bar when the next beat is in the next bar', () => {
    const { handler, mark } = setup();
    handler.transitionBeatCursor(container(), bar(250), 250, 400, 500, TO_NEXT_BEAT);
    expect(mark.style.transform).toBe('translateX(296px)');
    expect(mark.style.transition).toBe('transform 500ms linear');
  });

  it('starts a late glide where the beat would be on the way to the end of the bar', () => {
    const { handler, mark } = setup();
    const start = recordGlideStart(mark);
    handler.transitionBeatCursor(container(), bar(253), 273, 353, 400, TO_NEXT_BEAT);
    expect(start.transform).toBe('translateX(256px)');
    expect(mark.style.transform).toBe('translateX(296px)');
    expect(mark.style.transition).toBe('transform 400ms linear');
  });

  it('glides across the whole bar on a full-bar rest instead of starting from the centred rest', () => {
    const { handler, mark } = setup();
    const start = recordGlideStart(mark);
    handler.transitionBeatCursor(container(), restBar(), 160, 400, 2000, TO_NEXT_BEAT);
    expect(start.transform).toBe('translateX(10px)');
    expect(mark.style.transform).toBe('translateX(296px)');
    expect(mark.style.transition).toBe('transform 2000ms linear');
  });

  it('places the mark at the bar start on a full-bar rest and never past the bar end', () => {
    const { handler, mark } = setup();
    handler.placeBeatCursor(container(), restBar(), 160);
    expect(mark.style.transform).toBe('translateX(10px)');
    handler.placeBeatCursor(container(), bar(250), 330);
    expect(mark.style.transform).toBe('translateX(296px)');
  });

  it('glides only to the end of the beat before a repeat or a jump', () => {
    const { handler, mark } = setup();
    handler.transitionBeatCursor(container(), bar(100), 100, 160, 500, TO_END_OF_BEAT);
    expect(mark.style.transform).toBe('translateX(153px)');
    expect(mark.style.transition).toBe('transform 500ms linear');
  });

  it('jumps from beat to beat under reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce') }));
    const { handler, mark } = setup();
    handler.transitionBeatCursor(container(), bar(100), 120, 160, 500, TO_NEXT_BEAT);
    expect(mark.style.transform).toBe('translateX(93px)');
    expect(mark.style.transition).toBe('none');
  });
});
