import { formatNote } from './notes';
import { tonicName } from './scales';

export interface DetectedKey {
  tonicPc: number;
  scale: 'major' | 'minor';
}

// Krumhansl–Kessler key profiles: how strongly each scale step is heard as belonging to a key.
const PROFILES = {
  major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  minor: [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
} as const;

function correlation(a: readonly number[], b: readonly number[]): number {
  const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const meanA = mean(a);
  const meanB = mean(b);
  let product = 0;
  let squaresA = 0;
  let squaresB = 0;
  for (let i = 0; i < a.length; i++) {
    product += (a[i]! - meanA) * (b[i]! - meanB);
    squaresA += (a[i]! - meanA) ** 2;
    squaresB += (b[i]! - meanB) ** 2;
  }
  return squaresA && squaresB ? product / Math.sqrt(squaresA * squaresB) : 0;
}

export function detectKey(pitchClassCounts: readonly number[]): DetectedKey | null {
  if (pitchClassCounts.every((count) => count === 0)) return null;
  let best: DetectedKey | null = null;
  let bestScore = -Infinity;
  for (const scale of ['major', 'minor'] as const) {
    for (let tonicPc = 0; tonicPc < 12; tonicPc++) {
      const fromTonic = PROFILES[scale].map((_, step) => pitchClassCounts[(tonicPc + step) % 12]!);
      const score = correlation(fromTonic, PROFILES[scale]);
      if (score > bestScore) {
        bestScore = score;
        best = { tonicPc, scale };
      }
    }
  }
  return best;
}

export function keyShortName({ tonicPc, scale }: DetectedKey): string {
  return `${formatNote(tonicName(tonicPc, scale))}${scale === 'minor' ? 'min' : 'maj'}`;
}
