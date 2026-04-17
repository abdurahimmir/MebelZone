/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
/**
 * Integration test: PostgreSQL + Redis (Testcontainers), migrations, register, create project.
 * CI: RUN_TESTCONTAINERS=1 (see .github/workflows/ci.yml).
 * Local with Docker: RUN_TESTCONTAINERS=1 npm run test:e2e -w backend
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { RedisContainer } from '@testcontainers/redis';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

jest.setTimeout(180_000);

const runIntegration = process.env.RUN_TESTCONTAINERS === '1';
const suite = runIntegration ? describe : describe.skip;

suite('Auth + project (e2e, testcontainers)', () => {
  let app: INestApplication<App>;
  let pg: PostgreSqlContainer;
  let redis: RedisContainer;

  beforeAll(async () => {
    pg = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('furniture')
      .withUsername('postgres')
      .withPassword('postgres')
      .start();
    redis = await new RedisContainer('redis:7-alpine').start();

    process.env.DATABASE_URL = pg.getConnectionUri();
    process.env.REDIS_URL = redis.getUrl();
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-16chars!!';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-16chars!!';
    process.env.CORS_ORIGIN = 'http://localhost:5173';

    const backendRoot = join(__dirname, '..');
    execSync('npx prisma migrate deploy', {
      cwd: backendRoot,
      env: { ...process.env, PATH: process.env.PATH },
      stdio: 'pipe',
    });
    execSync('node prisma/seed.cjs', {
      cwd: backendRoot,
      env: { ...process.env, PATH: process.env.PATH },
      stdio: 'pipe',
    });
  });

  afterAll(async () => {
    await app?.close();
    await pg?.stop();
    await redis?.stop();
  });

  it('registers user and creates a project', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const email = `user-${Date.now()}@example.com`;
    const reg = await request(app.getHttpServer())
      .post('/api/auth/register/email')
      .send({
        fullName: 'Test User',
        email,
        password: 'Password123456',
      })
      .expect(201);

    const { accessToken } = reg.body as { accessToken: string };
    expect(accessToken).toBeTruthy();

    const proj = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'E2E Project' })
      .expect(201);

    expect((proj.body as { title: string }).title).toBe('E2E Project');
  });
});
