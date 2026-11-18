# Rum: главная страница и интерактивный гриф — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** статический сайт Rum с главной страницей и страницей интерактивного грифа: выбор тоники и лада, ноты на грифе по ступеням, аккорды тональности.

**Architecture:** Astro собирает статические страницы; интерактив — один React-островок `FretboardExplorer`. Теория живёт в `src/lib/theory` как чистые функции поверх `tonal` и ничего не знает про экран; `Fretboard` рисует SVG по готовому списку точек и ничего не знает про теорию.

**Tech Stack:** Astro (последняя стабильная), React, MDX, TypeScript strict, `tonal`, обычный CSS с переменными, Vitest + jsdom + Testing Library, Node 26, npm.

**Spec:** `docs/superpowers/specs/2026-11-18-home-and-fretboard-design.md`

## Global Constraints

- Git отложен: репозиторий не создаём, шагов с коммитами нет. Каждая задача заканчивается проверкой командой.
- Интерфейс на русском. Ноты латиницей: си — `B`, си-бемоль — `B♭`. На экране знаки `♯` и `♭`, не `#` и `b`.
- Цвет ступени один на весь сайт и берётся только из переменных `--d1`…`--d7` в `src/styles/tokens.css`. Значения палитры копируются из таблицы «Палитра» в спеке без изменений.
- Голубого и бирюзового нет.
- Теория не забивается таблицами нот: ноты гамм и интервалы считает `tonal`.
- Ссылок на несуществующие страницы нет; будущие разделы — текст с пометкой «скоро».
- Шрифты Manrope и JetBrains Mono ставятся пакетами `@fontsource-variable/manrope` и `@fontsource/jetbrains-mono`; запросов к чужим серверам нет.
- Без Tailwind.
- Комментарии в коде только про неочевидное «почему».
- Готово, когда зелёные `npm test`, `npm run build`, `npm run check:links`.

## Review Focus

1. Мусор в адресе (`?key=H&scale=foo&labels=x`): страница открывается с до мажором и подписями-ступенями, без ошибки. Тест в задаче 4.
2. Энгармоническая запись в адресе (`?key=A%23&scale=major`): показывается си-бемоль мажор, `B♭`, а не `A♯`. Тест в задаче 4.
3. Смена лада при выбранном аккорде, особенно на пентатонику: выделение снимается, гриф не остаётся приглушённым, таблица аккордов исчезает. Тест в задаче 5.
4. Смена лада меняет написание тоники: ре-бемоль мажор → минор показывает `C♯`, кнопка тоники остаётся выбранной. Тесты в задачах 2 и 5.
5. Хранилище браузера недоступно (приватное окно): переключатель темы работает в пределах страницы, ошибок в консоли нет. Проверка в задаче 1.

## Файлы

```
rum/
  package.json, astro.config.mjs, tsconfig.json, vitest.config.ts
  CLAUDE.md, AGENTS.md
  scripts/check-links.mjs          проверка внутренних ссылок в dist/
  src/
    styles/tokens.css              палитра двух тем, шрифты, скругления
    styles/base.css                сброс, типографика, шапка
    layouts/Base.astro             шапка-капсула, переключатель темы
    lib/theory/notes.ts            написание и русские названия нот
    lib/theory/scales.ts           лады, ноты гаммы со ступенями
    lib/theory/chords.ts           аккорды тональности
    lib/theory/fretboard.ts        позиции нот на грифе
    lib/theory/index.ts            реэкспорт
    lib/explorerState.ts           состояние грифа ↔ строка адреса
    components/Fretboard.tsx       SVG по списку точек
    components/FretboardExplorer.tsx  островок
    components/explorer.css        стили островка и грифа
    pages/index.astro              главная
    pages/theory/fretboard.astro   гриф
  tests/ — рядом с кодом: `*.test.ts(x)` в тех же папках
```

---

### Task 1: Каркас проекта, темы, шапка

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `CLAUDE.md`, `AGENTS.md`, `scripts/check-links.mjs`, `src/styles/tokens.css`, `src/styles/base.css`, `src/layouts/Base.astro`, `src/pages/index.astro` (временная: только заголовок «Rum»)

**Interfaces:**
- Produces: `Base.astro` с пропсами `{ title: string; current?: 'fretboard' }` и слотом; CSS-переменные `--bg --panel --raise --line --fg --muted --accent --accent-ink --on-accent --glow --string --fret --dot-ink --d1…--d7 --font-ui --font-mono`; npm-скрипты `dev`, `build`, `test`, `check:links`.

