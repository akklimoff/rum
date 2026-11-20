import type * as AlphaTab from '@coderline/alphatab';
import { chordPlacements, harmonyTimeline, type BeatSpan, type ChordChange, type ChordMark } from './harmony';

export function chordMarks(track: AlphaTab.model.Track): ChordMark[] {
  const staff = track.staves[0];
  if (!staff) return [];
  return staff.bars.flatMap((bar) =>
    (bar.voices[0]?.beats ?? [])
      .filter((beat) => beat.chord)
      .map((beat) => ({ bar: bar.index, tick: bar.masterBar.start + beat.playbackStart, name: beat.chord!.name })),
  );
}

const pitchedTracks = (score: AlphaTab.model.Score) => score.tracks.filter((track) => track.staves[0] && !track.staves[0].isPercussion);

export function songHarmony(score: AlphaTab.model.Score): ChordChange[] {
  return harmonyTimeline(pitchedTracks(score).map((track) => ({ capo: track.staves[0]!.capo, marks: chordMarks(track) })));
}

export function addHarmony(alphaTab: typeof AlphaTab, score: AlphaTab.model.Score, timeline: readonly ChordChange[]): void {
  if (timeline.length === 0) return;
  for (const track of pitchedTracks(score)) {
    if (chordMarks(track).length > 0) continue;
    const staff = track.staves[0]!;
    const beats = staff.bars.flatMap((bar) => (bar.voices[0]?.beats ?? []).map((beat) => ({ bar, beat })));
    const spans: BeatSpan[] = beats.map(({ bar, beat }) => ({ tick: bar.masterBar.start + beat.playbackStart, duration: beat.playbackDuration }));
    for (const [index, name] of chordPlacements(spans, timeline)) {
      const id = `harmony-${track.index}-${index}`;
      const chord = new alphaTab.model.Chord();
      chord.name = name;
      chord.showDiagram = false;
      staff.addChord(id, chord);
      beats[index]!.beat.chordId = id;
    }
  }
}
