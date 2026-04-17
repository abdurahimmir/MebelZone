import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS } from '../redis/redis.module';
import type Redis from 'ioredis';

export type DependencyCheckStatus = 'ok' | 'unavailable' | 'not_configured';

@Injectable()
export class HealthService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(REDIS) private readonly redis: Redis | null,
  ) {}

  async getDependencyStatus(): Promise<{
    database: DependencyCheckStatus;
    redis: DependencyCheckStatus;
  }> {
    const databaseUrlUnknown: unknown = this.config.get('DATABASE_URL');
    const databaseUrl =
      typeof databaseUrlUnknown === 'string' &&
      databaseUrlUnknown.trim().length > 0
        ? databaseUrlUnknown.trim()
        : undefined;

    let database: DependencyCheckStatus = 'not_configured';
    if (databaseUrl) {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        database = 'ok';
      } catch {
        database = 'unavailable';
      }
    }

    let redis: DependencyCheckStatus = 'not_configured';
    if (this.redis) {
      try {
        const pong = await this.redis.ping();
        redis = pong === 'PONG' ? 'ok' : 'unavailable';
      } catch {
        redis = 'unavailable';
      }
    }

    return { database, redis };
  }
}
