import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: {
            getDependencyStatus: () =>
              Promise.resolve({
                database: 'not_configured' as const,
                redis: 'not_configured' as const,
              }),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns ok payload', async () => {
    const body = await controller.getHealth();
    expect(body.status).toBe('ok');
    expect(body.service).toBeTruthy();
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(body.dependencies.database).toBe('not_configured');
    expect(body.dependencies.redis).toBe('not_configured');
  });
});
