export interface SongSection {
  name: string;
  /** Where the section begins, as a share of the whole song from 0 to 1. */
  start: number;
}

export function songSections(bars: readonly { start: number; section?: string }[], totalTicks: number): SongSection[] {
  if (totalTicks <= 0) return [];
  return bars
    .filter((bar) => bar.section?.trim())
    .map((bar) => ({ name: bar.section!.trim(), start: bar.start / totalTicks }));
}

export function sectionAt(sections: readonly SongSection[], position: number): SongSection | null {
  return sections.findLast((section) => section.start <= position) ?? null;
}
