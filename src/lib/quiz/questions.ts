import {
  CHORD_TYPES,
  FRET_COUNT,
  INTERVALS,
  PROGRESSIONS,
  buildChord,
  diatonicChords,
  formatNote,
  intervalShapes,
  keyTitle,
  neckNotes,
  progressionChords,
  scaleNotes,
  scaleSteps,
  type DegreeNumber,
  type NeckPosition,
} from '../theory';
import { choices, pick, shuffle, type Rng } from './random';

export interface QuizDot extends NeckPosition {
  label: string;
  degreeNumber: DegreeNumber | null;
  isTonic: boolean;
}

interface QuestionBase {
  prompt: string;
  explain: string;
  dots?: QuizDot[];
  links?: { from: NeckPosition; to: NeckPosition }[];
}

export interface ChoiceQuestion extends QuestionBase {
  kind: 'choice';
  options: string[];
  answer: string;
}

export interface NeckQuestion extends QuestionBase {
  kind: 'neck';
  targets: NeckPosition[];
  targetLabel: string;
}

export type Question = ChoiceQuestion | NeckQuestion;
export type QuizId =
  | 'notes'
  | 'intervals'
  | 'major-scale'
  | 'chord-building'
  | 'diatonic-chords'
  | 'functions-cadences'
  | 'progressions'
  | 'seventh-chords';

const KEYS = [0, 7, 2, 9, 4, 5, 10, 3];
const NECK = neckNotes('sharps');
const NOTE_NAMES = [...new Set(NECK.map((n) => formatNote(n.note)))];
const FUNCTION_WORDS = { T: 'тоника', S: 'субдоминанта', D: 'доминанта' } as const;
const CADENCES = PROGRESSIONS.filter((p) => p.kind === 'cadence');
const LOOPS = PROGRESSIONS.filter((p) => p.kind === 'progression' && p.id !== 'blues');
const TRIADS = CHORD_TYPES.filter((t) => t.size === 'triad');
const SEVENTHS = CHORD_TYPES.filter((t) => t.size === 'seventh');

const inKey = (pc: number) => `в тональности ${keyTitle(pc, 'major')}`;
const stringName = (string: number) => `${string + 1}-й струне`;
const mark = (position: NeckPosition): QuizDot => ({ ...position, label: '?', degreeNumber: null, isTonic: false });
const rootDot = (position: NeckPosition): QuizDot => ({ ...position, label: '1', degreeNumber: 1, isTonic: true });
const arrowed = (symbols: string[]) => symbols.join(' → ');
const dashed = (items: string[]) => items.join(' – ');
const semitoneWord = (n: number) => (n === 1 ? 'полутон' : n < 5 ? 'полутона' : 'полутонов');

function notesQuestion(rng: Rng): Question {
  const string = pick([5, 5, 5, 4, 4, 4, 3, 2, 1, 0], rng);
  if (rng() < 0.5) {
    const fret = Math.floor(rng() * 13);
    const note = formatNote(NECK.find((n) => n.string === string && n.fret === fret)!.note);
    return {
      kind: 'choice',
      prompt: 'Какая нота отмечена на грифе?',
      options: choices(note, NOTE_NAMES, rng),
      answer: note,
      explain: `На ${stringName(string)}, лад ${fret} — нота ${note}.`,
      dots: [mark({ string, fret })],
    };
  }
  const target = pick(NECK.filter((n) => n.string === string && n.natural), rng);
  const targets = NECK.filter((n) => n.string === string && n.pc === target.pc).map(({ fret }) => ({ string, fret }));
  return {
    kind: 'neck',
    prompt: `Найди ноту ${target.note} на ${stringName(string)}: нажми на гриф.`,
    targets,
    targetLabel: target.note,
    explain: `${target.note} на ${stringName(string)}: ${targets.length > 1 ? 'лады' : 'лад'} ${targets.map((t) => t.fret).join(' и ')}.`,
  };
}

function intervalsQuestion(rng: Rng): Question {
  const interval = pick(INTERVALS, rng);
  const kind = rng();
  if (kind < 0.3) {
    return {
      kind: 'choice',
      prompt: `Сколько полутонов в интервале «${interval.name}»?`,
      options: choices(String(interval.semitones), INTERVALS.map((i) => String(i.semitones)), rng),
      answer: String(interval.semitones),
      explain: `${interval.name[0]!.toUpperCase()}${interval.name.slice(1)} — ${interval.semitones} ${semitoneWord(interval.semitones)}, то есть ${interval.semitones} ${interval.semitones === 1 ? 'лад' : interval.semitones < 5 ? 'лада' : 'ладов'} по одной струне.`,
    };
  }
  const root = { string: pick([2, 3, 4, 5], rng), fret: 1 + Math.floor(rng() * 9) };
  const targets = intervalShapes(root, interval.semitones, undefined, FRET_COUNT);
  if (kind < 0.65) {
    const target = targets.find((t) => t.string !== root.string) ?? targets[0]!;
    return {
      kind: 'choice',
      prompt: 'Какой интервал между отмеченными нотами (от 1 вверх)?',
      options: choices(interval.name, INTERVALS.map((i) => i.name), rng),
      answer: interval.name,
      explain: `Это ${interval.name}: ${interval.semitones} ${semitoneWord(interval.semitones)}.`,
      dots: [rootDot(root), mark(target)],
      links: [{ from: root, to: target }],
    };
  }
  return {
    kind: 'neck',
    prompt: `Найди ноту на интервал «${interval.name}» выше отмеченной: нажми на гриф.`,
    targets,
    targetLabel: interval.degree,
    explain: `${interval.name[0]!.toUpperCase()}${interval.name.slice(1)} — ${interval.semitones} ${semitoneWord(interval.semitones)} вверх от основного тона.`,
    dots: [rootDot(root)],
  };
}

