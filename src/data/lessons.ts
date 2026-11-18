export interface Lesson {
  number: number;
  slug: string;
  level: 1 | 2;
  title: string;
  summary: string;
}

export const LEVELS = [
  { level: 1, title: 'Фундамент', summary: 'Без этого дальше никак' },
  { level: 2, title: 'Гармония', summary: 'Понимать песни, а не заучивать' },
] as const;

export const LESSONS: readonly Lesson[] = [
  { number: 1, slug: 'notes', level: 1, title: 'Ноты на грифе', summary: 'Где какая нота и как найти её на любой струне' },
  { number: 2, slug: 'intervals', level: 1, title: 'Интервалы как формы', summary: 'Интервал на гитаре — это геометрия' },
  { number: 3, slug: 'major-scale', level: 1, title: 'Мажорная гамма и ступени', summary: 'Формула, из которой выводится всё остальное' },
  { number: 4, slug: 'chord-building', level: 1, title: 'Построение аккордов', summary: 'Трезвучие — это 1, 3 и 5' },
  { number: 5, slug: 'diatonic-chords', level: 2, title: 'Аккорды тональности', summary: 'Семь аккордов, из которых собрана песня' },
  { number: 6, slug: 'functions-cadences', level: 2, title: 'Функции и каденции', summary: 'Покой, движение, напряжение' },
  { number: 7, slug: 'progressions', level: 2, title: 'Типовые прогрессии', summary: 'Четыре последовательности, на которых держится музыка' },
  { number: 8, slug: 'seventh-chords', level: 2, title: 'Септаккорды', summary: 'Ещё одна терция сверху' },
];
