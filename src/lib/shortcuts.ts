export type ShortcutAction =
  | 'playPause'
  | 'toStart'
  | 'previousBar'
  | 'nextBar'
  | 'loop'
  | 'metronome'
  | 'countIn'
  | 'neck'
  | 'speed50'
  | 'speed75'
  | 'speed100';

const BY_CODE: Record<string, ShortcutAction> = {
  Space: 'playPause',
  Home: 'toStart',
  ArrowLeft: 'previousBar',
  ArrowRight: 'nextBar',
  KeyL: 'loop',
  KeyM: 'metronome',
  KeyC: 'countIn',
  KeyG: 'neck',
  Digit1: 'speed50',
  Digit2: 'speed75',
  Digit3: 'speed100',
};

export interface KeyPress {
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  typing: boolean;
}

export function shortcutAction(press: KeyPress): ShortcutAction | null {
  if (press.typing || press.ctrlKey || press.metaKey || press.altKey) return null;
  return BY_CODE[press.code] ?? null;
}
