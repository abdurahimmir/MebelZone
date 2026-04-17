import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  async getBooleanSetting(
    key: string,
    defaultValue: boolean,
  ): Promise<boolean> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key },
      select: { valueJson: true },
    });
    if (!row) return defaultValue;
    return Boolean(row.valueJson);
  }

  async setBooleanSetting(key: string, value: boolean): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, valueJson: value },
      update: { valueJson: value },
    });
  }

  async getJsonSetting<T>(key: string): Promise<T | null> {
    const row = await this.prisma.systemSetting.findUnique({
      where: { key },
      select: { valueJson: true },
    });
    if (!row) return null;
    return row.valueJson as T;
  }
}
