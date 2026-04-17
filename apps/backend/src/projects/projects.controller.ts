import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
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
    return this.projects.renderPreview(user.sub, id);
  }

  @Get(':id/render-preview/:jobId')
  async renderPreviewFile(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { path, mimeType } = await this.projects.getRenderArtifact(
      user.sub,
      id,
      jobId,
    );
    const abs = this.storage.getAbsolutePath(path);
    res.setHeader('Content-Type', mimeType);
    return new Promise<void>((resolve, reject) => {
      const stream = createReadStream(abs);
      stream.on('error', reject);
      stream.on('end', () => resolve());
      stream.pipe(res);
    });
  }

  @Post(':id/export/json')
  async exportJson(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { downloadPath, mimeType } = await this.projects.exportJson(
      user.sub,
      id,
    );
    const abs = this.storage.getAbsolutePath(downloadPath);
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="project-${id}.json"`,
    );
    return new Promise<void>((resolve, reject) => {
      const stream = createReadStream(abs);
      stream.on('error', reject);
      stream.on('end', () => resolve());
      stream.pipe(res);
    });
  }

  @Post(':id/export/pdf')
  async exportPdf(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { downloadPath, mimeType } = await this.projects.exportPdf(
      user.sub,
      id,
    );
    const abs = this.storage.getAbsolutePath(downloadPath);
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="project-${id}.pdf"`,
    );
    return new Promise<void>((resolve, reject) => {
      const stream = createReadStream(abs);
      stream.on('error', reject);
      stream.on('end', () => resolve());
      stream.pipe(res);
    });
  }

  @Post(':id/export/dxf')
  async exportDxf(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { downloadPath, mimeType } = await this.projects.exportDxf(
      user.sub,
      id,
    );
    const abs = this.storage.getAbsolutePath(downloadPath);
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="project-${id}.dxf"`,
    );
    return new Promise<void>((resolve, reject) => {
      const stream = createReadStream(abs);
      stream.on('error', reject);
      stream.on('end', () => resolve());
      stream.pipe(res);
    });
  }

  @Post(':id/export/internal')
  async exportInternal(
    @CurrentUser() user: JwtUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { downloadPath, mimeType } = await this.projects.exportInternal(
      user.sub,
      id,
    );
    const abs = this.storage.getAbsolutePath(downloadPath);
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="project-${id}.fproj.json"`,
    );
    return new Promise<void>((resolve, reject) => {
      const stream = createReadStream(abs);
      stream.on('error', reject);
      stream.on('end', () => resolve());
      stream.pipe(res);
    });
  }
}
