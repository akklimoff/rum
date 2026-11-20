# Плеер: подсветка, аккорды, вертикальный гриф, формы аккордов — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подсветить место в табах, показать аккорды песни над тактами и со ступенью, поставить гриф вертикально сбоку и добавить во вкладку «Аккорд» формы для игры.

**Architecture:** Теория (римская цифра, сдвиг названия, поиск форм) — чистые функции в `src/lib/theory`. Табличная логика плеера (источник гармонии, таблица смен, привязка к ударам, крестики) — чистые функции в `src/lib`. Единственный модуль, который трогает модель alphaTab, — `src/lib/scoreChords.ts`. `Fretboard` учится рисоваться вертикально, окном ладов и с крестиками, ничего не зная про теорию.

**Tech Stack:** Astro 6, React 19, TypeScript 7, `tonal`, alphaTab 1.9, Vitest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-20-player-chords-vertical-neck-design.md`

## Global Constraints

- Теория — чистые функции поверх `tonal` в `src/lib/theory`, без React и DOM; таблицы нот и форм вручную не забиваются.
- `Fretboard.tsx` получает готовые точки и рисует SVG; теорию не знает.
- Цвет ступени — только `var(--d1)`…`var(--d7)`; палитра — только `src/styles/tokens.css`; голубого и бирюзового нет.
- Движение — CSS с `--ease-*`; при `prefers-reduced-motion: reduce` всё отключается.
- На экране `♯` и `♭`, не `#` и `b`. Интерфейс на русском.
- Римские цифры — относительно мажора (ля минор: i, ii°, ♭III, iv, v, ♭VI, ♭VII).
- Своей отрисовки табов нет: всё внутри табулатуры рисует alphaTab.
- Комментарии в коде — только «почему»; коммиты — одна строка на английском в повелительном наклонении, без атрибуции LLM.
- Задача готова, когда зелёные `npm test`, `npx tsc --noEmit -p .`, `npm run build`, `npm run check:links`.
- Табы не в git: тесты на настоящих файлах — `test.skipIf(!existsSync(path))`, как в `src/lib/songs.test.ts`.

## Review Focus

1. В песне нет аккордов ни у одной дорожки → строка показывает тональность и раздел, плеер работает как сейчас (Task 2: `harmonyTimeline([])` → `[]`; Task 3: `addHarmony` с пустой таблицей ничего не меняет).
2. Смена аккорда приходится на середину тянущейся ноты → аккорд стоит на звучащем ударе, а не пропадает (Task 2: тест `chordPlacements` на покрывающий удар).
3. Ударные не получают названий аккордов, дорожки со своими аккордами сохраняют свои названия-формы (Task 3: тест на настоящем файле).
4. Окно шириной у порога: смена ориентации грифа туда-обратно без ошибок и с перераскладкой табов (Task 5: шаг проверки в браузере).
5. Аккорд с ≤3 звуками и тип без форм не ломают вкладку: пустой ряд форм просто не показывается (Task 6: тест `chordVoicings` для dim/aug и рендер без форм).

---

### Task 1: Рамка такта и плашка удара

**Files:**
- Modify: `src/components/tabplayer.css` (правила `.tabplayer-surface .at-cursor-bar`, `.at-cursor-beat`)
- Add to commit: `docs/superpowers/specs/2026-11-20-player-chords-vertical-neck-design.md`, `docs/superpowers/plans/2026-11-20-player-chords-vertical-neck.md`

**Interfaces:** нет.

