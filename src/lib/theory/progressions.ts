import { diatonicChords, type DiatonicChord } from './chords';

export type ProgressionId = 'authentic' | 'plagal' | 'deceptive' | 'pop' | 'two-five-one' | 'fifties' | 'blues';

export interface Progression {
  id: ProgressionId;
  kind: 'cadence' | 'progression';
  title: string;
  degrees: readonly number[];
  about: string;
}

export const PROGRESSIONS: readonly Progression[] = [
  {
    id: 'authentic',
    kind: 'cadence',
    title: 'Автентическая каденция',
    degrees: [4, 0],
    about: 'Доминанта разрешается в тонику: самое сильное «точка, конец фразы».',
  },
  {
    id: 'plagal',
    kind: 'cadence',
    title: 'Плагальная каденция',
    degrees: [3, 0],
    about: 'Субдоминанта уходит в тонику мягко, без напряжения доминанты. Так заканчивается припев Let It Be.',
  },
  {
    id: 'deceptive',
    kind: 'cadence',
    title: 'Обманная каденция',
    degrees: [4, 5],
    about: 'Ухо ждёт тонику после доминанты, а получает vi: фраза не закрывается и просит продолжения.',
  },
  {
    id: 'pop',
    kind: 'progression',
    title: 'I – V – vi – IV',
    degrees: [0, 4, 5, 3],
    about: 'Самая частая прогрессия поп- и рок-музыки. На ней построен куплет Let It Be.',
  },
  {
    id: 'two-five-one',
    kind: 'progression',
    title: 'ii – V – I',
    degrees: [1, 4, 0],
    about: 'Движение субдоминанта → доминанта → тоника. Основа джазовой гармонии.',
  },
  {
    id: 'fifties',
    kind: 'progression',
    title: 'I – vi – IV – V',
    degrees: [0, 5, 3, 4],
    about: 'Прогрессия пятидесятых, как в Stand by Me: из покоя через субдоминанту к доминанте и снова по кругу.',
  },
  {
    id: 'blues',
    kind: 'progression',
    title: '12-тактовый блюз',
    degrees: [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4],
    about: 'Двенадцать тактов на трёх аккордах: I, IV и V. В блюзе все три обычно играют доминантсептаккордами.',
  },
];

export function progression(id: ProgressionId): Progression {
  return PROGRESSIONS.find((item) => item.id === id)!;
}

export function progressionChords(tonicPc: number, id: ProgressionId): DiatonicChord[] {
  const chords = diatonicChords(tonicPc, 'major');
  return progression(id).degrees.map((degree) => chords[degree]!);
}
