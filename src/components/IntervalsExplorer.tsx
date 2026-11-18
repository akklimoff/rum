import { useState, type CSSProperties } from 'react';
import {
  FRET_COUNT,
  INTERVALS,
  STANDARD_TUNING,
  formatNote,
  intervalInfo,
  intervalNoteNames,
  intervalShapes,
  positionMidi,
  type IntervalId,
  type NeckPosition,
} from '../lib/theory';
import { playNotes } from '../lib/audio';
import { Fretboard, type FretboardDot } from './Fretboard';
import './explorer.css';

type LabelMode = 'degrees' | 'notes';

const LABEL_MODES: readonly { id: LabelMode; label: string }[] = [
  { id: 'degrees', label: 'ступени' },
  { id: 'notes', label: 'ноты' },
];
const STRINGS = STANDARD_TUNING.map((_, string) => string).reverse();

const plural = (n: number, one: string, few: string, many: string) => {
  const tens = n % 100;
  const units = n % 10;
  if (tens >= 11 && tens <= 14) return many;
  if (units === 1) return one;
  return units >= 2 && units <= 4 ? few : many;
};

const capitalize = (text: string) => text[0]!.toUpperCase() + text.slice(1);

function describeShape(root: NeckPosition, target: NeckPosition): string {
  const where = target.string === root.string ? 'та же струна' : `${target.string + 1}-я струна`;
  const shift = target.fret - root.fret;
  if (shift === 0) return `${where} · тот же лад`;
  const distance = Math.abs(shift);
  return `${where} · на ${distance} ${plural(distance, 'лад', 'лада', 'ладов')} ${shift > 0 ? 'выше' : 'ниже'}`;
}

export function IntervalsExplorer({ embedded = false }: { embedded?: boolean }) {
  const Title = embedded ? 'h2' : 'h1';
  const [intervalId, setIntervalId] = useState<IntervalId>('P5');
  const [root, setRoot] = useState<NeckPosition>({ string: 4, fret: 3 });
  const [labels, setLabels] = useState<LabelMode>('degrees');

  const interval = intervalInfo(intervalId);
  const names = intervalNoteNames(root, intervalId);
  const targets = intervalShapes(root, interval.semitones, STANDARD_TUNING, FRET_COUNT);
  const rootName = formatNote(names.root);
  const targetName = formatNote(names.target);

  const dots: FretboardDot[] = [
    {
      ...root,
      label: labels === 'degrees' ? '1' : rootName,
      degreeNumber: 1,
      isTonic: true,
      dimmed: false,
      description: `Струна ${root.string + 1}, лад ${root.fret}: ${rootName}, основной тон`,
    },
    ...targets.map((target) => ({
      ...target,
      label: labels === 'degrees' ? interval.degree : targetName,
      degreeNumber: interval.degreeNumber,
      isTonic: false,
      dimmed: false,
      description: `Струна ${target.string + 1}, лад ${target.fret}: ${targetName}, ${interval.name}`,
    })),
  ];

  const listen = (from: NeckPosition = root) => {
    const midi = positionMidi(from.string, from.fret);
    playNotes([midi, midi + interval.semitones], 0.45);
  };

  const moveFret = (step: number) => setRoot((current) => ({ ...current, fret: current.fret + step }));

  return (
    <div className="explorer">
      <div className="explorer-head">
        <Title key={intervalId}>{capitalize(interval.name)}</Title>
        <p className="explorer-notes" data-testid="interval-summary" key={`${intervalId}:${rootName}`}>
          {interval.semitones} {plural(interval.semitones, 'полутон', 'полутона', 'полутонов')} · {rootName} → {targetName}
        </p>
      </div>

      <div className="explorer-controls">
        <div className="explorer-row" role="group" aria-label="Интервал">
          <span className="explorer-label" aria-hidden="true">Интервал</span>
          {INTERVALS.map((i) => (
            <button key={i.id} type="button" className="chip" aria-pressed={i.id === intervalId} aria-label={i.short} title={i.name} onClick={() => setIntervalId(i.id)}>
              {i.short}
            </button>
          ))}
        </div>

        <div className="explorer-row" role="group" aria-label="Струна">
          <span className="explorer-label" aria-hidden="true">Струна</span>
          {STRINGS.map((string) => (
            <button key={string} type="button" className="chip" aria-pressed={string === root.string} onClick={() => setRoot((current) => ({ ...current, string }))}>
              {string + 1}
            </button>
          ))}
        </div>

        <div className="explorer-row" role="group" aria-label="Лад">
          <span className="explorer-label" aria-hidden="true">Лад</span>
          <span className="stepper">
            <button type="button" className="chip" aria-label="Лад ниже" disabled={root.fret === 0} onClick={() => moveFret(-1)}>−</button>
            <output aria-live="polite">{root.fret}</output>
            <button type="button" className="chip" aria-label="Лад выше" disabled={root.fret === FRET_COUNT} onClick={() => moveFret(1)}>+</button>
          </span>
          <span className="explorer-hint">или нажми на гриф</span>
        </div>

        <div className="explorer-row" role="group" aria-label="Подписи">
          <span className="explorer-label" aria-hidden="true">Подписи</span>
          <span className="segmented" style={{ '--active': LABEL_MODES.findIndex((mode) => mode.id === labels) } as CSSProperties}>
            {LABEL_MODES.map((mode) => (
              <button key={mode.id} type="button" className="chip" aria-pressed={mode.id === labels} onClick={() => setLabels(mode.id)}>
                {mode.label}
              </button>
            ))}
          </span>
          <button type="button" className="chip chip-play" onClick={() => listen()}>▶ слушать</button>
        </div>
      </div>

      <div className="explorer-board">
        <Fretboard
          dots={dots}
          stringCount={STANDARD_TUNING.length}
          fretCount={FRET_COUNT}
          ariaLabel={`Гриф: ${interval.name} от ${rootName}`}
          replayKey={`${intervalId}:${root.string}:${root.fret}`}
          links={targets.map((target) => ({ from: root, to: target }))}
          onPositionClick={(string, fret) => {
            setRoot({ string, fret });
            listen({ string, fret });
          }}
        />
      </div>

      <ul className="shape-list" aria-label="Формы">
        {targets.map((target) => (
          <li key={`${target.string}:${target.fret}`}>{describeShape(root, target)}</li>
        ))}
      </ul>

      <ul className="explorer-tips">
        <li>Форма интервала одна и та же в любом месте грифа: запомнил её один раз — играешь от любой ноты.</li>
        <li><b>Исключение — пара третьей и второй струн.</b> Они настроены в большую терцию, остальные соседние — в кварту, поэтому при переходе через эту пару форма сдвигается на один лад выше.</li>
      </ul>
    </div>
  );
}
