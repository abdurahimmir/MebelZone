import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BillingModule } from '../billing/billing.module';
import { StorageModule } from '../storage/storage.module';
import { HEAVY_QUEUE, ProjectHeavyProcessor } from './project-heavy.processor';

@Module({
  imports: [
    BillingModule,
    StorageModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrlUnknown: unknown = config.get('REDIS_URL');
        const redisUrl =
          typeof redisUrlUnknown === 'string' &&
          redisUrlUnknown.trim().length > 0
            ? redisUrlUnknown.trim()
            : 'redis://127.0.0.1:6379';

        return {
          connection: { url: redisUrl },
        };
      },
    }),
    BullModule.registerQueue({
      name: HEAVY_QUEUE,
    }),
  ],
  providers: [ProjectHeavyProcessor],
  exports: [BullModule],
})
export class JobsModule {}
