import { Module } from '@nestjs/common';
import { IdempotentService } from './idempotent.service.js';

@Module({
  providers: [IdempotentService],
  exports: [IdempotentService],
})
export class IdempotentModule {}
