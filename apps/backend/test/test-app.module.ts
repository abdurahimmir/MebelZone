import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from '../src/admin/admin.module';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { BillingModule } from '../src/billing/billing.module';
import { CatalogModule } from '../src/catalog/catalog.module';
import { ClientsModule } from '../src/clients/clients.module';
import { envValidationSchema } from '../src/config/env.validation';
import { HealthModule } from '../src/health/health.module';
import { PrismaModule } from '../src/prisma/prisma.module';
import { ProjectsModule } from '../src/projects/projects.module';
import { StorageModule } from '../src/storage/storage.module';
import { SystemModule } from '../src/system/system.module';
import { MockHeavyQueueModule } from './mock-heavy-queue.module';
import { RedisTestModule } from './redis-test.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: true },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    RedisTestModule,
    MockHeavyQueueModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'test-access-secret-16chars',
      signOptions: { expiresIn: 900 },
    }),
    PrismaModule,
    SystemModule,
    StorageModule,
    BillingModule,
    ClientsModule,
    ProjectsModule,
    CatalogModule,
    AdminModule,
    HealthModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class TestAppModule {}