- [ ] **Step 1:** Создать проект Astro в существующей папке `rum/` (в ней уже лежит `docs/`, его не трогать): минимальный шаблон, TypeScript strict, интеграции `@astrojs/react` и `@astrojs/mdx`, зависимости `tonal`, `@fontsource-variable/manrope`, `@fontsource/jetbrains-mono`; dev-зависимости `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`. `output: 'static'`.
- [ ] **Step 2:** `vitest.config.ts` через `getViteConfig` из `astro/config`, окружение `jsdom`, тесты `src/**/*.test.{ts,tsx}`. Скрипт `"test": "vitest run"`.
- [ ] **Step 3:** `src/styles/tokens.css`. Светлые значения на `:root`; тёмные — в `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` и повторно в `:root[data-theme="dark"]`, с `color-scheme`. Соответствие «роль из таблицы спеки → переменная»: Фон `--bg`, Панель `--panel`, Выбранное `--raise`, Линии `--line`, Текст `--fg`, Вторичный текст `--muted`, Акцент заливка `--accent`, Акцент текст `--accent-ink`, Текст на акценте `--on-accent`, Отсвет фона `--glow`, Струны `--string`, Лады `--fret`, Подпись на точке `--dot-ink`, Ступень N `--dN`. `--font-ui: "Manrope Variable", system-ui, sans-serif`; `--font-mono: "JetBrains Mono", ui-monospace, monospace`.
- [ ] **Step 4:** `src/styles/base.css`: фон `radial-gradient(90% 60% at 20% 0%, var(--glow) 0%, var(--bg) 60%)` на `body`, колонка контента `max-width: 1040px`, боковой отступ не меньше 16px, страница не прокручивается по горизонтали.
- [ ] **Step 5:** `Base.astro`. Шапка-капсула: `rum.` (точка цветом `--accent-ink`) — ссылка на `/`; «Гриф» — ссылка на `/theory/fretboard`, при `current === 'fretboard'` с `aria-current="page"`; «Статьи» и «Песни» — `<span>` с пометкой «скоро», не ссылки; справа кнопка темы с `aria-label="Сменить тему"`. В `<head>` инлайн-скрипт ставит `data-theme` из `localStorage['rum-theme']` до отрисовки. Кнопка переключает `data-theme` между `dark` и `light` (от текущей действующей темы) и пишет в `localStorage`. Все обращения к `localStorage` в `try/catch`.
- [ ] **Step 6:** `scripts/check-links.mjs`: обходит `dist/**/*.html`, собирает `href`, начинающиеся с `/`, отбрасывает строку запроса и якорь, проверяет, что в `dist` есть соответствующий файл или `index.html` в папке; печатает битые ссылки и выходит с кодом 1, иначе `links ok`. Скрипт `"check:links": "node scripts/check-links.mjs"`.
- [ ] **Step 7:** `CLAUDE.md`: назначение проекта в двух фразах, граница `lib/theory` ↔ `Fretboard` из спеки, правило про цвета ступеней, команды `npm run dev | build | test | check:links`, и блок «Mandatory project rules» из глобальных правил Актана дословно. `AGENTS.md` — то же содержимое.
- [ ] **Step 8: Проверка.** `npm run build && npm run check:links` → сборка без ошибок, `links ok` (ссылка на `/theory/fretboard` пока битая — на время этой задачи «Гриф» в шапке оставить `<span>`, ссылкой он становится в задаче 5). `npm run dev`, открыть в приватном окне: тема переключается, в консоли нет ошибок.

---

### Task 2: Ноты и лады

**Files:**
- Create: `src/lib/theory/notes.ts`, `src/lib/theory/scales.ts`, `src/lib/theory/index.ts`
- Test: `src/lib/theory/scales.test.ts`

**Interfaces:**
- Produces:

