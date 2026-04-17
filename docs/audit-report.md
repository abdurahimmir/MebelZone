# Аудит после этапов 3–13 (2026-04-17)

## Область проверки

- Backend: NestJS, Prisma, Redis-сессии refresh, JWT, throttling, admin audit, экспорт/рендер
- Frontend: Vue 3, авторизация, проекты, редактор (Three.js), вызовы API
- Admin: Vue 3, защита маршрутов по роли ADMIN
- Инфраструктура: `docker-compose`, миграции, seed

## Сильные стороны

- Разделение `apps/backend`, `apps/frontend`, `apps/admin` сохранено
- API-контуры из `TECHS.md` (маршруты `/api/auth/*`, `/api/projects/*`, `/api/clients/*`, `/api/materials` и т.д.) закрыты базовой реализацией
- Prisma-схема покрывает сущности ТЗ; добавлены `company_id`, учёт использования, аудит админа, артефакты экспорта и рендера
- Refresh-токены привязаны к Redis (отзыв при logout)
- Rate limit на auth через `@nestjs/throttler`
- Helmet + Swagger (`/docs`) на backend
- Seed создаёт администратора и демо-данные каталога

## Риски и пробелы (приоритет доработки)

1. **BullMQ** — по ТЗ очереди на Redis; сейчас рендер и тяжёлые задачи выполняются синхронно в HTTP-запросе. Нужны воркеры и отдельные job endpoints.
2. **S3 / внешнее хранилище** — файлы пишутся в локальный `STORAGE_DIR`. Для продакшена нужен адаптер S3-совместимого API.
3. **Google OAuth** — проверка `id_token` есть; для продакшена нужны валидные `GOOGLE_CLIENT_ID`, ротация секретов, отдельный OAuth flow при необходимости.
4. **Телефон** — регистрация/вход по паролю без SMS/OTP; по ТЗ может потребоваться провайдер верификации.
5. **Расчёты и раскрой** — упрощённая эвристика; производственный раскрой и правила предупреждений из ТЗ требуют отдельного движка и тестов на фикстурах.
6. **CSRF** — при переходе на cookie-сессии понадобится CSRF-токен; сейчас Bearer JWT в заголовке.
7. **E2E покрытие** — один smoke-тест health; нет интеграционных тестов по auth/projects с реальной БД в CI.
8. **Frontend bundle** — Three.js увеличивает чанк; для продакшена — lazy route для редактора.
9. **CORS** — в продакшене жёстко задать `CORS_ORIGIN`, не использовать `origin: true` без `CORS_ORIGIN`.

## Рекомендуемые следующие шаги

- Поднять CI: `lint`, `test`, `build`, `prisma validate` на каждый PR
- Добавить e2e (supertest) на регистрацию + создание проекта с testcontainers PostgreSQL + Redis
- Вынести расчёт в отдельный модуль с юнит-тестами на JSON-фикстурах проектов
- Подключить BullMQ для `render-preview` и экспорта PDF больших проектов

## Команды верификации (локально)

```bash
npm install
npm run docker:up
npm run db:migrate
npm run db:seed
npm run lint -w backend
npm run test -w backend
npm run test:e2e -w backend
npm run build -w backend
npm run build -w frontend
npm run build -w admin
```

После seed: админ `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `.env.example` (по умолчанию `admin@example.com` / `Admin12345678`).
