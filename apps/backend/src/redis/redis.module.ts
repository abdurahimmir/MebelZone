import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const logger = new Logger('RedisModule');
        const redisUrlUnknown: unknown = config.get('REDIS_URL');
        const redisUrl =
          typeof redisUrlUnknown === 'string' &&
          redisUrlUnknown.trim().length > 0
            ? redisUrlUnknown.trim()
            : undefined;

        if (!redisUrl) {
          logger.warn(
            'REDIS_URL is not set; Redis client will not be created.',
          );
          return null;
        }

        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: null,
        });

        client.on('error', (err) => {
          logger.error(err.message);
        });

        logger.log('Redis client initialized');
        return client;
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
