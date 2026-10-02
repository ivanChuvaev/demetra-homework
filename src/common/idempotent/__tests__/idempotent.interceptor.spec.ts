import { Test, TestingModule } from '@nestjs/testing';
import { IdempotentService } from '../idempotent.service.js';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { IdempotentInterceptor } from '../idempotent.interceptor.js';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, Observable } from 'rxjs';

const mockedReflector = {
  getAllAndOverride: vi.fn(),
};

describe('IdempotentService', () => {
  let idempotencyService: IdempotentService;
  let idempotentInterceptor: IdempotentInterceptor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdempotentService,
        IdempotentInterceptor,
        {
          provide: APP_INTERCEPTOR,
          useExisting: IdempotentInterceptor,
        },
        {
          provide: Reflector,
          useValue: mockedReflector,
        },
      ],
    }).compile();
    const app = module.createNestApplication();
    idempotencyService = app.get<IdempotentService>(IdempotentService);
    idempotentInterceptor = app.get<IdempotentInterceptor>(
      IdempotentInterceptor,
    );
    await app.init();
  });

  afterEach(() => {
    vitest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(idempotentInterceptor).toBeDefined();
  });

  it('should skip interception when handler is not marked as idempotent or when Idempotency-Key is not provided', async () => {
    const mockedExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ header: () => undefined }),
      }),
      getHandler: () => null,
      getClass: () => null,
    };
    const mockedPipe = vi.fn();
    const mockedHandle = vi.fn(() => ({ pipe: mockedPipe }));
    const mockedCallHandler = {
      handle: mockedHandle,
    };
    mockedReflector.getAllAndOverride.mockResolvedValue(false);
    await idempotentInterceptor.intercept(
      mockedExecutionContext as unknown as ExecutionContext,
      mockedCallHandler as unknown as CallHandler,
    );
    expect(mockedHandle).toHaveBeenCalled();
    expect(mockedPipe).toHaveBeenCalledTimes(0);
    mockedReflector.getAllAndOverride.mockResolvedValue(true);
    await idempotentInterceptor.intercept(
      mockedExecutionContext as unknown as ExecutionContext,
      mockedCallHandler as unknown as CallHandler,
    );
    expect(mockedHandle).toHaveBeenCalled();
    expect(mockedPipe).toHaveBeenCalledTimes(0);
  });

  it('should return saved response for existing idempotency key', async () => {
    idempotencyService.set('idempotency-key-value', { hello: 'world' });
    const mockedExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ header: () => 'idempotency-key-value' }),
      }),
      getHandler: () => null,
      getClass: () => null,
    };
    const mockedPipe = vi.fn();
    const mockedHandle = vi.fn(() => ({ pipe: mockedPipe }));
    const mockedCallHandler = {
      handle: mockedHandle,
    };
    mockedReflector.getAllAndOverride.mockResolvedValue(true);
    const observable = await idempotentInterceptor.intercept(
      mockedExecutionContext as unknown as ExecutionContext,
      mockedCallHandler as unknown as CallHandler,
    );
    expect(await firstValueFrom(observable)).toEqual({ hello: 'world' });
  });

  it('should save response for non existing idempotency key', async () => {
    const mockedExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => ({ header: () => 'idempotency-key-value' }),
      }),
      getHandler: () => null,
      getClass: () => null,
    };
    const observable = new Observable((subscriber) => {
      subscriber.next({ hello: 'world' });
      subscriber.complete();
    });
    const mockedHandle = vi.fn(() => observable);
    const mockedCallHandler = {
      handle: mockedHandle,
    };
    mockedReflector.getAllAndOverride.mockResolvedValue(true);
    const wrappedObservable = await idempotentInterceptor.intercept(
      mockedExecutionContext as unknown as ExecutionContext,
      mockedCallHandler as unknown as CallHandler,
    );
    await firstValueFrom(wrappedObservable); // response imitation
    expect(idempotencyService.get('idempotency-key-value')).toEqual({
      hello: 'world',
    });
  });
});
