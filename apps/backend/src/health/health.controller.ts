import { Controller, Get } from '@nestjs/common';
import { APP_DISPLAY_NAME } from '@furniture/shared';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: APP_DISPLAY_NAME,
      timestamp: new Date().toISOString(),
    };
  }
}
