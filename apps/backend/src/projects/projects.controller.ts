import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  CurrentUser,
  type JwtUserPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StorageService } from '../storage/storage.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { SaveProjectDto } from './dto/save-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly storage: StorageService,
  ) {}

  @Get()
  list(@CurrentUser() user: JwtUserPayload) {
    return this.projects.list(user.sub);
  }

  @Post()
  create(@CurrentUser() user: JwtUserPayload, @Body() dto: CreateProjectDto) {
    return this.projects.create(user.sub, dto);
  }

  @Get(':id')
  get(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.getOne(user.sub, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects.update(user.sub, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.remove(user.sub, id);
  }

  @Post(':id/duplicate')
  duplicate(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.duplicate(user.sub, id);
  }

  @Post(':id/save')
  save(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveProjectDto,
  ) {
    return this.projects.save(user.sub, id, dto);
  }

  @Post(':id/save-version')
  saveVersion(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { comment?: string },
  ) {
    return this.projects.saveVersion(user.sub, id, body?.comment);
  }

  @Get(':id/versions')
  versions(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.versions(user.sub, id);
  }

  @Get(':id/calculations')
  calculations(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.calculations(user.sub, id);
  }

  @Post(':id/calculate')
  calculate(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.calculate(user.sub, id);
  }

  @Post(':id/render-preview')
  renderPreview(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.enqueueRenderPreview(user.sub, id);
  }

  @Get(':id/jobs/:jobId')
  getJob(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.projects.getBackgroundJob(user.sub, id, jobId);
  }

  @Get(':id/jobs/:jobId/download')
  @Header('Cache-Control', 'no-store')
  async downloadJob(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { stream, mimeType, filename } =
      await this.projects.streamBackgroundJobResult(user.sub, id, jobId);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(stream as import('stream').Readable);
  }

  @Get(':id/render-preview/:renderJobId')
  async renderPreviewFile(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('renderJobId', ParseUUIDPipe) renderJobId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { path, mimeType } = await this.projects.getRenderArtifact(
      user.sub,
      id,
      renderJobId,
    );
    const stream = await this.storage.createReadStreamForKey(path);
    res.setHeader('Content-Type', mimeType);
    return new StreamableFile(stream);
  }

  @Post(':id/export/json')
  exportJson(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.enqueueExportJson(user.sub, id);
  }

  @Post(':id/export/pdf')
  exportPdf(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.enqueueExportPdf(user.sub, id);
  }

  @Post(':id/export/dxf')
  exportDxf(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.enqueueExportDxf(user.sub, id);
  }

  @Post(':id/export/internal')
  exportInternal(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.projects.enqueueExportInternal(user.sub, id);
  }
}
