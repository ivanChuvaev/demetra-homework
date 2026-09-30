import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable, of } from 'rxjs';
import { RequestAfterAuth } from '../../modules/auth/types/auth.types.js';
import { IdempotentService } from './idempotent.service.js';
import { Reflector } from '@nestjs/core';
import { IS_IDEMPOTENT_KEY } from './idempotent.decorator.js';

@Injectable()
export class IdempotentInterceptor implements NestInterceptor {
  constructor(
    private readonly idempotencyService: IdempotentService,
    private readonly reflector: Reflector,
  ) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const host = context.switchToHttp();
    const request = host.getRequest() as RequestAfterAuth;
    const idempotencyKey = request.header('Idempotency-Key');
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(
      IS_IDEMPOTENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (idempotencyKey === undefined || !isIdempotent) {
      return next.handle();
    }

    if (this.idempotencyService.has(idempotencyKey)) {
      return of(this.idempotencyService.get(idempotencyKey));
    }

    return next.handle().pipe(
      map((res) => {
        this.idempotencyService.set(idempotencyKey, res);
        return res;
      }),
    );
  }
}
