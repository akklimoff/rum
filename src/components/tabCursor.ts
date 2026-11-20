import type * as AlphaTab from '@coderline/alphatab';

type Handler = AlphaTab.ICursorHandler;
type Container = Parameters<Handler['placeBarCursor']>[0];
type BeatBounds = Parameters<Handler['placeBarCursor']>[1];

const MARK_WIDTH = 14;

const hostOf = (container: Container) => (container as unknown as { element: HTMLElement }).element;

const px = (value: number) => `${value}px`;

export function tabCursorHandler(): AlphaTab.ICursorHandler {
  const frame = document.createElement('div');
  frame.className = 'tabplayer-bar-frame';
  const mark = document.createElement('div');
  mark.className = 'tabplayer-beat-mark';

  const placeMark = (beatBounds: BeatBounds, left: number) => {
    const bar = beatBounds.barBounds.masterBarBounds.visualBounds;
    mark.style.top = px(bar.y);
    mark.style.height = px(bar.h);
    mark.style.width = px(MARK_WIDTH);
    mark.style.left = px(left - MARK_WIDTH / 2);
  };

  return {
    onAttach(cursors) {
      hostOf(cursors.cursorWrapper).append(frame, mark);
    },
    onDetach() {
      frame.remove();
      mark.remove();
    },
    placeBarCursor(_barCursor, beatBounds) {
      const bar = beatBounds.barBounds.masterBarBounds.visualBounds;
      frame.style.left = px(bar.x);
      frame.style.top = px(bar.y);
      frame.style.width = px(bar.w);
      frame.style.height = px(bar.h);
    },
    placeBeatCursor(_beatCursor, beatBounds) {
      placeMark(beatBounds, beatBounds.onNotesX);
    },
    transitionBeatCursor(_beatCursor, beatBounds) {
      placeMark(beatBounds, beatBounds.onNotesX);
    },
  };
}
