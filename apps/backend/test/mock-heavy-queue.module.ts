import { Global, Module } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { HEAVY_QUEUE } from '../src/jobs/project-heavy.processor';

const mockQueue = {
  add: () => Promise.resolve({ id: 'mock-bull-job' }),
};

@Global()
@Module({
  providers: [
    {
      provide: getQueueToken(HEAVY_QUEUE),
      useValue: mockQueue,
    },
  ],
  exports: [getQueueToken(HEAVY_QUEUE)],
})
export class MockHeavyQueueModule {}
