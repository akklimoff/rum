import { useEffect, useState, type CSSProperties } from 'react';
import { STRUM, playNotes } from '../lib/audio';
import { DEFAULT_STATE, parseState, serializeState, type ExplorerState, type LabelMode } from '../lib/explorerState';
import {
  FRET_COUNT,
  SCALES,
  STANDARD_TUNING,
  closeVoicing,
  diatonicChords,
  formatNote,
  fretboardPositions,
  keyTitle,
  positionMidi,
  scaleNotes,
  scaleSteps,
  tonicName,
  type ChordSize,
} from '../lib/theory';
import { ControlRow, FUNCTION_NAMES, FunctionLegend, Segmented } from './controls';
import { Fretboard, type FretboardDot } from './Fretboard';
import './explorer.css';

const TONIC_PCS = Array.from({ length: 12 }, (_, pc) => pc);
const LABEL_MODES: readonly { id: LabelMode; label: string }[] = [
  { id: 'degrees', label: 'ступени' },
  { id: 'notes', label: 'ноты' },
];

const CHORD_SIZES = [
  { id: 'triads', label: 'трезвучия' },
  { id: 'sevenths', label: 'септаккорды' },
] as const;

export function FretboardExplorer({ embedded = false }: { embedded?: boolean }) {
  const [state, setState] = useState<ExplorerState>(DEFAULT_STATE);
  const [addressRead, setAddressRead] = useState(false);
  const [chordIndex, setChordIndex] = useState<number | null>(null);
  const [moreScalesOpen, setMoreScalesOpen] = useState(false);
  const [chordSize, setChordSize] = useState<ChordSize>('triads');

  useEffect(() => {
    if (embedded) return;
    setState(parseState(window.location.search));
    setAddressRead(true);
  }, [embedded]);

  useEffect(() => {
    if (!addressRead) return;
    window.history.replaceState(null, '', `${window.location.pathname}${serializeState(state)}`);
  }, [state, addressRead]);

  const { tonicPc, scale, labels } = state;
  const notes = scaleNotes(tonicPc, scale);
  const chords = diatonicChords(tonicPc, scale, chordSize);
  const Title = embedded ? 'h2' : 'h1';
  const selectedChord = chordIndex === null ? undefined : chords[chordIndex];
  const title = keyTitle(tonicPc, scale);
  const labelName = LABEL_MODES.find((mode) => mode.id === labels)!.label;
  const visibleScales = SCALES.filter((s) => s.primary || moreScalesOpen || s.id === scale);

  const dots: FretboardDot[] = fretboardPositions(notes, STANDARD_TUNING, FRET_COUNT).map(({ string, fret, note }) => ({
    string,
    fret,
    label: labels === 'degrees' ? note.degree : note.note,
    degreeNumber: note.degreeNumber,
    isTonic: note.pc === tonicPc,
    dimmed: selectedChord !== undefined && !selectedChord.pcs.includes(note.pc),
    description: `Струна ${string + 1}, лад ${fret}: ${note.note}, ступень ${note.degree}`,
  }));

  const chooseKey = (change: Partial<Pick<ExplorerState, 'tonicPc' | 'scale'>>) => {
    setChordIndex(null);
    setState((current) => ({ ...current, ...change }));
  };

  return (
    <div className="explorer">
      <div className="explorer-head">
        <Title key={title}>{title}</Title>
        <p key={`notes:${title}`} className="explorer-notes" data-testid="scale-notes">
          {notes.map((note) => (
            <span key={note.degree} data-tonic={note.pc === tonicPc ? '' : undefined}>
              {note.note}
            </span>
          ))}
        </p>
      </div>

      <div className="explorer-controls">
        <div className="explorer-row" role="group" aria-label="Тоника">
          <span className="explorer-label" aria-hidden="true">Тоника</span>
          {TONIC_PCS.map((pc) => (
            <button key={pc} type="button" className="chip" aria-pressed={pc === tonicPc} onClick={() => chooseKey({ tonicPc: pc })}>
              {formatNote(tonicName(pc, scale))}
            </button>
          ))}
        </div>

        <div className="explorer-row" role="group" aria-label="Лад">
          <span className="explorer-label" aria-hidden="true">Лад</span>
          {visibleScales.map((s) => (
            <button key={s.id} type="button" className={s.primary ? 'chip' : 'chip chip-extra'} aria-pressed={s.id === scale} onClick={() => chooseKey({ scale: s.id })}>
              {s.label}
            </button>
          ))}
          <button type="button" className="chip chip-more" aria-expanded={moreScalesOpen} onClick={() => setMoreScalesOpen((isOpen) => !isOpen)}>
            ещё <span className="chip-chevron" aria-hidden="true">▾</span>
          </button>
        </div>

        <div className="explorer-row" role="group" aria-label="Подписи">
          <span className="explorer-label" aria-hidden="true">Подписи</span>
          <span className="segmented" style={{ '--active': LABEL_MODES.findIndex((mode) => mode.id === labels) } as CSSProperties}>
            {LABEL_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className="chip"
                aria-pressed={mode.id === labels}
                onClick={() => setState((current) => ({ ...current, labels: mode.id }))}
              >
                {mode.label}
              </button>
            ))}
          </span>
        </div>
        <ControlRow label="Формула">
          <span className="formula" data-testid="scale-formula">
            {scaleSteps(scale).map((stepName, i) => (
              <span key={i}>{stepName}</span>
            ))}
          </span>
          <span className="explorer-hint">Т — тон (2 лада), П — полутон (1 лад)</span>
        </ControlRow>

        {chords.length > 0 && (
          <ControlRow label="Аккорды">
            <Segmented options={CHORD_SIZES} value={chordSize} onChange={setChordSize} />
          </ControlRow>
        )}
      </div>

      <div className="explorer-board">
        <Fretboard
          dots={dots}
          stringCount={STANDARD_TUNING.length}
          fretCount={FRET_COUNT}
          ariaLabel={`Гриф: ${title}, подписи — ${labelName}`}
          replayKey={`${tonicPc}:${scale}`}
          onPositionClick={(string, fret) => playNotes([positionMidi(string, fret)])}
        />
      </div>

      {chords.length > 0 && (
        <div className="explorer-chords" role="group" aria-label="Аккорды тональности">
          {chords.map((chord, index) => (
            <button
              key={chord.roman}
              type="button"
              className="chord-card"
              data-symbol={chord.symbol}
              data-roman={chord.roman}
              aria-pressed={index === chordIndex}
              onClick={() => {
                if (index !== chordIndex) playNotes(closeVoicing(chord.pcs), STRUM);
                setChordIndex(index === chordIndex ? null : index);
              }}
            >
              <b>{chord.symbol}</b>
              <span>{chord.roman}</span>
              {chord.function && <i data-function={chord.function} title={FUNCTION_NAMES[chord.function]}>{chord.function}</i>}
            </button>
          ))}
        </div>
      )}
      {chords.some((chord) => chord.function) && <FunctionLegend />}
    </div>
  );
}
