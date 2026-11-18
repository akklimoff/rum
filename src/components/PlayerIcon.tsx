const SHAPES = {
  loop: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  metronome: (
    <>
      <path d="M9.5 3h5L19 21H5L9.5 3Z" />
      <path d="M12 16.5 17.5 7" />
      <path d="M6.5 16.500h11" />
    </>
  ),
  countIn: (
    <>
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.500v4l2.5 1.5" />
      <path d="M9.5 2.500h5" />
    </>
  ),
  neck: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="1.5" />
      <path d="M8.5 6v12M15 6v12M2.5 10h19M2.5 14h19" />
      <circle cx="11.8" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  tab: (
    <>
      <path d="M3 5h18M3 12h18M3 19h18" opacity="0.45" />
      <text x="12" y="16.2" textAnchor="middle" fontSize="11" fontWeight="700" fill="currentColor" stroke="none">7</text>
    </>
  ),
  score: (
    <>
      <path d="M3 5h18M3 12h18M3 19h18" opacity="0.45" />
      <path d="M11.5 15.500V5.500l5 1.5" />
      <ellipse cx="9.3" cy="15.7" rx="2.3" ry="1.8" fill="currentColor" />
    </>
  ),
} as const;

export type PlayerIconKind = keyof typeof SHAPES;

export function PlayerIcon({ kind }: { kind: PlayerIconKind }) {
  return (
    <svg className="player-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {SHAPES[kind]}
    </svg>
  );
}