- [ ] **Step 1: Такт — скруглённая рамка.** `.at-cursor-bar`: `border: 1.5px solid color-mix(in srgb, var(--accent) 55%, transparent)`, `border-radius: 10px`, заливка слабее нынешней (около 8%), `box-sizing: border-box`.
- [ ] **Step 2: Удар — плашка.** `.at-cursor-beat`: ширина около 14px, сдвиг на половину ширины влево (чтобы плашка стояла по центру удара), `border-radius: 7px`, фон — акцент 28–35%. Если alphaTab задаёт ширину или положение удара инлайн и CSS их не перебивает — найти настройку alphaTab, свою отрисовку не писать.
- [ ] **Step 3: Движение.** Если у курсора есть переход — кривая `--ease-*`; внутри `@media (prefers-reduced-motion: reduce)` — `transition: none`.
- [ ] **Step 4: Проверка в браузере.** `npm run build`, затем `npx astro preview --port 4329`; страница `/songs/dont-look-back-in-anger/`, «Играть»: рамка обводит текущий такт, плашка идёт по ударам, цифры табов под плашкой читаются, в светлой и тёмной теме. Остановить: `npx astro preview stop`.
- [ ] **Step 5: Коммит.**

```bash
git add src/components/tabplayer.css docs/superpowers/specs/2026-11-20-player-chords-vertical-neck-design.md docs/superpowers/plans/2026-11-20-player-chords-vertical-neck.md
git commit -m "Frame the current bar and mark the sounding beat"
```

---

### Task 2: Гармония песни — чистые функции

**Files:**
- Create: `src/lib/theory/chordSymbols.ts`, `src/lib/theory/chordSymbols.test.ts`
- Modify: `src/lib/theory/index.ts` (экспорт)
- Create: `src/lib/harmony.ts`, `src/lib/harmony.test.ts`

**Interfaces:**
- Produces (`src/lib/theory`):
  - `transposeChordName(name: string, semitones: number): string` — разбирает `♯ ♭ ( )` из файлов, сдвигает через `tonal` (`Interval.fromSemitones`, `Chord.transpose`), возвращает с `♯`/`♭`. `semitones === 0` → название как было.
  - `chordRoman(name: string, key: DetectedKey): { roman: string; degreeNumber: DegreeNumber | null }` — цифра относительно мажора от тоники `key`; `degreeNumber` — ступень основного тона в гамме `scaleNotes(key.tonicPc, key.scale)` или `null`, если тона в гамме нет.
- Produces (`src/lib/harmony.ts`):
  - `interface ChordMark { bar: number; tick: number; name: string }`
  - `interface ChordChange { tick: number; name: string }`
  - `interface BeatSpan { tick: number; duration: number }`
  - `interface ChordPart { capo: number; marks: readonly ChordMark[] }`
  - `harmonyTimeline(parts: readonly ChordPart[]): ChordChange[]` — старшинство: больше тактов с отметками, при равенстве раньше в списке; в каждом такте — отметки самой старшей части, у которой они в этом такте есть; каждая часть сдвигается на свой `capo`; итог по времени, повторы подряд схлопнуты; нет отметок — `[]`.
  - `chordAt(timeline: readonly ChordChange[], tick: number): ChordChange | null`
  - `chordPlacements(beats: readonly BeatSpan[], timeline: readonly ChordChange[]): Map<number, string>` — индекс удара → название.

- [ ] **Step 1: Тесты `chordSymbols.test.ts`.**

```ts
const C = { tonicPc: 0, scale: 'major' } as const;
const Am = { tonicPc: 9, scale: 'minor' } as const;
test('roman numerals in a major key', () => {
  expect(['Am', 'E', 'Fm', 'G7', 'Bdim', 'Bm7b5', 'Fmaj7', 'C/E', 'Gadd11'].map((n) => chordRoman(n, C).roman))
    .toEqual(['vi', 'III', 'iv', 'V7', 'vii°', 'viiø7', 'IVmaj7', 'I', 'V']);
});
test('roman numerals in a minor key are counted from the major scale', () => {
  expect(['Am', 'C', 'G', 'E', 'Bdim', 'F'].map((n) => chordRoman(n, Am).roman))
    .toEqual(['i', '♭III', '♭VII', 'V', 'ii°', '♭VI']);
});
test('the colour degree is the root inside the key, or none', () => {
  expect(chordRoman('Am', C).degreeNumber).toBe(6);
  expect(chordRoman('E', C).degreeNumber).toBe(3);
  expect(chordRoman('B♭', C).degreeNumber).toBeNull();
});
test('names from Guitar Pro files are read with their own sharps, flats and brackets', () => {
  expect(chordRoman('C♯m7(♭5)', { tonicPc: 2, scale: 'major' }).roman).toBe('viiø7');
});
test('a capo shifts chord shapes to what sounds', () => {
  expect(['G', 'G/F♯', 'Em', 'B7/D♯'].map((n) => transposeChordName(n, 5))).toEqual(['C', 'C/B', 'Am', 'E7/G♯']);
  expect(transposeChordName('C♯m7(♭5)', 7)).toBe('G♯m7♭5');
  expect(transposeChordName('Gadd11', 0)).toBe('Gadd11');
});
```

