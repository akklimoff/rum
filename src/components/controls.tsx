import type { CSSProperties, ReactNode } from 'react';

export function ControlRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="explorer-row" role="group" aria-label={label}>
      <span className="explorer-label" aria-hidden="true">{label}</span>
      {children}
    </div>
  );
}

interface SegmentedProps<T extends string> {
  options: readonly { id: T; label: ReactNode; name?: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const style = { '--active': options.findIndex((option) => option.id === value), '--count': options.length } as CSSProperties;
  return (
    <span className="segmented" style={style}>
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          className="chip"
          aria-pressed={option.id === value}
          aria-label={option.name}
          title={option.name}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </span>
  );
}

export const LABEL_MODES = [
  { id: 'degrees', label: 'ступени' },
  { id: 'notes', label: 'ноты' },
] as const;

export const FUNCTION_NAMES = { T: 'тоника', S: 'субдоминанта', D: 'доминанта' } as const;

export function FunctionLegend() {
  return (
    <p className="function-legend">
      <b data-function="T">T</b> тоника — покой · <b data-function="S">S</b> субдоминанта — движение ·{' '}
      <b data-function="D">D</b> доминанта — напряжение
    </p>
  );
}
