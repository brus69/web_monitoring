# WebMon

Мониторинг изменений на сайтах: Go backend + React frontend.

Проект поддерживает:
- CLI-режим (проверка URL из файла в цикле),
- API-режим + web-интерфейс (проекты, результаты, графики, запуск/остановка проектов).

---

## Что умеет

- Парсинг входных файлов: `.txt`, `.csv`, `sitemap.xml`.
- Мониторинг полей страницы:
  - `title` (`<title>`),
  - `description` (meta/og/twitter),
  - `h1`,
  - текст контента.
- Сохранение истории изменений (дифф + метаданные).
- Отчёт по страницам: URL, HTTP-код, статус, title/description/h1, дата проверки.
- Кабинет с проектами, таблицей результатов и графиком динамики изменений.
- Управление проектом: **запустить / остановить** (через API и кнопку в UI).

---

## Требования

- Go `1.22+`
- Node.js `18+` (для фронтенда)

---

## Сборка

### Backend
```bash
go build -o webmon .
```

### Frontend
```bash
cd frontend
npm install
npm run build
```

---

## Запуск

### 1) CLI-режим
```bash
./webmon --file urls.txt --interval 14400 --concurrency 10
```

Флаги:
- `--file` — файл URL (`.txt`, `.csv`, `.xml`)
- `--interval` — интервал в секундах (по умолчанию `14400`)
- `--concurrency` — параллелизм (по умолчанию `10`)
- `--state` — путь к state-файлу (по умолчанию `state.json`)

### 2) API + frontend
```bash
./webmon --mode server
```

Сервер слушает `:8080`:
- API: `/api/...`
- статика фронтенда: `frontend/build`

Для dev-фронтенда (CRA):
```bash
cd frontend
npm start
```
В `frontend/package.json` настроен proxy на `http://localhost:8080`.

---

## Данные проекта

Проекты и результаты хранятся в `projects.json`.

Ключевые поля проекта:
- `id`
- `name`
- `urls`
- `interval` (минуты)
- `concurrency`
- `paused` (`false` = запущен, `true` = остановлен)
- `created_at`, `updated_at`

Ключевые поля результата страницы:
- `url`
- `status_code`
- `status` (`новая`, `изменена`, `без изменений`)
- `title`, `description`, `h1`
- `last_checked`
- `changes[]` (история изменений)

---

## API (основные эндпоинты)

Все эндпоинты, кроме `/api/login`, требуют `Authorization: Bearer <token>`.

- `POST /api/login`
- `GET /api/projects`
- `POST /api/projects/create`
- `PUT /api/projects/{id}`
- `DELETE /api/projects/{id}`
- `POST /api/projects/{id}/start` — запустить проект
- `POST /api/projects/{id}/stop` — остановить проект
- `GET /api/projects/{id}/results`
- `POST /api/parse-sitemap`

---

## Архитектура (backend)

- `main.go` — входная точка, флаги, запуск режимов.
- `checker.go` — цикл проверки URL и обновление состояния страниц.
- `fetcher.go` — HTTP-клиент (таймаут, заголовки, ограничения тела).
- `html_parser.go` — извлечение `title/description/h1/text`.
- `api.go` — REST API, авторизация, управление мониторингом проектов.
- `storage.go` — загрузка/сохранение `state.json` и `projects.json`.
- `types.go` — модели данных.

---

## Проверка перед релизом

Backend:
```bash
go test -count=1 .
go build -o webmon .
```

Frontend:
```bash
cd frontend
npm run build
```

---

## Лицензия

MIT
