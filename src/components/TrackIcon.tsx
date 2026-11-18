import type { TrackKind } from '../lib/trackKind';

const SHAPES: Record<TrackKind, React.ReactNode> = {
  guitar: (
    <>
      <path d="M13.5 10.5 20 4" />
      <path d="m18.5 3 2.5 2.5" />
      <path d="M13.8 10.2c1.6 1.6 1.2 3.4.2 4.6-.8 1-.6 2.2-1.6 3.6-1.5 2-4.6 2.3-6.6.4s-1.700-5 .4-6.600c1.400-1 2.600-.8 3.600-1.600 1.200-1 3-1.400 4.600.200Z" />
      <circle cx="9.200" cy="14.800" r="1.300" />
    </>
  ),
  bass: (
    <>
      <path d="M12.500 11.500 21 3" />
      <path d="m19 2.500 2.500 2.500" />
      <path d="M12.500 11.500c1.500 1.500 1.500 3.500.500 4.500-1 1-.500 2.500-2 4-1.800 1.800-4.500 1.500-6-.200-1.600-1.800-1.500-4.300.300-5.800 1.500-1.300 2.700-.500 3.700-1.500s2-2.500 3.500-1Z" />
      <path d="M7 15.500l2 2" />
    </>
  ),
  drums: (
    <>
      <ellipse cx="12" cy="9" rx="8" ry="3.200" />
      <path d="M4 9v6.500c0 1.800 3.600 3.200 8 3.200s8-1.400 8-3.200V9" />
      <path d="M8 12v6M16 12v6M3 3l6 5M21 3l-6 5" />
    </>
  ),
  other: (
    <>
      <path d="M9 17V5l10-2v12" />
      <circle cx="6.500" cy="17" r="2.500" />
      <circle cx="16.500" cy="15" r="2.500" />
    </>
  ),
};

export function TrackIcon({ kind }: { kind: TrackKind }) {
  return (
    <svg className="track-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {SHAPES[kind]}
    </svg>
  );
}
