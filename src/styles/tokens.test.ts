import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8');

function tokensOf(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  const block = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries([...block.matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/g)].map((m) => [m[1]!, m[2]!]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

describe.each([
  ['light', ':root'],
  ['dark', ':root[data-theme="dark"]'],
])('%s theme', (_, selector) => {
  const tokens = tokensOf(selector);

  test.each([1, 2, 3, 4, 5, 6, 7])('label on the degree %i dot is readable', (degree) => {
    expect(contrast(tokens['--dot-ink']!, tokens[`--d${degree}`]!)).toBeGreaterThanOrEqual(4.5);
  });

  test('text on the accent and body text are readable', () => {
    expect(contrast(tokens['--on-accent']!, tokens['--accent']!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens['--fg']!, tokens['--bg']!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens['--muted']!, tokens['--bg']!)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(tokens['--accent-ink']!, tokens['--panel']!)).toBeGreaterThanOrEqual(4.5);
  });
});
