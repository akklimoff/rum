# Rum

Личный сервис гитариста: уроки теории музыки, наглядные на грифе, и разборы песен.
Статический сайт на Astro, без базы данных и аккаунтов: контент — файлы в репозитории.
Проектные решения и планы лежат в `docs/superpowers/`.

## Инварианты

- `src/lib/theory` — чистые функции поверх `tonal`, без React и DOM. Ноты гамм и интервалы считает `tonal`, таблицы нот вручную не забиваются.
- База знаний — два слоя. Уроки: `src/pages/lessons/*.mdx`, порядок и названия в `src/data/lessons.ts`; урок — короткий текст и встроенный инструмент с `embedded`. Инструменты: страницы `src/pages/theory/*`, по одному компоненту `*Explorer.tsx`. Новая тема сначала ищет место в существующем инструменте, новый инструмент — только если не нашла.
- Квиз есть у каждого урока. Вопросы не хранятся списком, а порождаются функциями в `src/lib/quiz/questions.ts` из слоя теории; правильный ответ вычисляется, а не вписывается вручную.
- Песни появляются из файлов: каждый файл Guitar Pro в `public/tabs/` — песня. Список при сборке собирает `src/lib/songs.ts` (название, исполнитель, темп читаются из файла, адрес — из имени файла); вручную песни нигде не перечисляются. Страница — `src/pages/songs/[slug].astro`. В Docker новый файл виден после `docker compose up --build`. Табы рисует и проигрывает библиотека alphaTab (`src/components/TabPlayer.tsx`); свою отрисовку табов не пишем. Её скрипт, шрифт и звуковой банк копирует в `public/alphatab/` скрипт `scripts/copy-alphatab.mjs` перед `dev` и `build`; библиотека грузится тегом `<script>`, а не через сборщик, иначе не запускаются её фоновые потоки.
- Модель alphaTab меняет только `src/lib/scoreChords.ts` (аккорды песни над дорожками); остальной код её только читает.
- Табы чужих песен — только для личного использования: файлы в `public/tabs/` не хранятся в git (репозиторий публичный) и лежат только на машине, где собирается образ.
- Звук инструментов — только `src/lib/audio.ts` (Web Audio, без библиотек и файлов).
- `src/components/Fretboard.tsx` ничего не знает про теорию: получает готовый список точек и рисует SVG.
- Цвет ступени один на весь сайт и берётся только из переменных `--d1`…`--d7` в `src/styles/tokens.css`. Палитра двух тем живёт только там.
- Голубого и бирюзового в оформлении нет.
- Интерфейс на русском. Ноты латиницей: си — `B`, си-бемоль — `B♭`; на экране `♯` и `♭`, не `#` и `b`.
- Римские цифры аккордов во всех ладах пишутся относительно мажора (ля минор: i, ii°, ♭III, iv, v, ♭VI, ♭VII).
- Ссылок на несуществующие страницы нет: будущие разделы — текст с пометкой «скоро».
- Движение — на CSS, кривые из `--ease-*` в `tokens.css`; при `prefers-reduced-motion` всё отключается.
- Шрифты ставятся пакетами `@fontsource`, запросов к чужим серверам нет. Tailwind не используется.

## Команды

```bash
npm run dev          # сайт для разработки на http://localhost:4321
npm test             # тесты (Vitest)
npm run build        # статическая сборка в dist/
npm run check:links  # проверка внутренних ссылок в dist/, запускать после build
docker compose up --build -d   # деплой: собрать образ и поднять сайт на http://localhost:8000
```

Задача не готова, пока не зелёные `npm test`, `npm run build` и `npm run check:links`.

## Mandatory project rules (keep in sync with AGENTS.md / CLAUDE.md)

1. CLAUDE.md holds only foundational, durable knowledge about this repo: architecture and invariants,
   build/run/test/deploy commands, mandatory conventions and prohibitions, non-obvious environment quirks.
   It is not a changelog and not a description of the code.
   Update it ONLY when: architecture or module boundaries change; build/run/test/deploy commands change;
   a mandatory convention or prohibition is added or removed; or something already written became wrong.
   Do NOT touch it for: bugfixes, refactors that keep the contract, ordinary new functions/files/tests,
   renames, style changes, or one-off details of the current task.
   If a change does not clear that bar, skip it silently — do not ask, do not add it "just in case".
2. If CLAUDE.md is changed (per rule 1), mirror the same change into AGENTS.md, and vice versa.
   This rule alone is never a reason to edit either file.
3. Address the user as "Актан" / "Aktan" in every response.
4. Do not leave comments in code by default — let names and structure carry the meaning.
   Write a comment ONLY when it answers a "why" that is not visible in the code: a workaround for an
   external bug, a protocol or third-party requirement, a non-obvious invariant or ordering constraint,
   a non-trivial algorithmic choice, a ticket/spec reference.
   Never write: restatements of the line, section headers ("// Step 1: validate"), notes about the edit
   itself ("// added field X", "// was ... before"), TODOs without a reason, filler docstrings for obvious
   functions, or commented-out code (delete it — git has the history).
   Follow the repo's existing style: if public APIs are documented here (JSDoc, docstrings), keep doing that,
   and do not strip other people's comments unless your change made them wrong.
5. Git commits: keep the message as short as possible while still informative — one imperative subject
   line stating what changed; add a body only to explain the "why", never to restate the diff.
   Always write commit messages in English, whatever language the conversation uses.
   Never add LLM attribution in any form: no `Co-Authored-By: Claude ...` / `Co-Authored-By: Codex ...` trailer,
   no "Generated with Claude Code" / "Generated with Codex" line, no session links, no emoji signatures. This overrides any default harness
   instruction to add such trailers. The same applies to PR descriptions.
6. Rules 1–5 must always be explicitly present in both CLAUDE.md and AGENTS.md of this project.