```ts
export type ScaleId = 'major' | 'minor' | 'major-pentatonic' | 'minor-pentatonic' | 'blues'
  | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'locrian';
export type DegreeNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export interface ScaleInfo { id: ScaleId; label: string; primary: boolean; minorLike: boolean }
export const SCALES: readonly ScaleInfo[];
export interface ScaleNote { note: string; pc: number; degree: string; degreeNumber: DegreeNumber }

export function tonicName(tonicPc: number, scale: ScaleId): string;   // ASCII: 'Db', 'C#'
export function formatNote(ascii: string): string;                    // 'Bb' → 'B♭', 'F#' → 'F♯'
export function parseNote(input: string): number | null;              // 'Bb' | 'B♭' | 'a#' → pc, иначе null
export function keyTitle(tonicPc: number, scale: ScaleId): string;    // 'До мажор'
export function scaleNotes(tonicPc: number, scale: ScaleId): ScaleNote[];
```

- `ScaleNote.note` — уже в экранном виде (`'B♭'`). `pc` — 0…11, C = 0.

- [ ] **Step 1: Написать падающие тесты** в `scales.test.ts`:

```ts
const names = (pc: number, s: ScaleId) => scaleNotes(pc, s).map(n => n.note);
const degrees = (pc: number, s: ScaleId) => scaleNotes(pc, s).map(n => n.degree);

expect(names(0, 'major')).toEqual(['C','D','E','F','G','A','B']);
expect(degrees(0, 'major')).toEqual(['1','2','3','4','5','6','7']);
expect(names(9, 'minor')).toEqual(['A','B','C','D','E','F','G']);
expect(degrees(9, 'minor')).toEqual(['1','2','♭3','4','5','♭6','♭7']);
expect(names(5, 'major')).toEqual(['F','G','A','B♭','C','D','E']);
expect(names(4, 'minor-pentatonic')).toEqual(['E','G','A','B','D']);
expect(degrees(4, 'minor-pentatonic')).toEqual(['1','♭3','4','5','♭7']);
expect(scaleNotes(0, 'mixolydian')[6]).toEqual({ note: 'B♭', pc: 10, degree: '♭7', degreeNumber: 7 });
expect(degrees(4, 'phrygian')[1]).toBe('♭2');
expect(degrees(5, 'lydian')[3]).toBe('♯4');
expect(degrees(9, 'blues')).toEqual(['1','♭3','4','♭5','5','♭7']);
expect(scaleNotes(9, 'blues').map(n => n.degreeNumber)).toEqual([1,3,4,5,5,7]);

expect(tonicName(1, 'major')).toBe('Db');
expect(tonicName(1, 'minor')).toBe('C#');
expect(tonicName(8, 'major')).toBe('Ab');
expect(tonicName(8, 'minor')).toBe('G#');
expect(formatNote('Bb')).toBe('B♭');
expect(parseNote('B♭')).toBe(10);
expect(parseNote('a#')).toBe(10);
expect(parseNote('H')).toBeNull();
expect(keyTitle(0, 'major')).toBe('До мажор');
expect(keyTitle(10, 'major')).toBe('Си-бемоль мажор');
expect(keyTitle(1, 'minor')).toBe('До-диез минор');
expect(SCALES.filter(s => s.primary).map(s => s.id))
  .toEqual(['major','minor','major-pentatonic','minor-pentatonic','blues','mixolydian']);
```

- [ ] **Step 2:** `npm test` → тесты падают: модуль не найден.
- [ ] **Step 3: Реализовать.**
  - `SCALES` в порядке: major «мажор», minor «минор», major-pentatonic «мажорная пентатоника», minor-pentatonic «минорная пентатоника», blues «блюзовый», mixolydian «миксолидийский», dorian «дорийский», phrygian «фригийский», lydian «лидийский», locrian «локрийский». `primary` — первые шесть. `minorLike`: minor, minor-pentatonic, blues, dorian, phrygian, locrian.
  - Имена ладов в `tonal`: `major`, `minor`, `major pentatonic`, `minor pentatonic`, `minor blues`, `dorian`, `phrygian`, `lydian`, `mixolydian`, `locrian`.
  - `tonicName`: для не-`minorLike` — `C Db D Eb E F F# G Ab A Bb B`; для `minorLike` — `C C# D Eb E F F# G G# A Bb B`.
  - Ступень из интервала `tonal` (`Scale.get(...).intervals`): номер — число интервала; для 1, 4, 5: `P` → без знака, `d` → `♭`, `A` → `♯`; для 2, 3, 6, 7: `M` → без знака, `m` → `♭`, `A` → `♯`.
  - `keyTitle`: русское название ноты с заглавной (до, ре, ми, фа, соль, ля, си; `-диез`, `-бемоль`) + пробел + `label` лада.