function scaleQuestion(rng: Rng): Question {
  const key = pick(KEYS, rng);
  const notes = scaleNotes(key, 'major');
  const kind = rng();
  if (kind < 0.25) {
    const steps = scaleSteps('major');
    const i = Math.floor(rng() * 7);
    const names = { Т: 'тон — 2 лада', П: 'полутон — 1 лад' } as Record<string, string>;
    return {
      kind: 'choice',
      prompt: `Какое расстояние в мажорной гамме между ступенями ${i + 1} и ${i === 6 ? '1 (следующей октавы)' : i + 2}?`,
      options: Object.values(names),
      answer: names[steps[i]!]!,
      explain: `Формула мажора: ${steps.join(' – ')}. Полутоны стоят между 3–4 и 7–1.`,
    };
  }
  const note = pick(notes.slice(1), rng);
  if (kind < 0.65) {
    return {
      kind: 'choice',
      prompt: `Какая нота — ${note.degree}-я ступень ${inKey(key)}?`,
      options: choices(note.note, notes.map((n) => n.note), rng),
      answer: note.note,
      explain: `${keyTitle(key, 'major')}: ${dashed(notes.map((n) => n.note))}.`,
    };
  }
  return {
    kind: 'choice',
    prompt: `Какой ступенью является нота ${note.note} ${inKey(key)}?`,
    options: choices(note.degree, notes.map((n) => n.degree), rng),
    answer: note.degree,
    explain: `${keyTitle(key, 'major')}: ${dashed(notes.map((n) => n.note))}.`,
  };
}

function chordFormulaQuestion(types: typeof CHORD_TYPES, noun: string, rng: Rng): Question {
  const type = pick(types, rng);
  const root = pick(KEYS, rng);
  const chord = buildChord(root, type.id);
  const formula = dashed(chord.tones.map((t) => t.degree));
  const kind = rng();
  if (kind < 0.4) {
    return {
      kind: 'choice',
      prompt: `Из каких нот состоит аккорд ${chord.symbol}?`,
      options: shuffle(types.map((t) => dashed(buildChord(root, t.id).tones.map((tone) => tone.note))), rng),
      answer: dashed(chord.tones.map((t) => t.note)),
      explain: `${chord.symbol} — это ${formula}: ${dashed(chord.tones.map((t) => t.note))}.`,
    };
  }
  if (kind < 0.75) {
    return {
      kind: 'choice',
      prompt: `Какой ${noun} даёт формула ${formula}?`,
      options: shuffle(types.map((t) => t.label), rng),
      answer: type.label,
      explain: `${formula} — ${type.label}. Например, ${chord.symbol}: ${dashed(chord.tones.map((t) => t.note))}.`,
    };
  }
  const stacks = types.map((t) => buildChord(0, t.id).thirds.join(' + '));
  return {
    kind: 'choice',
    prompt: `Из каких терций, снизу вверх, сложен ${noun} «${type.label}»?`,
    options: shuffle([...new Set(stacks)], rng),
    answer: chord.thirds.join(' + '),
    explain: `«${type.label}»: ${chord.thirds.join(' + ')} (б3 — большая терция, м3 — малая).`,
  };
}

function diatonicQuestion(rng: Rng): Question {
  const key = pick(KEYS, rng);
  const chords = diatonicChords(key, 'major');
  const chord = pick(chords, rng);
  const explain = `${keyTitle(key, 'major')}: ${chords.map((c) => `${c.roman} = ${c.symbol}`).join(', ')}.`;
  if (rng() < 0.5) {
    return {
      kind: 'choice',
      prompt: `Какой аккорд стоит на ступени ${chord.roman} ${inKey(key)}?`,
      options: choices(chord.symbol, chords.map((c) => c.symbol), rng),
      answer: chord.symbol,
      explain,
    };
  }
  return {
    kind: 'choice',
    prompt: `Какой ступенью является аккорд ${chord.symbol} ${inKey(key)}?`,
    options: choices(chord.roman, chords.map((c) => c.roman), rng),
    answer: chord.roman,
    explain,
  };
}

