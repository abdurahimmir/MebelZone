import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ExportFormat,
  Prisma,
  ProjectStatus,
  RenderJobStatus,
} from '@prisma/client';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { BillingService } from '../billing/billing.service';
import { ClientsService } from '../clients/clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CalculationService } from './calculation.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { ImportInternalDto } from './dto/import-internal.dto';
import type { SaveProjectDto } from './dto/save-project.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: ClientsService,
    private readonly billing: BillingService,
    private readonly calc: CalculationService,
    private readonly storage: StorageService,
  ) {}

  list(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateProjectDto) {
    await this.billing.assertCanCreateProject(userId);
    if (dto.clientId) await this.clients.assertOwnsClient(userId, dto.clientId);

    return this.prisma.project.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        clientId: dto.clientId,
        status: ProjectStatus.DRAFT,
      },
    });
  }

  async getOne(userId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { items: true, client: true },
    });
    if (!project) throw new NotFoundException();
    return project;
  }

  async update(userId: string, id: string, dto: UpdateProjectDto) {
    await this.getOne(userId, id);
    if (dto.clientId) await this.clients.assertOwnsClient(userId, dto.clientId);

    return this.prisma.project.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        clientId: dto.clientId === undefined ? undefined : dto.clientId,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.getOne(userId, id);
    await this.prisma.project.delete({ where: { id } });
    return { ok: true };
  }

  async duplicate(userId: string, id: string) {
    const source = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { items: true },
    });
    if (!source) throw new NotFoundException();

    await this.billing.assertCanCreateProject(userId);

    const copy = await this.prisma.project.create({
      data: {
        userId,
        clientId: source.clientId,
        title: `${source.title} (copy)`,
        description: source.description,
        status: ProjectStatus.DRAFT,
        projectFormatVersion: source.projectFormatVersion,
        savedViewMode: source.savedViewMode,
        savedCameraStateJson: source.savedCameraStateJson ?? undefined,
        savedUiStateJson: source.savedUiStateJson ?? undefined,
      },
    });

    for (const it of source.items) {
      await this.prisma.projectItem.create({
        data: {
          projectId: copy.id,
          itemType: it.itemType,
          parentId: null,
          materialId: it.materialId,
          textureId: it.textureId,
          hardwarePresetId: it.hardwarePresetId,
          geometryJson: it.geometryJson as Prisma.InputJsonValue,
          transformJson: it.transformJson as Prisma.InputJsonValue,
          dimensionJson: it.dimensionJson as Prisma.InputJsonValue,
          styleJson: it.styleJson as Prisma.InputJsonValue | undefined,
          rulesJson: it.rulesJson as Prisma.InputJsonValue | undefined,
        },
      });
    }

    return copy;
  }

  async save(userId: string, id: string, dto: SaveProjectDto) {
    await this.getOne(userId, id);

    await this.prisma.$transaction(async (tx) => {
      await tx.projectItem.deleteMany({ where: { projectId: id } });

      for (const item of dto.items) {
        await tx.projectItem.create({
          data: {
            projectId: id,
            itemType: item.itemType,
            parentId: item.parentId ?? null,
            materialId: item.materialId ?? null,
            textureId: item.textureId ?? null,
            hardwarePresetId: item.hardwarePresetId ?? null,
            geometryJson: item.geometryJson as Prisma.InputJsonValue,
            transformJson: item.transformJson as Prisma.InputJsonValue,
            dimensionJson: item.dimensionJson as Prisma.InputJsonValue,
            styleJson: item.styleJson as Prisma.InputJsonValue | undefined,
            rulesJson: item.rulesJson as Prisma.InputJsonValue | undefined,
          },
        });
      }

      await tx.project.update({
        where: { id },
        data: {
          savedViewMode: dto.savedViewMode ?? undefined,
          savedCameraStateJson: dto.savedCameraStateJson as
            | Prisma.InputJsonValue
            | undefined,
          savedUiStateJson: dto.savedUiStateJson as
            | Prisma.InputJsonValue
            | undefined,
          lastOpenedAt: new Date(),
        },
      });
    });

    return { ok: true };
  }

  async saveVersion(userId: string, id: string, comment?: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { items: true },
    });
    if (!project) throw new NotFoundException();

    const last = await this.prisma.projectVersion.findFirst({
      where: { projectId: id },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });
    const nextVersion = (last?.versionNumber ?? 0) + 1;

    const snapshot = {
      meta: {
        title: project.title,
        formatVersion: project.projectFormatVersion,
        savedViewMode: project.savedViewMode,
        savedCameraStateJson: project.savedCameraStateJson,
        savedUiStateJson: project.savedUiStateJson,
      },
      items: project.items,
    };

    return this.prisma.projectVersion.create({
      data: {
        projectId: id,
        versionNumber: nextVersion,
        snapshotJson: snapshot as Prisma.InputJsonValue,
        comment: comment ?? null,
      },
    });
  }

  versions(userId: string, id: string) {
    return this.prisma.projectVersion.findMany({
      where: { projectId: id, project: { userId } },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        versionNumber: true,
        comment: true,
        createdAt: true,
      },
    });
  }

  calculations(userId: string, id: string) {
    return this.prisma.projectCalculation.findMany({
      where: { projectId: id, project: { userId } },
      orderBy: { calculatedAt: 'desc' },
    });
  }

  async calculate(userId: string, id: string) {
    await this.getOne(userId, id);
    const payload = await this.calc.buildForProject(id);

    const row = await this.prisma.projectCalculation.create({
      data: {
        projectId: id,
        materialsJson: payload.materialsJson as Prisma.InputJsonValue,
        hardwareJson: payload.hardwareJson as Prisma.InputJsonValue,
        edgingJson: payload.edgingJson as Prisma.InputJsonValue,
        cuttingJson: payload.cuttingJson as Prisma.InputJsonValue,
        warningsJson: payload.warningsJson as Prisma.InputJsonValue,
        extraCostsJson: payload.extraCostsJson as Prisma.InputJsonValue,
        totalsJson: payload.totalsJson as Prisma.InputJsonValue,
      },
    });

    const decimals = this.calc.totalsToDecimals(
      payload.totalsJson as {
        material: number;
        hardware: number;
        grand: number;
      },
    );
    await this.prisma.project.update({
      where: { id },
      data: decimals,
    });

    return row;
  }

  async exportJson(userId: string, id: string) {
    await this.billing.getOrCheckQuota(userId, 'export');
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { items: true, client: true },
    });
    if (!project) throw new NotFoundException();

    const body = Buffer.from(JSON.stringify(project, null, 2), 'utf8');
    const key = await this.storage.saveBytes(
      `exports/${userId}`,
      this.storage.randomFilename('.json'),
      body,
    );

    await this.prisma.exportArtifact.create({
      data: {
        projectId: id,
        userId,
        format: ExportFormat.JSON,
        storageKey: key,
        mimeType: 'application/json',
        byteSize: body.byteLength,
      },
    });

    const tariff = await this.billing.getActiveTariffForUser(userId);
    await this.billing.incrementUsage(
      userId,
      'exportsUsed',
      tariff?.maxExportPerMonth ?? null,
    );

    return { downloadPath: key, mimeType: 'application/json' };
  }

  async exportPdf(userId: string, id: string) {
    await this.billing.getOrCheckQuota(userId, 'export');
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { items: true },
    });
    if (!project) throw new NotFoundException();

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText(`Project: ${project.title}`, {
      x: 50,
      y: 780,
      size: 18,
      font,
      color: rgb(0, 0, 0),
    });
    page.drawText(`Items: ${project.items.length}`, {
      x: 50,
      y: 750,
      size: 12,
      font,
    });

    const bytes = Buffer.from(await pdf.save());
    const key = await this.storage.saveBytes(
      `exports/${userId}`,
      this.storage.randomFilename('.pdf'),
      bytes,
    );

    await this.prisma.exportArtifact.create({
      data: {
        projectId: id,
        userId,
        format: ExportFormat.PDF,
        storageKey: key,
        mimeType: 'application/pdf',
        byteSize: bytes.byteLength,
      },
    });

    const tariff = await this.billing.getActiveTariffForUser(userId);
    await this.billing.incrementUsage(
      userId,
      'exportsUsed',
      tariff?.maxExportPerMonth ?? null,
    );

    return { downloadPath: key, mimeType: 'application/pdf' };
  }

  async exportDxf(userId: string, id: string) {
    await this.billing.getOrCheckQuota(userId, 'export');
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { items: true },
    });
    if (!project) throw new NotFoundException();

    const lines: string[] = ['0', 'SECTION', '2', 'ENTITIES'];
    for (const it of project.items) {
      lines.push(
        '0',
        'TEXT',
        '8',
        'DEFAULT',
        '10',
        '0',
        '20',
        '0',
        '40',
        '3',
        '1',
        it.itemType,
      );
    }
    lines.push('0', 'ENDSEC', '0', 'EOF');
    const body = Buffer.from(lines.join('\n'), 'utf8');

    const key = await this.storage.saveBytes(
      `exports/${userId}`,
      this.storage.randomFilename('.dxf'),
      body,
    );

    await this.prisma.exportArtifact.create({
      data: {
        projectId: id,
        userId,
        format: ExportFormat.DXF,
        storageKey: key,
        mimeType: 'application/dxf',
        byteSize: body.byteLength,
      },
    });

    const tariff = await this.billing.getActiveTariffForUser(userId);
    await this.billing.incrementUsage(
      userId,
      'exportsUsed',
      tariff?.maxExportPerMonth ?? null,
    );

    return { downloadPath: key, mimeType: 'application/dxf' };
  }

  async exportInternal(userId: string, id: string) {
    await this.billing.getOrCheckQuota(userId, 'export');
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: { items: true },
    });
    if (!project) throw new NotFoundException();

    const envelope = {
      format: 'furniture.internal',
      version: project.projectFormatVersion,
      projectId: project.id,
      savedAt: new Date().toISOString(),
      payload: project,
    };

    const body = Buffer.from(JSON.stringify(envelope), 'utf8');
    const key = await this.storage.saveBytes(
      `exports/${userId}`,
      this.storage.randomFilename('.fproj.json'),
      body,
    );

    await this.prisma.exportArtifact.create({
      data: {
        projectId: id,
        userId,
        format: ExportFormat.INTERNAL,
        storageKey: key,
        mimeType: 'application/json',
        byteSize: body.byteLength,
      },
    });

    const tariff = await this.billing.getActiveTariffForUser(userId);
    await this.billing.incrementUsage(
      userId,
      'exportsUsed',
      tariff?.maxExportPerMonth ?? null,
    );

    return { downloadPath: key, mimeType: 'application/json' };
  }

  async importInternal(userId: string, dto: ImportInternalDto) {
    await this.billing.assertCanCreateProject(userId);

    const project = await this.prisma.project.create({
      data: {
        userId,
        title: dto.meta.title,
        description: dto.meta.description,
        status: ProjectStatus.DRAFT,
      },
    });

    await this.save(userId, project.id, dto.snapshot);
    return project;
  }

  async getRenderArtifact(userId: string, projectId: string, jobId: string) {
    const job = await this.prisma.renderJob.findFirst({
      where: { id: jobId, projectId, userId },
    });
    if (!job?.imagePath) throw new NotFoundException();
    return { path: job.imagePath, mimeType: 'image/svg+xml' };
  }

  async renderPreview(userId: string, id: string) {
    await this.billing.getOrCheckQuota(userId, 'render');
    await this.getOne(userId, id);

    const job = await this.prisma.renderJob.create({
      data: {
        projectId: id,
        userId,
      },
    });

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#0b1220"/>
      <text x="40" y="80" fill="#e5e7eb" font-size="28" font-family="sans-serif">Preview ${id.slice(0, 8)}</text>
      <rect x="120" y="200" width="520" height="280" fill="#1f2937" stroke="#3b82f6" stroke-width="2"/>
    </svg>`;
    const body = Buffer.from(svg, 'utf8');
    const key = await this.storage.saveBytes(
      `renders/${userId}`,
      this.storage.randomFilename('.svg'),
      body,
    );

    await this.prisma.renderJob.update({
      where: { id: job.id },
      data: { status: RenderJobStatus.DONE, imagePath: key },
    });

    const tariff = await this.billing.getActiveTariffForUser(userId);
    await this.billing.incrementUsage(
      userId,
      'rendersUsed',
      tariff?.maxRenderPerMonth ?? null,
    );

    return { jobId: job.id, imagePath: key, mimeType: 'image/svg+xml' };
  }
}