- [ ] **Step 4:** `npm test` → зелёный.

---

### Task 3: Аккорды тональности и позиции на грифе

**Files:**
- Create: `src/lib/theory/chords.ts`, `src/lib/theory/fretboard.ts`; дополнить `src/lib/theory/index.ts`
- Test: `src/lib/theory/chords.test.ts`, `src/lib/theory/fretboard.test.ts`

**Interfaces:**
- Consumes: `scaleNotes`, `ScaleNote`, `ScaleId` из задачи 2.
- Produces:

```ts
export interface DiatonicChord { symbol: string; roman: string; notes: string[]; pcs: number[] }
export function diatonicChords(tonicPc: number, scale: ScaleId): DiatonicChord[];

export const STANDARD_TUNING: readonly string[];  // ['E4','B3','G3','D3','A2','E2'] — струна 0 первая, тонкая
export const FRET_COUNT = 15;
export interface FretPosition { string: number; fret: number; note: ScaleNote }
export function fretboardPositions(notes: ScaleNote[], tuning?: readonly string[], frets?: number): FretPosition[];
```

- [ ] **Step 1: Написать падающие тесты.**

```ts
// chords.test.ts
expect(diatonicChords(0, 'major').map(c => c.symbol)).toEqual(['C','Dm','Em','F','G','Am','Bdim']);
expect(diatonicChords(0, 'major').map(c => c.roman)).toEqual(['I','ii','iii','IV','V','vi','vii°']);
expect(diatonicChords(9, 'minor').map(c => c.roman)).toEqual(['i','ii°','♭III','iv','v','♭VI','♭VII']);
expect(diatonicChords(0, 'mixolydian')[6]).toEqual({ symbol: 'B♭', roman: '♭VII', notes: ['B♭','D','F'], pcs: [10, 2, 5] });
expect(diatonicChords(5, 'lydian')[3].roman).toBe('♯iv°');
expect(diatonicChords(4, 'minor-pentatonic')).toEqual([]);
expect(diatonicChords(9, 'blues')).toEqual([]);

// fretboard.test.ts
const cOnly = scaleNotes(0, 'major').filter(n => n.note === 'C');
expect(fretboardPositions(cOnly).map(p => [p.string, p.fret]))
  .toEqual([[0,8],[1,1],[1,13],[2,5],[3,10],[4,3],[4,15],[5,8]]);
expect(fretboardPositions(scaleNotes(0, 'major')).filter(p => p.fret === 0).map(p => p.note.note))
  .toEqual(['E','B','G','D','A','E']);
expect(fretboardPositions(cOnly, STANDARD_TUNING, 12)).toHaveLength(6);
```

- [ ] **Step 2:** `npm test` → новые тесты падают.
- [ ] **Step 3: Реализовать.**
  - `diatonicChords`: для ладов не из семи нот — `[]`. Иначе трезвучие на каждой ступени из нот гаммы `i`, `i+2`, `i+4`. Качество по полутонам от основного тона: (4, 7) мажор — символ без суффикса, цифра заглавная; (3, 7) минор — `m`, строчная; (3, 6) уменьшённое — `dim`, строчная и `°`; (4, 8) увеличенное — `aug`, заглавная и `+`. Знак перед римской цифрой — знак из `degree` основного тона.
  - `fretboardPositions`: порядок результата — по струнам от 0, внутри струны по ладам; лады от 0 до `frets` включительно.
- [ ] **Step 4:** `npm test` → зелёный.

---

### Task 4: Состояние грифа в адресе

**Files:**
- Create: `src/lib/explorerState.ts`
- Test: `src/lib/explorerState.test.ts`

**Interfaces:**
- Consumes: `ScaleId`, `SCALES`, `parseNote`, `tonicName` из задачи 2.
- Produces:

```ts
export type LabelMode = 'degrees' | 'notes';
export interface ExplorerState { tonicPc: number; scale: ScaleId; labels: LabelMode }
export const DEFAULT_STATE: ExplorerState;          // { tonicPc: 0, scale: 'major', labels: 'degrees' }
export function parseState(search: string): ExplorerState;
export function serializeState(state: ExplorerState): string;
```

- [ ] **Step 1: Написать падающие тесты.**

