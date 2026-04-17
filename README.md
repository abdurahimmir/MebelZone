# Furniture Web Constructor

Веб-сервис для проектирования корпусной мебели в браузере.

## Стек (фиксированный)

**Backend**

- NestJS
- PostgreSQL
- Prisma ORM + SQL-миграции (`apps/backend/prisma`)
- Redis (кеш/сессии; ioredis в backend)

**Frontend**

- Vue 3
- TypeScript
- Pinia
- Vue Router
- Three.js

**Admin**

- Vue 3 (отдельное SPA)

**Инфраструктура (по ТЗ)**

- BullMQ (очереди — последующие этапы)
- S3-совместимое или файловое хранилище (последующие этапы)

## Архитектура репозитория

Монорепозиторий на npm workspaces:

- `apps/backend` — HTTP API (`/api/...`), бизнес-логика, интеграции
- `apps/frontend` — клиентский редактор (fullscreen-first по ТЗ)
- `apps/admin` — отдельная админ-панель
- `packages/shared` — общие константы/типы (расширяется по мере необходимости)

Связь клиентов с API: переменная `VITE_API_BASE_URL` в Vite-приложениях.

## Быстрый старт

1. Скопируйте переменные окружения:

```bash
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env
cp apps/admin/.env.example apps/admin/.env
```

2. Установите зависимости (в корне):

```bash
npm install
```

3. Поднимите PostgreSQL и Redis (локально через Docker):

```bash
npm run docker:up
```

4. Примените миграции и сиды:

```bash
npm run db:migrate
npm run db:seed
```

5. Запуск в режиме разработки:

```bash
npm run dev:backend   # http://localhost:3000/api/health
npm run dev:frontend # http://localhost:5173
npm run dev:admin    # http://localhost:5174
```

`GET /api/health` возвращает также статус зависимостей `database` и `redis` (`ok` / `unavailable` / `not_configured`).

## Документация ТЗ

См. `docs/` и `TECHS.md`.

## Этапность

Реализация ведётся строго по этапам из `AGENTS.md` и `docs/`. Текущий прогресс фиксируется в `docs/00-implementation-status.md`.
