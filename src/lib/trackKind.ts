export type TrackKind = 'guitar' | 'bass' | 'drums' | 'other';

export interface TrackTraits {
  percussion: boolean;
  /** General MIDI program, counted from 0. */
  program: number;
}

export function trackKind({ percussion, program }: TrackTraits): TrackKind {
  if (percussion) return 'drums';
  if (program >= 32 && program <= 39) return 'bass';
  if (program >= 24 && program <= 31) return 'guitar';
  return 'other';
}
