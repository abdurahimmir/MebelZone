# Статус внедрения (агентный трекер)

## Этап 1 — Подготовка проекта

**Статус:** выполнено

**Результат**

- Монорепозиторий (npm workspaces): `apps/backend`, `apps/frontend`, `apps/admin`, `packages/shared`
- Backend: NestJS, глобальный префикс `/api`, валидация env (Joi), `GET /api/health`
- Frontend: Vue 3 + TypeScript + Pinia + Vue Router + Three.js (демо-сцена)
- Admin: Vue 3 + TypeScript + Pinia + Vue Router (каркас)
- Env-шаблоны: корень `.env.example`, `apps/frontend/.env.example`, `apps/admin/.env.example`

**Проверка**

```bash
npm install
npm run lint -w backend
npm run test -w backend
npm run test:e2e -w backend
npm run build -w backend
npm run build -w frontend
npm run build -w admin
```

---

## Этап 2 — БД и инфраструктура

**Статус:** выполнено

**Результат**

- Prisma: схема PostgreSQL по сущностям из `TECHS.md` (раздел «Основные сущности»), начальная SQL-миграция `prisma/migrations/20260416190000_init`
- Seed: `prisma/seed.cjs` (системные настройки входа, тариф `free`, базовые материалы и фурнитура)
- Docker Compose: `docker-compose.yml` (PostgreSQL 16 + Redis 7)
- Backend: `PrismaModule` / `PrismaService`, `RedisModule` (ioredis), расширенный `GET /api/health` с полем `dependencies`
- Скрипты: `npm run docker:up`, `npm run db:migrate`, `npm run db:seed`, `prisma generate` на `postinstall` workspace `backend`

**Не входит в Этап 2**

- BullMQ / очереди задач (подключаются при появлении воркеров и сценариев)
- Объектное хранилище файлов (рендеры, превью) — отдельный слой позже

**Проверка**

```bash
npm install
npm run docker:up
npm run db:migrate
npm run db:seed
npm run lint -w backend
npm run test -w backend
npm run test:e2e -w backend
npm run build -w backend
```
