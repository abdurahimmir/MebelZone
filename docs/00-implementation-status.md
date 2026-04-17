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

---

## Этап 3 — Авторизация

**Статус:** выполнено (MVP)

- JWT access + refresh (refresh в Redis), bcrypt для пароля
- Email / phone / Google (`id_token`), feature flags в `system_settings`
- Эндпоинты: `POST /api/auth/register/email`, `login/email`, `register/phone`, `login/phone`, `google`, `refresh`, `logout`, `GET /api/auth/me`
- Throttler на auth, `JwtAuthGuard`, `AdminRoleGuard`

---

## Этап 4 — Клиенты и проекты

**Статус:** выполнено (MVP)

- CRUD `/api/clients`, `GET /api/clients/:id/projects`
- CRUD `/api/projects`, duplicate, save, save-version, versions, calculations
- Импорт внутреннего формата: `POST /api/projects/import/internal`

---

## Этап 5 — Каталоги

**Статус:** выполнено (MVP)

- `GET /api/materials`, `/textures`, `/hardware`, `/profiles`, `/default-presets`

---

## Этап 6 — Frontend ядро

**Статус:** выполнено (MVP)

- Роутинг: логин, регистрация, список проектов, guard по токену
- API-клиент с refresh, хранение токенов в `localStorage`

---

## Этап 7 — Конструктор

**Статус:** выполнено (MVP)

- Страница редактора: Three.js сцена, сетка, добавление панелей, сохранение через `POST /api/projects/:id/save`

---

## Этап 8 — Расчёты

**Статус:** выполнено (упрощённый движок)

- `POST /api/projects/:id/calculate` — эвристика по панелям, предупреждения, запись в `project_calculations` и кеш полей проекта

---

## Этап 9 — Экспорт

**Статус:** выполнено (MVP)

- `POST /api/projects/:id/export/{json,pdf,dxf,internal}` — файлы в `STORAGE_DIR`, учёт квоты `usage_monthly_counters`

---

## Этап 10 — Рендер

**Статус:** выполнено (MVP-заглушка)

- `POST /api/projects/:id/render-preview` + `GET .../render-preview/:jobId` — SVG-превью, запись `render_jobs`

---

## Этап 11 — Админка

**Статус:** выполнено (MVP)

- SPA: dashboard, пользователи, проекты, материалы, JSON-списки, настройки
- API `/api/admin/*` с аудитом `admin_audit_logs`

---

## Этап 12 — Монетизация

**Статус:** выполнено (MVP)

- Тарифы, подписки, лимиты проектов и месячные лимиты рендер/экспорт
- Назначение тарифа админом: `POST /api/admin/users/:id/subscription`

---

## Этап 13 — Финализация

**Статус:** выполнено

- Swagger `/docs`, Helmet, `.gitignore` для `storage/`, отчёт аудита: `docs/audit-report.md`

---

## Закрытие аудита (после этапа 13)

**Статус:** выполнено

- BullMQ + `background_jobs`, асинхронный экспорт/рендер
- S3 (MinIO) + автосоздание bucket
- OTP телефона + webhook SMS + UI на фронте
- Расширенный расчёт + unit-тест
- Строгий CORS в production, опциональный CSRF cookie endpoint
- Lazy-загрузка редактора (Three.js)
- GitHub Actions CI + testcontainers e2e при `RUN_TESTCONTAINERS=1`