function functionsQuestion(rng: Rng): Question {
  const kind = rng();
  if (kind < 0.4) {
    const chord = pick(diatonicChords(0, 'major'), rng);
    return {
      kind: 'choice',
      prompt: `Какая функция у аккорда ${chord.roman} в мажоре?`,
      options: Object.values(FUNCTION_WORDS),
      answer: FUNCTION_WORDS[chord.function!],
      explain: 'Тоника: I, vi, iii. Субдоминанта: IV, ii. Доминанта: V, vii°.',
    };
  }
  const cadence = pick(CADENCES, rng);
  if (kind < 0.7) {
    const romans = arrowed(progressionChords(0, cadence.id).map((c) => c.roman));
    return {
      kind: 'choice',
      prompt: `Как называется каденция ${romans}?`,
      options: shuffle(CADENCES.map((c) => c.title), rng),
      answer: cadence.title,
      explain: cadence.about,
    };
  }
  const key = pick(KEYS, rng);
  const answer = arrowed(progressionChords(key, cadence.id).map((c) => c.symbol));
  return {
    kind: 'choice',
    prompt: `${cadence.title} ${inKey(key)} — это…`,
    options: shuffle(CADENCES.map((c) => arrowed(progressionChords(key, c.id).map((chord) => chord.symbol))), rng),
    answer,
    explain: `${cadence.title}: ${arrowed(progressionChords(0, cadence.id).map((c) => c.roman))}. ${cadence.about}`,
  };
}

function progressionsQuestion(rng: Rng): Question {
  const key = pick(KEYS, rng);
  const item = pick(LOOPS, rng);
  const inThisKey = (id: (typeof LOOPS)[number]['id']) => dashed(progressionChords(key, id).map((c) => c.symbol));
  const kind = rng();
  if (kind < 0.2) {
    return {
      kind: 'choice',
      prompt: 'На каких ступенях построен 12-тактовый блюз?',
      options: shuffle(['I, IV, V', 'I, V, vi', 'ii, V, I', 'I, vi, IV'], rng),
      answer: 'I, IV, V',
      explain: 'Блюзовый квадрат — двенадцать тактов на трёх аккордах: I, IV и V.',
    };
  }
  if (kind < 0.6) {
    return {
      kind: 'choice',
      prompt: `Как выглядит прогрессия ${item.title} ${inKey(key)}?`,
      options: shuffle(LOOPS.map((p) => inThisKey(p.id)), rng),
      answer: inThisKey(item.id),
      explain: `${item.title} ${inKey(key)}: ${inThisKey(item.id)}. ${item.about}`,
    };
  }
  return {
    kind: 'choice',
    prompt: `${inThisKey(item.id)} (${keyTitle(key, 'major')}) — какая это прогрессия?`,
    options: shuffle(LOOPS.map((p) => p.title), rng),
    answer: item.title,
    explain: `${inThisKey(item.id)} — это ${item.title}. ${item.about}`,
  };
}

function seventhsQuestion(rng: Rng): Question {
  if (rng() < 0.35) {
    const key = pick(KEYS, rng);
    const chords = diatonicChords(key, 'major', 'sevenths');
    const triads = diatonicChords(key, 'major');
    const index = Math.floor(rng() * 7);
    return {
      kind: 'choice',
      prompt: `Какой септаккорд стоит на ступени ${triads[index]!.roman} ${inKey(key)}?`,
      options: choices(chords[index]!.symbol, chords.map((c) => c.symbol), rng),
      answer: chords[index]!.symbol,
      explain: `Септаккорды тональности ${keyTitle(key, 'major')}: ${chords.map((c) => c.symbol).join(', ')}.`,
    };
  }
  return chordFormulaQuestion(SEVENTHS, 'септаккорд', rng);
}

const GENERATORS: Record<QuizId, (rng: Rng) => Question> = {
  notes: notesQuestion,
  intervals: intervalsQuestion,
  'major-scale': scaleQuestion,
  'chord-building': (rng) => chordFormulaQuestion(TRIADS, 'аккорд', rng),
  'diatonic-chords': diatonicQuestion,
  'functions-cadences': functionsQuestion,
  progressions: progressionsQuestion,
  'seventh-chords': seventhsQuestion,
};

export const QUIZ_IDS = Object.keys(GENERATORS) as QuizId[];
export const ROUND_LENGTH = 8;

export function makeRound(id: QuizId, rng: Rng, length = ROUND_LENGTH): Question[] {
  const round: Question[] = [];
  let attempts = 0;
  while (round.length < length && attempts++ < length * 20) {
    const question = GENERATORS[id](rng);
    if (question.kind === 'neck' && question.targets.length === 0) continue;
    if (round.some((asked) => asked.prompt === question.prompt && JSON.stringify(asked.dots) === JSON.stringify(question.dots))) continue;
    round.push(question);
  }
  return round;
}
