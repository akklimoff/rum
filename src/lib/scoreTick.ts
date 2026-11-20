export interface PlayedBar {
  start: number;
  end: number;
  scoreStart: number;
}

export function scoreTick(midiTick: number, bars: readonly PlayedBar[]): number {
  const bar = bars.findLast((played) => played.start <= midiTick);
  return bar ? bar.scoreStart + (midiTick - bar.start) : midiTick;
}