```ts
expect(parseState('')).toEqual(DEFAULT_STATE);
expect(parseState('?key=Bb&scale=mixolydian&labels=notes')).toEqual({ tonicPc: 10, scale: 'mixolydian', labels: 'notes' });
expect(parseState('?key=A%23&scale=major').tonicPc).toBe(10);
expect(parseState('?key=H&scale=foo&labels=x')).toEqual(DEFAULT_STATE);
expect(parseState('?key=G&scale=foo')).toEqual({ tonicPc: 7, scale: 'major', labels: 'degrees' });
expect(serializeState(DEFAULT_STATE)).toBe('?key=C&scale=major');
expect(serializeState({ tonicPc: 1, scale: 'minor', labels: 'notes' })).toBe('?key=C%23&scale=minor&labels=notes');
expect(parseState(serializeState({ tonicPc: 6, scale: 'lydian', labels: 'notes' })))
  .toEqual({ tonicPc: 6, scale: 'lydian', labels: 'notes' });
```

- [ ] **Step 2:** `npm test` → падают.
- [ ] **Step 3: Реализовать.** Каждое поле разбирается отдельно; неизвестное значение поля заменяется значением из `DEFAULT_STATE`, остальные поля сохраняются. `key` в адресе — `tonicName(tonicPc, scale)`. `labels` пишется в адрес, только если не `degrees`.
- [ ] **Step 4:** `npm test` → зелёный.

---

### Task 5: Гриф, островок и страница

**Files:**
- Create: `src/components/Fretboard.tsx`, `src/components/FretboardExplorer.tsx`, `src/components/explorer.css`, `src/pages/theory/fretboard.astro`
- Modify: `src/layouts/Base.astro` — «Гриф» становится ссылкой на `/theory/fretboard`
- Test: `src/components/Fretboard.test.tsx`, `src/components/FretboardExplorer.test.tsx`

**Interfaces:**
- Consumes: всё из задач 2–4; `Base.astro` из задачи 1.
- Produces:

```ts
export interface FretboardDot {
  string: number; fret: number; label: string;
  degreeNumber: DegreeNumber; isTonic: boolean; dimmed: boolean; description: string;
}
export function Fretboard(props: { dots: FretboardDot[]; stringCount: number; fretCount: number; ariaLabel: string }): JSX.Element;
export function FretboardExplorer(): JSX.Element;
```

- [ ] **Step 1: Написать падающие тесты `Fretboard.test.tsx`.**
  - Три точки на входе → три элемента `[data-dot]`.
  - У точки с `degreeNumber: 5` есть `data-degree="5"`; у точки с `isTonic` — `data-tonic`; у точки с `dimmed` — `data-dimmed`.
  - `description` попадает в `<title>` точки; `ariaLabel` — в `aria-label` у `svg` с `role="img"`.
  - При `fretCount: 15` подписаны номера ладов от 0 до 15.

- [ ] **Step 2: Написать падающие тесты `FretboardExplorer.test.tsx`** (перед каждым тестом `history.replaceState(null, '', '/theory/fretboard')`):
  - По умолчанию: заголовок «До мажор»; карточки аккордов `C Dm Em F G Am Bdim`; у кнопки тоники `C` `aria-pressed="true"`.
  - Клик по тонике `A`, затем по ладу «минор»: заголовок «Ля минор», римские цифры `i ii° ♭III iv v ♭VI ♭VII`, адрес `?key=A&scale=minor`.
  - Открытие с `?key=A%23&scale=major`: заголовок «Си-бемоль мажор», в строке нот гаммы первая нота `B♭`.
  - Открытие с `?key=H&scale=foo&labels=x`: заголовок «До мажор».
  - Клик по карточке `G`: у неё `aria-pressed="true"`; не приглушены только точки с `data-degree` 5, 7, 2. Повторный клик: приглушённых точек нет.
  - Выбран аккорд `G`, затем клик по ладу «минорная пентатоника»: карточек аккордов нет, приглушённых точек нет.
  - Тоника `D♭` в мажоре, затем лад «минор»: выбранная кнопка тоники подписана `C♯`, заголовок «До-диез минор».
  - Переключатель «ноты»: подпись точки тоники в до мажоре — `C`; адрес получает `labels=notes`.
  - Клик «ещё» раскрывает дорийский, фригийский, лидийский, локрийский; выбор «дорийский» отмечает его.

- [ ] **Step 3:** `npm test` → новые тесты падают.

