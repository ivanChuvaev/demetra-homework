import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './modules/users/users.module.js';
import { APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AuthGuard } from './modules/auth/guards/auth.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IdempotentInterceptor } from './common/idempotent/idempotent.interceptor.js';
import { IdempotentModule } from './common/idempotent/idempotent.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionGuard } from './modules/auth/guards/permissions.guard.js';
import path from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      async useFactory(configService: ConfigService) {
        return {
          type: 'postgres',
          entities: [path.join(import.meta.dirname, '**/*.entity{.js,.ts}')],
          url: configService.getOrThrow('DATABASE_URL'),
        };
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
      useClass: StandardSchemaValidationPipe,
    },
  ],
})
export class AppModule {}
