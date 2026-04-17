import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Prisma,
  RenderJobStatus,
  SubscriptionStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async audit(
    adminId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    payload?: Prisma.InputJsonValue,
  ) {
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        payload,
      },
    });
  }

  users() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  projects() {
    return this.prisma.project.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        client: { select: { id: true, name: true } },
      },
    });
  }

  materials() {
    return this.prisma.material.findMany({ orderBy: { title: 'asc' } });
  }

  textures() {
    return this.prisma.texture.findMany({ orderBy: { title: 'asc' } });
  }

  hardwareTypes() {
    return this.prisma.hardwareType.findMany({ orderBy: { title: 'asc' } });
  }

  hardwarePresets() {
    return this.prisma.hardwarePreset.findMany({ orderBy: { title: 'asc' } });
  }

  tariffs() {
    return this.prisma.tariff.findMany({ orderBy: { code: 'asc' } });
  }

  async systemSettings() {
    return this.prisma.systemSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async updateUserRole(adminId: string, userId: string, role: UserRole) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, role: true },
    });
    await this.audit(adminId, 'user.role', 'user', userId, { role });
    return updated;
  }

  async updateUserStatus(adminId: string, userId: string, status: UserStatus) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, status: true },
    });
    await this.audit(adminId, 'user.status', 'user', userId, { status });
    return updated;
  }

  async createMaterial(adminId: string, data: Prisma.MaterialCreateInput) {
    const row = await this.prisma.material.create({ data });
    await this.audit(adminId, 'material.create', 'material', row.id);
    return row;
  }

  async updateMaterial(
    adminId: string,
    id: string,
    data: Prisma.MaterialUpdateInput,
  ) {
    const row = await this.prisma.material.update({ where: { id }, data });
    await this.audit(adminId, 'material.update', 'material', id, {
      updated: true,
    });
    return row;
  }

  async deleteMaterial(adminId: string, id: string) {
    await this.prisma.material.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit(adminId, 'material.deactivate', 'material', id);
    return { ok: true };
  }

  async createTexture(adminId: string, data: Prisma.TextureCreateInput) {
    const row = await this.prisma.texture.create({ data });
    await this.audit(adminId, 'texture.create', 'texture', row.id);
    return row;
  }

  async updateTexture(
    adminId: string,
    id: string,
    data: Prisma.TextureUpdateInput,
  ) {
    const row = await this.prisma.texture.update({ where: { id }, data });
    await this.audit(adminId, 'texture.update', 'texture', id);
    return row;
  }

  async deleteTexture(adminId: string, id: string) {
    await this.prisma.texture.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit(adminId, 'texture.deactivate', 'texture', id);
    return { ok: true };
  }

  async createHardwareType(
    adminId: string,
    data: Prisma.HardwareTypeCreateInput,
  ) {
    const row = await this.prisma.hardwareType.create({ data });
    await this.audit(adminId, 'hardware_type.create', 'hardware_type', row.id);
    return row;
  }

  async updateHardwareType(
    adminId: string,
    id: string,
    data: Prisma.HardwareTypeUpdateInput,
  ) {
    const row = await this.prisma.hardwareType.update({ where: { id }, data });
    await this.audit(adminId, 'hardware_type.update', 'hardware_type', id);
    return row;
  }

  async deleteHardwareType(adminId: string, id: string) {
    await this.prisma.hardwareType.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit(adminId, 'hardware_type.deactivate', 'hardware_type', id);
    return { ok: true };
  }

  async createHardwarePreset(
    adminId: string,
    data: Prisma.HardwarePresetCreateInput,
  ) {
    const row = await this.prisma.hardwarePreset.create({ data });
    await this.audit(
      adminId,
      'hardware_preset.create',
      'hardware_preset',
      row.id,
    );
    return row;
  }

  async updateHardwarePreset(
    adminId: string,
    id: string,
    data: Prisma.HardwarePresetUpdateInput,
  ) {
    const row = await this.prisma.hardwarePreset.update({
      where: { id },
      data,
    });
    await this.audit(adminId, 'hardware_preset.update', 'hardware_preset', id);
    return row;
  }

  async deleteHardwarePreset(adminId: string, id: string) {
    await this.prisma.hardwarePreset.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit(
      adminId,
      'hardware_preset.deactivate',
      'hardware_preset',
      id,
    );
    return { ok: true };
  }

  async createTariff(adminId: string, data: Prisma.TariffCreateInput) {
    const row = await this.prisma.tariff.create({ data });
    await this.audit(adminId, 'tariff.create', 'tariff', row.id);
    return row;
  }

  async updateTariff(
    adminId: string,
    id: string,
    data: Prisma.TariffUpdateInput,
  ) {
    const row = await this.prisma.tariff.update({ where: { id }, data });
    await this.audit(adminId, 'tariff.update', 'tariff', id);
    return row;
  }

  async deleteTariff(adminId: string, id: string) {
    await this.prisma.tariff.update({
      where: { id },
      data: { isActive: false },
    });
    await this.audit(adminId, 'tariff.deactivate', 'tariff', id);
    return { ok: true };
  }

  async upsertSystemSetting(
    adminId: string,
    key: string,
    valueJson: Prisma.InputJsonValue,
  ) {
    const row = await this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, valueJson },
      update: { valueJson },
    });
    await this.audit(
      adminId,
      'system_setting.upsert',
      'system_setting',
      row.id,
      { key },
    );
    return row;
  }

  async assignSubscription(adminId: string, userId: string, tariffId: string) {
    const tariff = await this.prisma.tariff.findUnique({
      where: { id: tariffId },
    });
    if (!tariff) throw new NotFoundException('Tariff not found');

    await this.prisma.subscription.updateMany({
      where: { userId, status: SubscriptionStatus.ACTIVE },
      data: { status: SubscriptionStatus.CANCELED, endedAt: new Date() },
    });

    const sub = await this.prisma.subscription.create({
      data: {
        userId,
        tariffId,
        status: SubscriptionStatus.ACTIVE,
      },
    });
    await this.audit(adminId, 'subscription.assign', 'subscription', sub.id, {
      userId,
      tariffId,
    });
    return sub;
  }

  dashboard() {
    return Promise.all([
      this.prisma.user.count(),
      this.prisma.project.count(),
      this.prisma.renderJob.count({ where: { status: RenderJobStatus.DONE } }),
      this.prisma.exportArtifact.count(),
    ]).then(([users, projects, renders, exports]) => ({
      users,
      projects,
      renders,
      exports,
    }));
  }
}