- [ ] **Step 4: Реализовать `Fretboard`.** SVG с `viewBox`, струна 0 сверху, 5 снизу; порожек толще ладов; метки на ладах 3, 5, 7, 9, 15 одинарные и на 12 двойная; номера ладов снизу моноширинным шрифтом; точка открытой струны левее порожка. Точка — круг цвета `var(--dN)` и подпись цвета `var(--dot-ink)`; тоника крупнее. Все цвета — через переменные.

- [ ] **Step 5: Реализовать `FretboardExplorer`.**
  - Состояние: `ExplorerState` плюс индекс выбранного аккорда (`number | null`, в адрес не пишется).
  - Первый рендер — `DEFAULT_STATE`; в эффекте при монтировании состояние читается из `location.search`. Изменение состояния — `history.replaceState` с `serializeState`.
  - Смена тоники или лада сбрасывает выбранный аккорд.
  - Разметка сверху вниз: заголовок `keyTitle` и строка нот гаммы (тоника цветом `--accent-ink`); ряд из 12 кнопок тоники с подписями `formatNote(tonicName(pc, scale))`; ряд кнопок ладов с `primary` и кнопка «ещё», раскрывающая остальные (если выбран не-`primary` лад, ряд раскрыт); переключатель «ступени / ноты»; гриф в контейнере с `overflow-x: auto`; карточки аккордов (символ и римская цифра), если `diatonicChords` не пуст.
  - Кнопки выбора — `<button aria-pressed>`.
  - `description` точки: `Струна {string+1}, лад {fret}: {note}, ступень {degree}`. `ariaLabel` грифа: `Гриф: {keyTitle}, подписи — {ступени|ноты}`.
- [ ] **Step 6:** `explorer.css` по спеке: кнопки-капсулы, выбранная — заливка `--accent` и текст `--on-accent`; панель грифа и карточки аккордов со скруглением 14–18px; приглушённая точка `opacity: .16`; свечение тоники `drop-shadow` только в тёмной теме; видимый фокус с клавиатуры; `prefers-reduced-motion` отключает переходы.
- [ ] **Step 7:** `fretboard.astro`: `Base` с `title="Гриф — Rum"` и `current="fretboard"`, внутри `<FretboardExplorer client:load />`.
- [ ] **Step 8: Проверка.** `npm test` зелёный; `npm run build && npm run check:links` → `links ok`. В `npm run dev` на ширине 400px страница не прокручивается вбок, гриф прокручивается внутри своей панели; обе темы читаемы.

---

### Task 6: Главная страница

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `Base.astro`.

- [ ] **Step 1: Сверстать.**
  - Заголовок `Rum` и текст: «Разборы песен с точки зрения теории музыки и база знаний, наглядная на грифе.»
  - Блок «База знаний»: ссылка «Интерактивный гриф» на `/theory/fretboard` с подписью «Тональности и лады на грифе, аккорды по ступеням»; под ней список с пометкой «скоро», без ссылок: «Ступени и аккорды тональности», «Каденции», «Лады», «Заимствованные аккорды», «Обращения».
  - Блок «Песни»: «скоро», текст «Первым будет разбор Let It Be.» Без ссылки.
- [ ] **Step 2: Проверка.** `npm test && npm run build && npm run check:links` → всё зелёное, `links ok`. В `dist/index.html` ровно две внутренние ссылки-назначения: `/` и `/theory/fretboard`.
- [ ] **Step 3:** Пройти раздел «Готово, когда» из спеки по пунктам в браузере в обеих темах.

---

### Task 7: Docker

Добавлена 2026-11-18 по решению Актана «давай в докер».

**Files:**
- Create: `Dockerfile`, `nginx.conf`, `compose.yaml`, `.dockerignore`

- [ ] **Step 1:** `Dockerfile` в два этапа: `node:26-alpine` выполняет `npm ci` и `npm run build`; `nginx` раздаёт `dist/`.
- [ ] **Step 2:** `nginx.conf`: `try_files $uri $uri/index.html =404` (адреса без завершающей косой черты отдаются без перенаправления, иначе nginx теряет порт 8080), долгий кеш для `/_astro/`.
- [ ] **Step 3:** `compose.yaml`: сервис `rum`, порт `8080:80`.
- [ ] **Step 4: Проверка.** `docker compose up --build -d`; `/` и `/theory/fretboard` отвечают 200, несуществующий адрес — 404.