- [ ] **Step 2: Тесты `harmony.test.ts`.**

```ts
const mark = (bar: number, tick: number, name: string) => ({ bar, tick, name });
const part = (capo: number, ...marks: ChordMark[]) => ({ capo, marks });
test('the timeline is in sounding pitch, in time order, without repeats', () => {
  expect(harmonyTimeline([part(5, mark(1, 3840, 'Em'), mark(0, 0, 'G'), mark(0, 1920, 'G'))]))
    .toEqual([{ tick: 0, name: 'C' }, { tick: 3840, name: 'Am' }]);
});
test('in each bar the part with chords in the most bars wins, the earliest on a tie', () => {
  const main = part(0, mark(1, 3840, 'C'), mark(2, 7680, 'F'), mark(3, 11520, 'G'));
  const other = part(0, mark(0, 0, 'Em7'), mark(1, 3840, 'Am'));
  expect(harmonyTimeline([other, main]).map((c) => c.name)).toEqual(['Em7', 'C', 'F', 'G']);
  expect(harmonyTimeline([part(0, mark(0, 0, 'D')), part(0, mark(0, 0, 'G'))]).map((c) => c.name)).toEqual(['D']);
});
test('each part is shifted by its own capo', () => {
  expect(harmonyTimeline([part(0, mark(1, 3840, 'C'), mark(2, 7680, 'F')), part(7, mark(0, 0, 'Em'))]).map((c) => c.name))
    .toEqual(['Bm', 'C', 'F']);
});
test('no chord marks anywhere means no harmony', () => {
  expect(harmonyTimeline([part(0)])).toEqual([]);
  expect(harmonyTimeline([])).toEqual([]);
});
test('the chord at a moment is the last change before it', () => {
  const timeline = [{ tick: 960, name: 'C' }, { tick: 3840, name: 'Am' }];
  expect(chordAt(timeline, 0)).toBeNull();
  expect(chordAt(timeline, 960)?.name).toBe('C');
  expect(chordAt(timeline, 5000)?.name).toBe('Am');
});
test('a chord goes on the beat that starts with it, or on the one still sounding', () => {
  const beats = [{ tick: 0, duration: 1920 }, { tick: 1920, duration: 1920 }, { tick: 3840, duration: 960 }];
  const placed = chordPlacements(beats, [{ tick: 0, name: 'C' }, { tick: 2880, name: 'F' }, { tick: 3840, name: 'G' }]);
  expect([...placed]).toEqual([[0, 'C'], [1, 'F'], [2, 'G']]);
});
test('one beat carries one chord: the first change inside it', () => {
  expect([...chordPlacements([{ tick: 0, duration: 3840 }], [{ tick: 0, name: 'C' }, { tick: 1920, name: 'G' }])]).toEqual([[0, 'C']]);
});
```

