import { useState, type CSSProperties } from 'react';
import { FRET_COUNT, STANDARD_TUNING, formatNote, neckNotes, positionMidi, russianNoteName } from '../lib/theory';
import { playNotes } from '../lib/audio';
import { Fretboard, type FretboardDot } from './Fretboard';
import './explorer.css';

type Accidentals = 'sharps' | 'flats';
type Visible = 'all' | 'natural';

const ACCIDENTALS: readonly { id: Accidentals; label: string }[] = [
  { id: 'sharps', label: '♯' },
  { id: 'flats', label: '♭' },
];
const VISIBLE: readonly { id: Visible; label: string }[] = [
  { id: 'all', label: 'все' },
  { id: 'natural', label: 'без знаков' },
];
const PCS = Array.from({ length: 12 }, (_, pc) => pc);

export function NotesExplorer({ embedded = false }: { embedded?: boolean }) {
  const Title = embedded ? 'h2' : 'h1';
  const [accidentals, setAccidentals] = useState<Accidentals>('sharps');
  const [visible, setVisible] = useState<Visible>('all');
  const [focusPc, setFocusPc] = useState<number | null>(null);

  const allNotes = neckNotes(accidentals, STANDARD_TUNING, FRET_COUNT);
  const nameOf = (pc: number) => allNotes.find((n) => n.pc === pc)!.note;
  const shown = allNotes.filter((n) => visible === 'all' || n.natural || n.pc === focusPc);

  const dots: FretboardDot[] = shown.map(({ string, fret, note, pc }) => ({
    string,
    fret,
    label: formatNote(note),
    degreeNumber: pc === focusPc ? 1 : null,
    isTonic: pc === focusPc,
    dimmed: focusPc !== null && pc !== focusPc,
    description: `Струна ${string + 1}, лад ${fret}: ${formatNote(note)}`,
  }));

  return (
    <div className="explorer">
      <div className="explorer-head">
        <Title>Ноты на грифе</Title>
        <p className="explorer-notes" key={focusPc ?? 'all'}>
          {focusPc === null ? 'выбери ноту, чтобы найти её на всех струнах' : `${formatNote(nameOf(focusPc))} — ${russianNoteName(nameOf(focusPc))}`}
        </p>
      </div>

      <div className="explorer-controls">
        <div className="explorer-row" role="group" aria-label="Найти ноту">
          <span className="explorer-label" aria-hidden="true">Найти ноту</span>
          {PCS.map((pc) => (
            <button key={pc} type="button" className="chip" aria-pressed={pc === focusPc} onClick={() => setFocusPc(pc === focusPc ? null : pc)}>
              {formatNote(nameOf(pc))}
            </button>
          ))}
        </div>

        <div className="explorer-row" role="group" aria-label="Показать">
          <span className="explorer-label" aria-hidden="true">Показать</span>
          <span className="segmented" style={{ '--active': VISIBLE.findIndex((v) => v.id === visible) } as CSSProperties}>
            {VISIBLE.map((v) => (
              <button key={v.id} type="button" className="chip" aria-pressed={v.id === visible} onClick={() => setVisible(v.id)}>
                {v.label}
              </button>
            ))}
          </span>
        </div>

        <div className="explorer-row" role="group" aria-label="Знаки">
          <span className="explorer-label" aria-hidden="true">Знаки</span>
          <span className="segmented" style={{ '--active': ACCIDENTALS.findIndex((a) => a.id === accidentals) } as CSSProperties}>
            {ACCIDENTALS.map((a) => (
              <button key={a.id} type="button" className="chip" aria-pressed={a.id === accidentals} onClick={() => setAccidentals(a.id)}>
                {a.label}
              </button>
            ))}
          </span>
        </div>
      </div>

      <div className="explorer-board">
        <Fretboard
          dots={dots}
          stringCount={STANDARD_TUNING.length}
          fretCount={FRET_COUNT}
          ariaLabel="Гриф: названия нот"
          replayKey={`${visible}:${focusPc ?? 'all'}`}
          onPositionClick={(string, fret) => playNotes([positionMidi(string, fret)])}
        />
      </div>

      <ul className="explorer-tips">
        <li><b>E–F и B–C</b> стоят на соседних ладах: между ними нет диеза.</li>
        <li><b>12-й лад</b> повторяет открытую струну октавой выше, дальше всё идёт по кругу.</li>
        <li><b>5-й лад</b> звучит как следующая, более тонкая открытая струна. Исключение — третья струна: там это 4-й лад.</li>
        <li><b>Октава</b> той же ноты — через две струны и на два лада выше; с четвёртой и третьей струн — на три.</li>
      </ul>
    </div>
  );
}
