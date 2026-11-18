let context: AudioContext | undefined;

function audio(): AudioContext | undefined {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return undefined;
  context ??= new AudioContext();
  if (context.state === 'suspended') void context.resume();
  return context;
}

const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function pluck(ctx: AudioContext, midi: number, at: number, duration: number) {
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(4200, at);
  filter.frequency.exponentialRampToValueAtTime(700, at + duration);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.22, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  filter.connect(gain).connect(ctx.destination);
  for (const [type, level] of [['triangle', 1], ['sawtooth', 0.25]] as const) {
    const oscillator = ctx.createOscillator();
    const mix = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency(midi);
    mix.gain.value = level;
    oscillator.connect(mix).connect(filter);
    oscillator.start(at);
    oscillator.stop(at + duration);
  }
}

export function playNotes(midis: readonly number[], gap = 0, startIn = 0, duration = 1.8): void {
  const ctx = audio();
  if (!ctx) return;
  midis.forEach((midi, i) => pluck(ctx, midi, ctx.currentTime + 0.02 + startIn + i * gap, duration));
}

export const STRUM = 0.035;
