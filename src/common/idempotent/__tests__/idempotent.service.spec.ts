import { Test, TestingModule } from '@nestjs/testing';
import {
  IDEMPOTENT_SERVICE_MAX_SIZE,
  IdempotentService,
} from '../idempotent.service.js';
import { randomUUID } from 'node:crypto';

describe('IdempotentService', () => {
  let service: IdempotentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdempotentService],
    }).compile();

    service = module.get<IdempotentService>(IdempotentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should remove old keys', () => {
    const originalKey = randomUUID();
    service.set(originalKey, 'A');
    expect(service.has(originalKey)).toBe(true);
    for (let i = 0; i < IDEMPOTENT_SERVICE_MAX_SIZE; i++) {
      const key = randomUUID();
      service.set(key, 'B');
    }
    expect(service.has(originalKey)).toBe(false);
  });
});
