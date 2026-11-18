import { useEffect, useRef, useState } from 'react';
import { STRUM, playNotes } from '../lib/audio';
import {
  FRET_COUNT,
  PROGRESSIONS,
  STANDARD_TUNING,
  circleOfFifths,
  closeVoicing,
  formatNote,
  fretboardPositions,
  keyTitle,
  positionMidi,
  progression,
  progressionChords,
  progressionPath,
  scaleNotes,
  tonicName,
  type ProgressionId,
} from '../lib/theory';
import { CircleOfFifths, type CircleSegment } from './CircleOfFifths';
import { ControlRow, FUNCTION_NAMES, FunctionLegend } from './controls';
import { Fretboard, type FretboardDot } from './Fretboard';
import './explorer.css';

const PCS = Array.from({ length: 12 }, (_, pc) => pc);
const BEAT_MS = 950;

interface ProgressionExplorerProps {
  embedded?: boolean;
  initialId?: ProgressionId;
}

export function ProgressionExplorer({ embedded = false, initialId = 'pop' }: ProgressionExplorerProps) {
  const [tonicPc, setTonicPc] = useState(0);
  const [id, setId] = useState<ProgressionId>(initialId);
  const [step, setStep] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  const stopPlayback = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };
  useEffect(() => stopPlayback, []);

  const info = progression(id);
  const chords = progressionChords(tonicPc, id);
  const active = step === null ? undefined : chords[step];
  const Title = embedded ? 'h2' : 'h1';

  const choose = (change: () => void) => {
    stopPlayback();
    setStep(null);
    change();
  };

  const playStep = (index: number) => {
    stopPlayback();
    setStep(index);
    playNotes(closeVoicing(chords[index]!.pcs), STRUM);
  };

  const playAll = () => {
    stopPlayback();
    chords.forEach((chord, index) => {
      playNotes(closeVoicing(chord.pcs), STRUM, (index * BEAT_MS) / 1000, 1.4);
      timers.current.push(window.setTimeout(() => setStep(index), index * BEAT_MS));
    });
    timers.current.push(window.setTimeout(() => setStep(null), chords.length * BEAT_MS + 600));
  };

  const cells = circleOfFifths(tonicPc);
  const cellOfDegree = (degree: number) => cells.find((cell) => cell.degree === degree)!;
  const activeDegree = step === null ? undefined : info.degrees[step];
  const segments: CircleSegment[] = cells.map((cell) => ({
    ring: cell.ring,
    position: cell.position,
    label: cell.label,
    caption: cell.roman,
    inKey: cell.degree !== undefined,
    active: cell.degree !== undefined && cell.degree === activeDegree,
    tonic: cell.degree === 0,
  }));
  const moves = progressionPath(id).map(([from, to]) => ({ from: cellOfDegree(from), to: cellOfDegree(to) }));

  const dots: FretboardDot[] = fretboardPositions(scaleNotes(tonicPc, 'major'), STANDARD_TUNING, FRET_COUNT).map(({ string, fret, note }) => ({
    string,
    fret,
    label: note.degree,
    degreeNumber: note.degreeNumber,
    isTonic: note.pc === tonicPc,
    dimmed: active !== undefined && !active.pcs.includes(note.pc),
    description: `Струна ${string + 1}, лад ${fret}: ${note.note}, ступень ${note.degree}`,
  }));

  const chips = (kind: 'cadence' | 'progression') =>
    PROGRESSIONS.filter((item) => item.kind === kind).map((item) => (
      <button key={item.id} type="button" className="chip" aria-pressed={item.id === id} onClick={() => choose(() => setId(item.id))}>
        {item.title}
      </button>
    ));

  return (
    <div className="explorer">
      <div className="explorer-head">
        <Title key={id}>{info.title}</Title>
        <p className="explorer-notes" key={`${id}:${tonicPc}`}>{keyTitle(tonicPc, 'major')}</p>
      </div>

      <div className="explorer-controls">
        <ControlRow label="Тональность">
          {PCS.map((pc) => (
            <button key={pc} type="button" className="chip" aria-pressed={pc === tonicPc} onClick={() => choose(() => setTonicPc(pc))}>
              {formatNote(tonicName(pc, 'major'))}
            </button>
          ))}
        </ControlRow>
        <ControlRow label="Каденции">{chips('cadence')}</ControlRow>
        <ControlRow label="Прогрессии">{chips('progression')}</ControlRow>
      </div>

      <div className="progression-view">
        <CircleOfFifths
          segments={segments}
          moves={moves}
          ariaLabel={`Квинтовый круг: ${keyTitle(tonicPc, 'major')}, ${chords.map((chord) => chord.symbol).join(' → ')}`}
          onPick={(segment) => choose(() => setTonicPc((segment.position * 7) % 12))}
        />
        <div className="progression-side">
          <p className="explorer-structure">{info.about}</p>
      <div className="progression" role="group" aria-label="Аккорды прогрессии" data-long={chords.length > 6 ? '' : undefined}>
        {chords.map((chord, index) => (
          <button
            key={index}
            type="button"
            className="chord-card"
            aria-pressed={index === step}
            onClick={() => (index === step ? choose(() => undefined) : playStep(index))}
          >
            <b>{chord.symbol}</b>
            <span>{chord.roman}</span>
            <i data-function={chord.function} title={FUNCTION_NAMES[chord.function!]}>{chord.function}</i>
          </button>
        ))}
        <button type="button" className="chip chip-play" onClick={playAll}>▶ слушать</button>
      </div>
          <p className="explorer-hint">Круг: соседние секторы отличаются на квинту. Семь аккордов тональности всегда лежат рядом; нажми на внешний сектор, чтобы сменить тональность.</p>
        </div>
      </div>

      <div className="explorer-board">
        <Fretboard
          dots={dots}
          stringCount={STANDARD_TUNING.length}
          fretCount={FRET_COUNT}
          ariaLabel={`Гриф: ${keyTitle(tonicPc, 'major')}${active ? `, аккорд ${active.symbol}` : ''}`}
          replayKey={String(tonicPc)}
          onPositionClick={(string, fret) => playNotes([positionMidi(string, fret)])}
        />
      </div>

      <FunctionLegend />
    </div>
  );
}
