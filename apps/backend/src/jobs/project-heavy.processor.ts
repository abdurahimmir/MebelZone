import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  BackgroundJobKind,
  BackgroundJobStatus,
  ExportFormat,
  Prisma,
  RenderJobStatus,
} from '@prisma/client';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { BillingService } from '../billing/billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

export const HEAVY_QUEUE = 'heavy';

export type HeavyJobPayload = {
  backgroundJobId: string;
  userId: string;
  projectId: string;
  kind: BackgroundJobKind;
};

@Processor(HEAVY_QUEUE)
export class ProjectHeavyProcessor extends WorkerHost {
  private readonly logger = new Logger(ProjectHeavyProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly billing: BillingService,
  ) {
    super();
  }

  async process(job: Job<HeavyJobPayload, unknown, string>): Promise<void> {
    const { backgroundJobId, userId, projectId, kind } = job.data;

    await this.prisma.backgroundJob.update({
      where: { id: backgroundJobId },
      data: { status: BackgroundJobStatus.ACTIVE, bullJobId: job.id },
    });

    try {
      if (kind === BackgroundJobKind.RENDER_PREVIEW) {
        await this.handleRenderPreview(backgroundJobId, userId, projectId);
        return;
      }

      const fmt = this.kindToExportFormat(kind);
      const { buffer, mimeType, ext } = await this.buildExportBuffer(
        userId,
        projectId,
        fmt,
      );

      const key = await this.storage.saveBytes(
        `exports/${userId}`,
        this.storage.randomFilename(ext),
        buffer,
      );

      await this.prisma.exportArtifact.create({
        data: {
          projectId,
          userId,
          format: fmt,
          storageKey: key,
          mimeType,
          byteSize: buffer.byteLength,
        },
      });

      await this.prisma.backgroundJob.update({
        where: { id: backgroundJobId },
        data: {
          status: BackgroundJobStatus.COMPLETED,
          resultKey: key,
          mimeType,
          byteSize: buffer.byteLength,
        },
      });

      const tariff = await this.billing.getActiveTariffForUser(userId);
      await this.billing.incrementUsage(
        userId,
        'exportsUsed',
        tariff?.maxExportPerMonth ?? null,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(message);
      await this.prisma.backgroundJob.update({
        where: { id: backgroundJobId },
        data: { status: BackgroundJobStatus.FAILED, error: message },
      });
      throw err;
    }
  }

  private kindToExportFormat(kind: BackgroundJobKind): ExportFormat {
    switch (kind) {
      case BackgroundJobKind.EXPORT_JSON:
        return ExportFormat.JSON;
      case BackgroundJobKind.EXPORT_PDF:
        return ExportFormat.PDF;
      case BackgroundJobKind.EXPORT_DXF:
        return ExportFormat.DXF;
      case BackgroundJobKind.EXPORT_INTERNAL:
        return ExportFormat.INTERNAL;
      default:
        throw new Error('Unsupported export kind');
    }
  }

  private async handleRenderPreview(
    backgroundJobId: string,
    userId: string,
    projectId: string,
  ): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) throw new Error('Project not found');

    const job = await this.prisma.renderJob.create({
      data: { projectId, userId },
    });

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#0b1220"/>
      <text x="40" y="80" fill="#e5e7eb" font-size="28" font-family="sans-serif">Preview ${projectId.slice(0, 8)}</text>
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

    await this.prisma.backgroundJob.update({
      where: { id: backgroundJobId },
      data: {
        status: BackgroundJobStatus.COMPLETED,
        resultKey: key,
        mimeType: 'image/svg+xml',
        byteSize: body.byteLength,
        payloadJson: { renderJobId: job.id } as Prisma.InputJsonValue,
      },
    });

    const tariff = await this.billing.getActiveTariffForUser(userId);
    await this.billing.incrementUsage(
      userId,
      'rendersUsed',
      tariff?.maxRenderPerMonth ?? null,
    );
  }

  private async buildExportBuffer(
    userId: string,
    projectId: string,
    format: ExportFormat,
  ): Promise<{ buffer: Buffer; mimeType: string; ext: string }> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      include: { items: true, client: true },
    });
    if (!project) throw new Error('Project not found');

    if (format === ExportFormat.JSON) {
      const body = Buffer.from(JSON.stringify(project, null, 2), 'utf8');
      return { buffer: body, mimeType: 'application/json', ext: '.json' };
    }

    if (format === ExportFormat.PDF) {
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
      return { buffer: bytes, mimeType: 'application/pdf', ext: '.pdf' };
    }

    if (format === ExportFormat.DXF) {
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
      return { buffer: body, mimeType: 'application/dxf', ext: '.dxf' };
    }

    const envelope = {
      format: 'furniture.internal',
      version: project.projectFormatVersion,
      projectId: project.id,
      savedAt: new Date().toISOString(),
      payload: project,
    };
    const body = Buffer.from(JSON.stringify(envelope), 'utf8');
    return { buffer: body, mimeType: 'application/json', ext: '.fproj.json' };
  }
}
