import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BackgroundJobKind,
  BackgroundJobStatus,
  Prisma,
  ProjectStatus,
} from '@prisma/client';
import { Queue } from 'bullmq';
import { BillingService } from '../billing/billing.service';
import { ClientsService } from '../clients/clients.service';
import type { HeavyJobPayload } from '../jobs/project-heavy.processor';
import { HEAVY_QUEUE } from '../jobs/project-heavy.processor';
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
    @InjectQueue(HEAVY_QUEUE)
    private readonly heavyQueue: Queue<HeavyJobPayload>,
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

  private async enqueueHeavy(
    userId: string,
    projectId: string,
    kind: BackgroundJobKind,
  ) {
    await this.getOne(userId, projectId);

    if (kind === BackgroundJobKind.RENDER_PREVIEW) {
      await this.billing.getOrCheckQuota(userId, 'render');
    } else {
      await this.billing.getOrCheckQuota(userId, 'export');
    }

    const row = await this.prisma.backgroundJob.create({
      data: {
        kind,
        userId,
        projectId,
        status: BackgroundJobStatus.PENDING,
      },
    });

    const bullJob = await this.heavyQueue.add(
      'run',
      {
        backgroundJobId: row.id,
        userId,
        projectId,
        kind,
      } satisfies HeavyJobPayload,
      { removeOnComplete: 100, removeOnFail: 50 },
    );

    await this.prisma.backgroundJob.update({
      where: { id: row.id },
      data: { bullJobId: String(bullJob.id) },
    });

    return {
      backgroundJobId: row.id,
      bullJobId: String(bullJob.id),
      status: row.status,
    };
  }

  async enqueueExportJson(userId: string, projectId: string) {
    return this.enqueueHeavy(userId, projectId, BackgroundJobKind.EXPORT_JSON);
  }

  async enqueueExportPdf(userId: string, projectId: string) {
    return this.enqueueHeavy(userId, projectId, BackgroundJobKind.EXPORT_PDF);
  }

  async enqueueExportDxf(userId: string, projectId: string) {
    return this.enqueueHeavy(userId, projectId, BackgroundJobKind.EXPORT_DXF);
  }

  async enqueueExportInternal(userId: string, projectId: string) {
    return this.enqueueHeavy(
      userId,
      projectId,
      BackgroundJobKind.EXPORT_INTERNAL,
    );
  }

  async enqueueRenderPreview(userId: string, projectId: string) {
    return this.enqueueHeavy(
      userId,
      projectId,
      BackgroundJobKind.RENDER_PREVIEW,
    );
  }

  async getBackgroundJob(userId: string, projectId: string, jobId: string) {
    const job = await this.prisma.backgroundJob.findFirst({
      where: { id: jobId, userId, projectId },
    });
    if (!job) throw new NotFoundException();
    return job;
  }

  async streamBackgroundJobResult(
    userId: string,
    projectId: string,
    jobId: string,
  ): Promise<{
    stream: NodeJS.ReadableStream;
    mimeType: string;
    filename: string;
  }> {
    const job = await this.getBackgroundJob(userId, projectId, jobId);
    if (job.status !== BackgroundJobStatus.COMPLETED || !job.resultKey) {
      throw new BadRequestException('Job not ready');
    }

    const stream = await this.storage.createReadStreamForKey(job.resultKey);
    const mimeType = job.mimeType ?? 'application/octet-stream';
    const ext =
      job.kind === BackgroundJobKind.EXPORT_PDF
        ? 'pdf'
        : job.kind === BackgroundJobKind.EXPORT_DXF
          ? 'dxf'
          : job.kind === BackgroundJobKind.EXPORT_INTERNAL
            ? 'fproj.json'
            : 'json';
    return {
      stream,
      mimeType,
      filename: `project-${projectId}.${ext}`,
    };
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
}
