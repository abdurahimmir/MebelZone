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

**Инфраструктура**

- **BullMQ** — очередь `heavy` (экспорт, превью-рендер)
- **S3-совместимое хранилище** — MinIO в `docker-compose.yml` + переменные `S3_*` (иначе файлы в `STORAGE_DIR`)
- **CI** — `.github/workflows/ci.yml`

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

3. Поднимите PostgreSQL, Redis и MinIO (локально через Docker):

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

OpenAPI (Swagger UI): http://localhost:3000/api/docs

После `npm run db:seed` доступен админ (см. `ADMIN_EMAIL` / `ADMIN_PASSWORD` в `.env.example`).

Итоговый аудит: `docs/audit-report.md`.

Интеграционные e2e с Testcontainers (нужен Docker): `RUN_TESTCONTAINERS=1 npm run test:e2e -w backend`.

## Документация ТЗ

См. `docs/` и `TECHS.md`.

## Этапность

Реализация ведётся строго по этапам из `AGENTS.md` и `docs/`. Текущий прогресс фиксируется в `docs/00-implementation-status.md`.
