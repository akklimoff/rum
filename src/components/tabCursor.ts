import type * as AlphaTab from '@coderline/alphatab';

type Handler = AlphaTab.ICursorHandler;
type Container = Parameters<Handler['placeBarCursor']>[0];
type BeatBounds = Parameters<Handler['placeBarCursor']>[1];
type CursorMode = Parameters<Handler['transitionBeatCursor']>[5];

const MARK_WIDTH = 14;
const TO_NEXT_BEAT = 1 as CursorMode;

const hostOf = (container: Container) => (container as unknown as { element: HTMLElement }).element;

const barOf = (beatBounds: BeatBounds) => beatBounds.barBounds.masterBarBounds.visualBounds;

const px = (value: number) => `${value}px`;

// A full-bar rest is drawn in the middle of the bar, so its mark sweeps the whole bar instead of starting there.
function glidePath(beatBounds: BeatBounds, nextBeatX: number) {
  const bar = barOf(beatBounds);
  const barStart = bar.x + MARK_WIDTH / 2;
  const barEnd = bar.x + bar.w - MARK_WIDTH / 2;
  return beatBounds.beat.isFullBarRest
    ? { from: barStart, to: barEnd, barEnd }
    : { from: beatBounds.onNotesX, to: Math.min(nextBeatX, barEnd), barEnd };
}

const reducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function tabCursorHandler(): AlphaTab.ICursorHandler {
  const frame = document.createElement('div');
  frame.className = 'tabplayer-bar-frame';
  const mark = document.createElement('div');
  mark.className = 'tabplayer-beat-mark';

  const moveMark = (x: number, ms = 0) => {
    mark.style.transition = ms > 0 ? `transform ${ms}ms linear` : 'none';
    mark.style.transform = `translateX(${px(x - MARK_WIDTH / 2)})`;
  };

  const placeMark = (beatBounds: BeatBounds, x: number) => {
    const bar = barOf(beatBounds);
    mark.style.top = px(bar.y);
    mark.style.height = px(bar.h);
    mark.style.width = px(MARK_WIDTH);
    moveMark(x);
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
      const bar = barOf(beatBounds);
      frame.style.left = px(bar.x);
      frame.style.top = px(bar.y);
      frame.style.width = px(bar.w);
      frame.style.height = px(bar.h);
    },
    placeBeatCursor(_beatCursor, beatBounds, startBeatX) {
      const { from, barEnd } = glidePath(beatBounds, startBeatX);
      placeMark(beatBounds, beatBounds.beat.isFullBarRest && startBeatX <= beatBounds.onNotesX ? from : Math.min(startBeatX, barEnd));
    },
    transitionBeatCursor(_beatCursor, beatBounds, startBeatX, nextBeatX, duration, cursorMode) {
      if (reducedMotion()) {
        placeMark(beatBounds, beatBounds.onNotesX);
        return;
      }
      const { from, to, barEnd } = glidePath(beatBounds, nextBeatX);
      const { onNotesX } = beatBounds;
      // alphaTab gives the start as a point on the way from this beat to the next one; carry that share over to our own path.
      const done = nextBeatX > onNotesX ? Math.min(Math.max((startBeatX - onNotesX) / (nextBeatX - onNotesX), 0), 1) : 0;
      const start = Math.min(from + (to - from) * done, barEnd);
      placeMark(beatBounds, start);
      if (duration <= 0 || to <= start) return;
      // As in alphaTab's own handler: aiming twice as far at the same speed keeps the mark moving when the next beat's update comes late.
      const target = cursorMode === TO_NEXT_BEAT ? Math.min(start + 2 * (to - start), barEnd) : to;
      // Reading layout commits the start position, so the glide starts there and not from wherever the last one stopped.
      void mark.offsetWidth;
      moveMark(target, (duration * (target - start)) / (to - start));
    },
  };
}
