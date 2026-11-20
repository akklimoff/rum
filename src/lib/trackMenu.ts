import type { TrackKind } from './trackKind';

export interface TrackEntry {
  index: number;
  kind: TrackKind;
  part: string;
  detail: string;
}

export interface TrackMenu {
  guitars: TrackEntry[];
  others: TrackEntry[];
}

export function trackEntry(name: string, kind: TrackKind, index: number): TrackEntry {
  const pieces = name.split('|').map((piece) => piece.trim()).filter(Boolean);
  const part = pieces.pop() ?? `Дорожка ${index + 1}`;
  return { index, kind, part, detail: pieces.join(' · ') };
}

export function trackMenu(entries: TrackEntry[]): TrackMenu {
  return {
    guitars: entries.filter((entry) => entry.kind === 'guitar'),
    others: entries.filter((entry) => entry.kind !== 'guitar'),
  };
}

export function firstTrack(kinds: TrackKind[]): number {
  return Math.max(0, kinds.indexOf('guitar'));
}
