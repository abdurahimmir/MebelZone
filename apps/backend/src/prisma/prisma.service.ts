import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async onModuleInit(): Promise<void> {
    const databaseUrlUnknown: unknown = this.config.get('DATABASE_URL');
    const databaseUrl =
      typeof databaseUrlUnknown === 'string' &&
      databaseUrlUnknown.trim().length > 0
        ? databaseUrlUnknown.trim()
        : undefined;

    if (!databaseUrl) {
      this.logger.warn(
        'DATABASE_URL is not set; Prisma will stay disconnected until configured.',
      );
      return;
    }

    try {
      await this.$connect();
      this.logger.log('Prisma connected to PostgreSQL');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Prisma failed to connect: ${message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
