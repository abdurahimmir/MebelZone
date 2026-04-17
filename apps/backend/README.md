# Backend (`apps/backend`)

NestJS HTTP API для сервиса проектирования мебели.

## Разработка

```bash
npm run start:dev -w backend
```

## Полезные эндпоинты

- `GET /api/health` — проверка живости сервиса и статуса зависимостей (`database`, `redis`)

## База данных (Prisma)

```bash
npm run prisma:generate -w backend
npm run prisma:migrate -w backend
npm run db:seed -w backend
```

Подробности по монорепозиторию и окружению — в корневом `README.md`.