- [ ] **Step 3: Прогнать, убедиться, что тесты падают.** `npx vitest run src/lib/theory/chordSymbols.test.ts src/lib/harmony.test.ts` → FAIL (модулей нет).
- [ ] **Step 4: Реализовать оба модуля по интерфейсам выше.** Римская цифра: полутоны от тоники до основного тона → `I ♭II II ♭III III IV ♭V V ♭VI VI ♭VII VII`; регистр и метки — по `Chord.get(name).type`: minor / minor seventh → строчная; diminished → строчная + `°`; half-diminished → строчная + `ø7`; diminished seventh → строчная + `°7`; augmented → `+`; dominant seventh → `7`; major seventh → `maj7`; остальное (sus, add, 5, нераспознанное) — заглавная без метки. Бас после `/` на цифру не влияет.
- [ ] **Step 5: Прогнать тесты.** Та же команда → PASS. Плюс `npx tsc --noEmit -p .`.
- [ ] **Step 6: Коммит.** `git add src/lib/theory/chordSymbols.ts src/lib/theory/chordSymbols.test.ts src/lib/theory/index.ts src/lib/harmony.ts src/lib/harmony.test.ts` и `git commit -m "Add chord timeline and roman numerals for song harmony"`.

---

### Task 3: Аккорды в плеере

**Files:**
- Create: `src/lib/scoreChords.ts`, `src/lib/scoreChords.test.ts` (`// @vitest-environment node`)
- Modify: `src/components/TabPlayer.tsx`, `src/components/tabplayer.css`

**Interfaces:**
- Consumes: всё из Task 2.
- Produces (`src/lib/scoreChords.ts`, единственный модуль, который меняет модель alphaTab):
  - `chordMarks(track: AlphaTab.model.Track): ChordMark[]` — по `staves[0]`, первый голос; `tick = bar.masterBar.start + beat.playbackStart`, `name = beat.chord!.name`.
  - `songHarmony(score: AlphaTab.model.Score): ChordChange[]` — `harmonyTimeline` по всем неударным дорожкам (`capo = staves[0].capo`, `marks = chordMarks(track)`); без аккордов → `[]`.
  - `addHarmony(alphaTab: typeof AlphaTab, score: AlphaTab.model.Score, timeline: readonly ChordChange[]): void` — каждой неударной дорожке без своих аккордов вставляет аккорды по `chordPlacements` через `staff.addChord(id, chord)` и `beat.chordId`; у вставленных `showDiagram = false`.

- [ ] **Step 1: Тесты на настоящих файлах** (каждый — `test.skipIf(!existsSync(file))`, файл грузится `alphaTab.importer.ScoreLoader.loadScoreFromBytes`).

```ts
test('Wish You Were Here gets its intro chords from the 12-string and the verse from the Martin D-35', () => {
  const harmony = songHarmony(wywh);
  expect(harmony.slice(0, 2)).toEqual([{ tick: 7680, name: 'Em7' }, { tick: 11520, name: 'G' }]);
  expect(chordAt(harmony, 76320)?.name).toBe('G');
});
test('Hotel California sounds a fifth above its capo-7 shapes', () => {
  expect(songHarmony(hotel)[0]).toEqual({ tick: 1200, name: 'F♯7' });
});
test('Oasis follows the piano', () => {
  expect(songHarmony(oasis).slice(0, 2).map((c) => c.name)).toEqual(['C', 'F']);
});
test('after adding the harmony the lead part shows chords, drums do not, rhythm parts keep their own names', () => {
  const ownNames = chordMarks(oasis.tracks[2]!).map((m) => m.name);
  addHarmony(alphaTab, oasis, songHarmony(oasis));
  expect(chordMarks(oasis.tracks[3]!).length).toBeGreaterThan(0);
  expect(chordMarks(oasis.tracks[15]!)).toEqual([]);
  expect(chordMarks(oasis.tracks[2]!).map((m) => m.name)).toEqual(ownNames);
});
test('a song without chords is left as it was', () => {
  addHarmony(alphaTab, oasis, []);
  /* ни у одной дорожки число отметок не изменилось */
});
```

Ожидаемые значения взяты из файлов 20.11.2026: у Wish You Were Here первая отметка Martin D-35 (дорожка 3) — G на тике 76320, у 12-струнной (дорожка 5) — Em7 на 7680 и G на 11520; у Hotel California 12-струнная (дорожка 6, каподастр 7) начинается с B7 на 1200; у Oasis пианино (дорожка 13) — C, F.

