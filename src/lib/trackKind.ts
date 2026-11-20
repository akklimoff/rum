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

interface TrackLike {
  staves: readonly { isPercussion: boolean }[];
  playbackInfo: { program: number };
}

export function kindOfTrack(track: TrackLike): TrackKind {
  return trackKind({ percussion: track.staves[0]?.isPercussion ?? false, program: track.playbackInfo.program });
}
