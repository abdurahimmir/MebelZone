import { Controller, Get } from '@nestjs/common';
import { APP_DISPLAY_NAME } from '@furniture/shared';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  async getHealth() {
    const dependencies = await this.health.getDependencyStatus();

    return {
      status: 'ok',
      service: APP_DISPLAY_NAME,
      timestamp: new Date().toISOString(),
      dependencies,
    };
  }
}