- [ ] **Step 2: Прогнать → FAIL**, реализовать `scoreChords.ts`, прогнать → PASS.
- [ ] **Step 3: Подключить к плееру.** В обработчике `scoreLoaded` (он срабатывает до первой отрисовки) — `const harmony = songHarmony(score); addHarmony(alphaTab, score, harmony);`, сохранить `harmony` в `useRef`. В `playerPositionChanged` — `setCurrentChord(chordAt(harmony, args.currentTick))` (обновлять состояние только при смене аккорда).
- [ ] **Step 4: Строка над кнопками.** Нынешний `<p className="tabplayer-key">` из панели грифа переезжает в нижнюю панель над `.tabplayer-bar` и становится `<p className="tabplayer-info">`, видна и при скрытом грифе: `keyShortName(key)` (с `title={keyTitle(...)}`) · `currentSection.name` · аккорд-плашка `<span className="tabplayer-chord" data-degree={n} style={{ '--chord': n ? `var(--d${n})` : 'var(--muted)' }}>Am <b>vi</b></span>`. Части, которых нет, пропускаются вместе с точкой-разделителем. Римская цифра — `chordRoman(currentChord.name, key)`; без `key` — только название.
- [ ] **Step 5: Стили** `.tabplayer-info` и `.tabplayer-chord`: мелкий текст как у нынешней `.tabplayer-key`; плашка — фон `color-mix(in srgb, var(--chord) 22%, transparent)`, рамка `var(--chord)`, скругление; смена аккорда без анимации при reduced motion.
- [ ] **Step 6: Проверка в браузере.** Wish You Were Here на Lead Guitar: над тактами аккорды, строка `Gmaj · Intro · Em7 vi`-подобная меняется во время игры; Oasis на акустике: в табах G/Em (формы), в строке C/Am; ударные — без аккордов. `npm test`, `npx tsc --noEmit -p .`.
- [ ] **Step 7: Коммит.** `git commit -m "Show song chords above every track and in the player info line"`.

---

### Task 4: Крестики у порожка

**Files:**
- Modify: `src/components/Fretboard.tsx`, `src/components/Fretboard.test.tsx`, `src/components/fretboard.css`
- Modify: `src/lib/tabNeck.ts`, `src/lib/tabNeck.test.ts`, `src/components/TabPlayer.tsx`

**Interfaces:**
- Produces: `Fretboard` prop `mutedStrings?: readonly number[]` — индексы струн грифа (0 — верхняя ми), рисуются `×` в позиции открытой струны, класс `fretboard-muted`, `aria-hidden`.
- Produces: `tabNeckMutedStrings(notes: TabNote[], tuning: readonly number[]): number[]`.

- [ ] **Step 1: Тесты.**

```ts
// tabNeck.test.ts
test('a chord on the sounding beat marks the strings it leaves out', () => {
  const chord = [5, 4, 3].map((string) => ({ string, fret: 2, beat: 0, sounding: true, dead: false }));
  expect(tabNeckMutedStrings(chord, [64, 59, 55, 50, 45, 40])).toEqual([0, 1, 2]);
});
test('a melody note marks nothing', () => {
  expect(tabNeckMutedStrings([{ string: 3, fret: 5, beat: 0, sounding: true, dead: false }], [64, 59, 55, 50, 45, 40])).toEqual([]);
});
test('a muted note counts as a played string', () => { /* 3 звучащие ноты, одна из них dead → её струна не в списке */ });
// Fretboard.test.tsx
test('muted strings get a cross at the nut', () => { /* mutedStrings={[0, 5]} → два элемента .fretboard-muted с текстом × */ });
```

