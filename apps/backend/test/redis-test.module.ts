import { Global, Module } from '@nestjs/common';
import MockRedis from 'ioredis-mock';
import { REDIS } from '../src/redis/redis.module';

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: () => new MockRedis(),
    },
  ],
  exports: [REDIS],
})
export class RedisTestModule {}
