import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './modules/users/users.module.js';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthGuard } from './modules/auth/guards/auth.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IdempotentInterceptor } from './common/idempotent/idempotent.interceptor.js';
import { IdempotentModule } from './common/idempotent/idempotent.module.js';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { PermissionGuard } from './modules/auth/guards/permissions.guard.js';
import { ZodValidationPipe } from 'nestjs-zod';
import { DemetraEnvironment } from './common/types/demetra-environment.type.js';
import { DemetraExceptionFilter } from './common/demetra/demetra-exception.filter.js';
import { Token } from './modules/auth/entities/token.entity.js';
import { User } from './modules/users/entities/user.entity.js';
import { environmentSchema } from './common/schemas/environment.schema.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      validate: environmentSchema.parse,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      async useFactory(configService: ConfigService<DemetraEnvironment>) {
        const isTestEnv = configService.get('NODE_ENV') === 'test';
        const config: TypeOrmModuleOptions = {
          type: 'postgres',
          entities: [Token, User],
          url: isTestEnv
            ? configService.getOrThrow('DATABASE_TEST_URL')
            : configService.getOrThrow('DATABASE_URL'),
          synchronize: isTestEnv,
          dropSchema: isTestEnv,
        };
        return config;
      },
    }),
    IdempotentModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IdempotentInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_PIPE,
      useClass: StandardSchemaValidationPipe,
    },
    {
      provide: APP_FILTER,
      useClass: DemetraExceptionFilter,
    },
  ],
})
export class AppModule {}