- [ ] **Step 2: FAIL → реализация → PASS.** Звучащий удар — ноты с `sounding: true`; меньше трёх таких струн → `[]`.
- [ ] **Step 3: Подключить** `mutedStrings={tabNeckMutedStrings(neck.notes, neck.tuning)}` у грифа плеера.
- [ ] **Step 4: Коммит.** `git commit -m "Cross out strings a chord leaves silent"`.

---

### Task 5: Вертикальный гриф

**Files:**
- Modify: `src/components/Fretboard.tsx`, `src/components/Fretboard.test.tsx`, `src/components/fretboard.css`
- Modify: `src/components/TabPlayer.tsx`, `src/components/tabplayer.css`

**Interfaces:**
- Produces: `Fretboard` prop `orientation?: 'horizontal' | 'vertical'` (по умолчанию `'horizontal'`, все нынешние тесты без изменений). Вертикально: порожек сверху, лады вниз, басовая струна (индекс `stringCount - 1`) слева, подписи в точках не повёрнуты, номера ладов слева. `fretPositionRatio` годится для обеих ориентаций (доля вдоль грифа).

- [ ] **Step 1: Тесты Fretboard.**

```ts
test('a vertical neck puts the nut on top and the bass string on the left', () => {
  /* orientation="vertical", точки на (string 5, fret 1) и (string 0, fret 3):
     у первой cx меньше, у второй cy больше; линия .fretboard-nut горизонтальная (y1 === y2) */
});
test('a vertical neck keeps labels upright', () => { /* у <text> точки нет transform/rotate */ });
```

- [ ] **Step 2: FAIL → реализация → PASS.** Одна функция `point(string, fret) → { x, y }` и размеры холста по ориентации; линии, точки, связи, вставки, крестики, зоны нажатия строятся через неё.
- [ ] **Step 3: Раскладка плеера.** `const wide = useMediaQuery('(min-width: 1180px)')` (маленький хук на `matchMedia` с подпиской на `change`; порог можно сдвинуть, если табам рядом с колонкой не хватает трёх тактов в строке). На широком экране гриф — `<aside className="tabplayer-side">` слева от `.tabplayer-surface` (сетка `auto minmax(0, 1fr)`), `position: sticky`, `top` — под полосой хода, высота `calc(100dvh - …)`, вертикальное следование за `--focus` (как `.tabplayer-neck-pan`, но `translateY`). На узком — как сейчас, горизонтально в нижней панели.
- [ ] **Step 4: Перераскладка табов.** После скрытия или показа колонки (G) и при пересечении порога alphaTab должен перераскладывать такты; если сам он не замечает смены ширины контейнера — вызвать у него пересчёт размеров после смены раскладки.
- [ ] **Step 5: Проверка в браузере.** Ширина 1400 и 900: вертикальный и горизонтальный гриф; G прячет колонку, табы расширяются; ресайз через порог туда-обратно без ошибок в консоли; reduced motion — гриф без плавного сдвига.
- [ ] **Step 6: Коммит.** `git commit -m "Stand the neck upright beside the tab on wide screens"`.

---

### Task 6: Формы аккордов во вкладке «Аккорд»

**Files:**
- Create: `src/lib/theory/voicings.ts`, `src/lib/theory/voicings.test.ts`
- Modify: `src/lib/theory/index.ts`
- Modify: `src/components/Fretboard.tsx`, `src/components/Fretboard.test.tsx`
- Modify: `src/components/ChordExplorer.tsx`, `src/components/explorer.css`, тест инструмента (`src/components/Harmony.test.tsx` или новый `ChordExplorer.test.tsx` — где сейчас проверяется `ChordExplorer`)

**Interfaces:**
- Consumes: `orientation` и `mutedStrings` у `Fretboard` (Tasks 4–5).
- Produces:
  - `interface Voicing { frets: (number | null)[]; startFret: number }` — `frets[i]` для струны грифа `i` (0 — верхняя ми, как в `STANDARD_TUNING`), `null` — не играет; `startFret` — первый лад окна диаграммы (0 у открытых форм).
  - `chordVoicings(chord: BuiltChord, tuning?: readonly string[], limit = 4): Voicing[]`
  - `Fretboard` prop `startFret?: number` (по умолчанию 0): рисуются лады `startFret … startFret + fretCount`; при `startFret > 0` порожка нет, сбоку номер первого лада.

