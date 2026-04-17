import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  type JwtUserPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ImportInternalDto } from './dto/import-internal.dto';
import { ProjectsService } from './projects.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsImportController {
  constructor(private readonly projects: ProjectsService) {}

  @Post('import/internal')
  importInternal(
    @CurrentUser() user: JwtUserPayload,
    @Body() dto: ImportInternalDto,
  ) {
    return this.projects.importInternal(user.sub, dto);
  }
}
