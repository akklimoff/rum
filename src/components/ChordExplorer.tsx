import { useState } from 'react';
import { STRUM, playNotes } from '../lib/audio';
import {
  CHORD_TYPES,
  FRET_COUNT,
  STANDARD_TUNING,
  buildChord,
  chordType,
  chordVoicings,
  closeVoicing,
  neckNotes,
  positionMidi,
  type ChordTone,
  type ChordTypeId,
  type Voicing,
} from '../lib/theory';
import { ControlRow, LABEL_MODES, Segmented } from './controls';
import { Fretboard, type FretboardDot } from './Fretboard';
import './explorer.css';

const PCS = Array.from({ length: 12 }, (_, pc) => pc);
const THIRD_WORDS: Record<string, string> = { б3: 'большая терция', м3: 'малая терция' };
const NECK = neckNotes('sharps', STANDARD_TUNING, FRET_COUNT);
const SHAPE_FRETS = 4;

const soundingNotes = (voicing: Voicing) =>
  voicing.frets.flatMap((fret, string) => (fret === null ? [] : [{ string, fret, midi: positionMidi(string, fret) }]));
const mutedStrings = (voicing: Voicing) => voicing.frets.flatMap((fret, string) => (fret === null ? [string] : []));
const shapeName = (voicing: Voicing) => voicing.frets.map((fret) => fret ?? 'x').reverse().join(' ');

interface ChordExplorerProps {
  embedded?: boolean;
  initialType?: ChordTypeId;
}

export function ChordExplorer({ embedded = false, initialType = 'maj' }: ChordExplorerProps) {
  const [rootPc, setRootPc] = useState(0);
  const [typeId, setTypeId] = useState<ChordTypeId>(initialType);
  const [labels, setLabels] = useState<'degrees' | 'notes'>('degrees');
  const [shapeIndex, setShapeIndex] = useState<number | null>(null);

  const chord = buildChord(rootPc, typeId);
  const toneByPc = new Map(chord.tones.map((tone) => [tone.pc, tone]));
  const voicings = chordVoicings(chord);
  const shape = shapeIndex === null ? undefined : voicings[shapeIndex];
  const Title = embedded ? 'h2' : 'h1';
  const listen = () => playNotes(closeVoicing(chord.tones.map((tone) => tone.pc)), 0.16);

  const chooseRoot = (pc: number) => {
    setRootPc(pc);
    setShapeIndex(null);
  };
  const chooseType = (id: ChordTypeId) => {
    setTypeId(id);
    setShapeIndex(null);
  };
  const chooseShape = (index: number) => {
    playNotes(soundingNotes(voicings[index]!).map((note) => note.midi).sort((a, b) => a - b), STRUM);
    setShapeIndex(index === shapeIndex ? null : index);
  };

  const toneDot = (string: number, fret: number, tone: ChordTone, dimmed: boolean): FretboardDot => ({
    string,
    fret,
    label: labels === 'degrees' ? tone.degree : tone.note,
    degreeNumber: tone.degreeNumber,
    isTonic: tone.pc === rootPc,
    dimmed,
    description: `Струна ${string + 1}, лад ${fret}: ${tone.note}, ступень ${tone.degree}`,
  });

  const dots: FretboardDot[] = NECK.flatMap(({ string, fret, pc }) => {
    const tone = toneByPc.get(pc);
    return tone ? [toneDot(string, fret, tone, shape !== undefined && shape.frets[string] !== fret)] : [];
  });

  const shapeDots = (voicing: Voicing) =>
    soundingNotes(voicing).map(({ string, fret, midi }) => toneDot(string, fret, toneByPc.get(midi % 12)!, false));

  const typeChips = (size: 'triad' | 'seventh') =>
    CHORD_TYPES.filter((type) => type.size === size).map((type) => (
      <button key={type.id} type="button" className="chip" aria-pressed={type.id === typeId} onClick={() => chooseType(type.id)}>
        {type.label}
      </button>
    ));

  return (
    <div className="explorer">
      <div className="explorer-head">
        <Title key={chord.symbol}>{chord.symbol}</Title>
        <p className="explorer-notes" data-testid="chord-summary" key={`notes:${chord.symbol}`}>
          {chord.tones.map((tone) => tone.degree).join(' – ')} · {chord.tones.map((tone) => tone.note).join(' – ')}
        </p>
      </div>

      <div className="explorer-controls">
        <ControlRow label="Основной тон">
          {PCS.map((pc) => (
            <button key={pc} type="button" className="chip" aria-pressed={pc === rootPc} onClick={() => chooseRoot(pc)}>
              {buildChord(pc, typeId).tones[0]!.note}
            </button>
          ))}
        </ControlRow>
        <ControlRow label="Трезвучия">{typeChips('triad')}</ControlRow>
        <ControlRow label="Септаккорды">{typeChips('seventh')}</ControlRow>
        <ControlRow label="Подписи">
          <Segmented options={LABEL_MODES} value={labels} onChange={setLabels} />
          <button type="button" className="chip chip-play" onClick={listen}>▶ слушать</button>
        </ControlRow>
      </div>

      <p className="explorer-structure" data-testid="chord-structure">
        {chordType(typeId).size === 'triad' ? 'Трезвучие' : 'Септаккорд'}: {chord.thirds.map((third) => THIRD_WORDS[third]).join(' + ')}
      </p>

      <div className="explorer-board">
        <Fretboard
          dots={dots}
          stringCount={STANDARD_TUNING.length}
          fretCount={FRET_COUNT}
          ariaLabel={`Гриф: аккорд ${chord.symbol}`}
          replayKey={chord.symbol}
          onPositionClick={(string, fret) => playNotes([positionMidi(string, fret)])}
        />
      </div>

      {voicings.length > 0 && (
        <ul className="chord-shapes" aria-label="Формы">
          {voicings.map((voicing, index) => (
            <li key={`${chord.symbol}:${voicing.frets.join()}`}>
              <button type="button" className="chord-shape" aria-pressed={index === shapeIndex} onClick={() => chooseShape(index)}>
                <Fretboard
                  orientation="vertical"
                  dots={shapeDots(voicing)}
                  stringCount={STANDARD_TUNING.length}
                  fretCount={SHAPE_FRETS}
                  startFret={voicing.startFret}
                  mutedStrings={mutedStrings(voicing)}
                  ariaLabel={`Форма ${chord.symbol}: ${shapeName(voicing)}`}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ul className="explorer-tips">
        <li><b>Аккорд — это терции друг на друге.</b> Мажор: большая, потом малая. Минор: наоборот. Разница в одной ноте — третьей ступени.</li>
        <li><b>Септаккорд</b> — то же трезвучие плюс ещё одна терция сверху. В доминантсептаккорде (7) между 3 и ♭7 получается тритон: он и тянет в тонику.</li>
        <li>Любые три соседние точки 1, 3 и 5 на грифе — уже аккорд. Выученная форма — лишь один из способов их собрать.</li>
      </ul>
    </div>
  );
}