- [ ] **Step 1: Тесты `voicings.test.ts`.**

```ts
const shapes = (root: number, type: ChordTypeId) => chordVoicings(buildChord(root, type)).map((v) => v.frets);
test('the classic shapes are found', () => {
  expect(shapes(0, 'maj')).toContainEqual([0, 1, 0, 2, 3, null]);  // C  x32010
  expect(shapes(9, 'min')).toContainEqual([0, 1, 2, 2, 0, null]);  // Am x02210
  expect(shapes(5, 'maj')).toContainEqual([1, 1, 2, 3, 3, 1]);     // F  133211
  expect(shapes(7, '7')).toContainEqual([1, 0, 0, 0, 2, 3]);       // G7 320001
});
test('every shape is playable and is the chord', () => {
  /* для всех 12 тонов × CHORD_TYPES: у каждой формы самая низкая звучащая нота — основной тон;
     все звуки аккорда есть (у септаккордов квинта может отсутствовать); звучащие струны подряд;
     звучат ≥4 струны; прижатые лады в пределах 3; пальцев ≤4 (баррэ на нижнем ладу — один) */
});
test('major, minor and seventh chords on every root have at least two shapes', () => { /* maj, min, 7, m7, maj7 */ });
test('at most four shapes, ordered along the neck, the open one first', () => { /* длина ≤ 4; startFret не убывает */ });
```

- [ ] **Step 2: FAIL → реализация → PASS.** Перебор: для каждого окна из 4 ладов (`w` = 1…12, плюс открытые струны при `w = 1`) каждая струна — `null`, открытая (если её звук в аккорде) или лад окна со звуком аккорда; фильтр по правилам из теста; баррэ над открытой струной между его концами недопустим. Отбор: лучшая открытая форма, затем лучшая с основным тоном на 6-й, 5-й, 4-й струне; «лучшая» — больше звучащих струн, меньше пальцев, ниже на грифе. Итог — по `startFret`.
- [ ] **Step 3: `startFret` у Fretboard** — тест «окно с 5-го лада рисует номер 5 сбоку и не рисует порожек» → реализация.
- [ ] **Step 4: Ряд форм в инструменте.** Под большим грифом — `<ul className="chord-shapes" aria-label="Формы">`; на каждую форму — кнопка с вертикальной `Fretboard` (`orientation="vertical"`, `fretCount={4}`, `startFret`, `mutedStrings` из `null`, точки — тоны формы в цвете ступени, подписи по переключателю «ступени / ноты»). Нажатие: `playNotes(midi по возрастанию, STRUM)` и выбор формы — на большом грифе точки вне формы получают `dimmed: true`; повторное нажатие снимает выбор; смена тона или типа снимает выбор. Нет форм — ряда нет.
- [ ] **Step 5: Тест инструмента.** «Нажатие на форму гасит на грифе точки вне неё»: рендер `ChordExplorer`, клик по первой форме → у части `[data-dot]` появился `data-dimmed`, у звуков формы — нет; второй клик → `data-dimmed` нет ни у одной.
- [ ] **Step 6: Проверка в браузере.** `/theory/chords`, уроки `/lessons/chord-building/` и `/lessons/seventh-chords/`: формы видны, звучат, подсвечиваются; телефонная ширина — ряд переносится.
- [ ] **Step 7: Коммит.** `git commit -m "Add playable chord shapes to the chord tool"`.

---

### Завершение

- [ ] `npm test`, `npx tsc --noEmit -p .`, `npm run build`, `npm run check:links` — зелёные.
- [ ] Копия плана в `~/Documents/HarnessEngineering/documents/projects/ComputerScience/PetProjects/rum/superpowers/plans/`.
- [ ] Пуш и деплой — только по слову Актана.
