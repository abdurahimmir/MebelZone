# Аудит после этапов 3–13 (обновлено 2026-04-17)

## Область проверки

- Backend: NestJS, Prisma, Redis, JWT, BullMQ (очередь `heavy`), S3/MinIO или локальное хранилище
- Frontend: Vue 3, lazy-редактор, OTP/телефон UI, асинхронные экспорты
- Admin: Vue 3
- CI: GitHub Actions

## Сильные стороны

- Разделение приложений сохранено
- Экспорт PDF/DXF/JSON/internal и превью-рендер вынесены в **BullMQ** (`heavy` queue) с таблицей `background_jobs`
- **S3-совместимое хранилище** (MinIO в `docker-compose`) с автосозданием bucket; fallback на `STORAGE_DIR`
- **Телефон**: OTP в Redis, `POST /api/auth/phone/send-otp`, опциональный `SMS_WEBHOOK_URL`, `EXPOSE_DEV_OTP` для dev
- **Расчёты**: расширены предупреждениями (тонкий материал, МДФ), оценка петель, структура раскроя по листам; unit-тест `calculation.service.spec.ts`
- **CORS**: в `production` без `CORS_ORIGIN` приложение не стартует
- **CSRF**: `GET /api/csrf/token` при `CSRF_COOKIE_SECRET` + signed cookies
- **CI**: `.github/workflows/ci.yml` (lint, test, e2e с `RUN_TESTCONTAINERS=1`)
- **Интеграционный e2e** с Testcontainers (включается только при `RUN_TESTCONTAINERS=1`)

## Оставшиеся компромиссы (не «идеальный CAD»)

- Раскрой и предупреждения — **эвристики**, не полный промышленный nesting и не все сценарии ТЗ
- BullMQ — одна очередь; масштабирование воркеров = отдельные процессы/инстансы
- Рендер — SVG-превью, не фотореализм

## Команды верификации

```bash
npm install
npm run docker:up
npm run db:migrate
npm run db:seed
npm run lint -w backend
npm run test -w backend
npm run test:e2e -w backend
RUN_TESTCONTAINERS=1 npm run test:e2e -w backend   # с Docker
npm run build -w backend
npm run build -w frontend
npm run build -w admin
```

После seed: админ `ADMIN_EMAIL` / `ADMIN_PASSWORD` из `.env.example`.
