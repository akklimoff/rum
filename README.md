# Rum

Личный сервис гитариста: уроки теории музыки на грифе и песни с табулатурами.
Статический сайт на Astro, без базы данных.

## Деплой

```bash
docker compose up --build -d
```

Сайт поднимется на http://localhost:8000.

## Песни

Каждый файл Guitar Pro (`.gp`, `.gpx`, `.gp5`, `.gp4`, `.gp3`) в `public/tabs/` становится песней.
Файлы табулатур в репозитории не хранятся: положи свои в эту папку и пересобери образ той же командой.

## Разработка

```bash
npm install
npm run dev          # http://localhost:4321
npm test
npm run build && npm run check:links
```
