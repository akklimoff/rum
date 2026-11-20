import { transposeChordName } from './theory';

export interface ChordMark {
  bar: number;
  tick: number;
  name: string;
}

export interface ChordChange {
  tick: number;
  name: string;
}

export interface BeatSpan {
  tick: number;
  duration: number;
}

export interface ChordPart {
  capo: number;
  marks: readonly ChordMark[];
}

function marksByBar(marks: readonly ChordMark[]): Map<number, ChordMark[]> {
  const byBar = new Map<number, ChordMark[]>();
  for (const mark of marks) byBar.set(mark.bar, [...(byBar.get(mark.bar) ?? []), mark]);
  return byBar;
}

export function harmonyTimeline(parts: readonly ChordPart[]): ChordChange[] {
  const ranked = parts
    .map((part) => ({
      capo: part.capo,
      bars: marksByBar(part.marks),
    }))
    .sort((a, b) => b.bars.size - a.bars.size);

  const allBars = new Set(ranked.flatMap((part) => [...part.bars.keys()]));
  const changes: ChordChange[] = [];
  for (const bar of allBars) {
    const winner = ranked.find((part) => part.bars.has(bar))!;
    for (const mark of winner.bars.get(bar)!) {
      changes.push({ tick: mark.tick, name: transposeChordName(mark.name, winner.capo) });
    }
  }

  changes.sort((a, b) => a.tick - b.tick);
  return changes.filter((change, i) => i === 0 || change.name !== changes[i - 1]!.name);
}

export function chordAt(timeline: readonly ChordChange[], tick: number): ChordChange | null {
  let current: ChordChange | null = null;
  for (const change of timeline) {
    if (change.tick > tick) break;
    current = change;
  }
  return current;
}

export function chordPlacements(beats: readonly BeatSpan[], timeline: readonly ChordChange[]): Map<number, string> {
  const placed = new Map<number, string>();
  for (const change of timeline) {
    const index = beats.findIndex((beat) => beat.tick <= change.tick && change.tick < beat.tick + beat.duration);
    if (index !== -1 && !placed.has(index)) placed.set(index, change.name);
  }
  return placed;
}
