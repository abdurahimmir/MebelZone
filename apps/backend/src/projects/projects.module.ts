import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients/clients.module';
import { JobsModule } from '../jobs/jobs.module';
import { StorageModule } from '../storage/storage.module';
import { CalculationService } from './calculation.service';
import { ProjectsImportController } from './projects-import.controller';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [ClientsModule, JobsModule, StorageModule],
  controllers: [ProjectsImportController, ProjectsController],
  providers: [ProjectsService, CalculationService],
})
export class ProjectsModule {}
