import { ForbiddenException, Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  private currentYearMonth(): string {
    const d = new Date();
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  async getActiveTariffForUser(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
        OR: [{ endedAt: null }, { endedAt: { gt: new Date() } }],
      },
      include: { tariff: true },
      orderBy: { startedAt: 'desc' },
    });
    if (sub?.tariff) return sub.tariff;

    return this.prisma.tariff.findFirst({
      where: { code: 'free', isActive: true },
    });
  }

  async assertCanCreateProject(userId: string): Promise<void> {
    const tariff = await this.getActiveTariffForUser(userId);
    if (!tariff?.maxProjects) return;

    const count = await this.prisma.project.count({ where: { userId } });
    if (count >= tariff.maxProjects) {
      throw new ForbiddenException('Project limit reached for current tariff');
    }
  }

  async incrementUsage(
    userId: string,
    field: 'rendersUsed' | 'exportsUsed',
    tariffLimit: number | null,
  ): Promise<void> {
    const ym = this.currentYearMonth();
    const row = await this.prisma.usageMonthlyCounter.upsert({
      where: { userId_yearMonth: { userId, yearMonth: ym } },
      create: { userId, yearMonth: ym, rendersUsed: 0, exportsUsed: 0 },
      update: {},
    });

    const nextValue =
      (field === 'rendersUsed' ? row.rendersUsed : row.exportsUsed) + 1;
    if (tariffLimit !== null && nextValue > tariffLimit) {
      throw new ForbiddenException('Monthly quota exceeded');
    }

    await this.prisma.usageMonthlyCounter.update({
      where: { id: row.id },
      data:
        field === 'rendersUsed'
          ? { rendersUsed: { increment: 1 } }
          : { exportsUsed: { increment: 1 } },
    });
  }

  async getOrCheckQuota(
    userId: string,
    kind: 'render' | 'export',
  ): Promise<{ limit: number | null; used: number }> {
    const tariff = await this.getActiveTariffForUser(userId);
    const limit =
      kind === 'render'
        ? (tariff?.maxRenderPerMonth ?? null)
        : (tariff?.maxExportPerMonth ?? null);

    const ym = this.currentYearMonth();
    const row = await this.prisma.usageMonthlyCounter.findUnique({
      where: { userId_yearMonth: { userId, yearMonth: ym } },
    });
    const used =
      kind === 'render' ? (row?.rendersUsed ?? 0) : (row?.exportsUsed ?? 0);

    if (limit !== null && used >= limit) {
      throw new ForbiddenException('Monthly quota exceeded');
    }

    return { limit, used };
  }
}
