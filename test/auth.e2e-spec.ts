import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersService } from '../src/users/users.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../src/users/users.module.js';
import { AuthModule } from '../src/auth/auth.module.js';
import { User } from '../src/users/user.entity.js';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from '../src/auth/auth.guard.js';
import { IdempotentInterceptor } from '../src/idempotent/idempotent.interceptor.js';
import { IdempotentModule } from '../src/idempotent/idempotent.module.js';
import { Role } from '../src/roles/role.enum.js';
import request from 'supertest';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let user: User;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, expandVariables: true }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          async useFactory(configService: ConfigService) {
            return {
              type: 'postgres',
              entities: [User],
              url: configService.getOrThrow('DATABASE_TEST_URL'),
              synchronize: true,
              dropSchema: true,
            };
          },
        }),
        UsersModule,
        AuthModule,
        IdempotentModule,
      ],
      providers: [
        {
          provide: APP_GUARD,
          useClass: AuthGuard,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: IdempotentInterceptor,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    usersService = app.get(UsersService);

    await app.init();

    user = await usersService.createUser({
      username: 'IvanChuvaev',
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('should sign up new user and return tokens', async () => {
    await usersService.deleteUser(user.id);
    return request(app.getHttpServer())
      .post('/auth/sign-up')
      .send({
        username: 'IvanChuvaev',
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        password: '123',
        roles: [Role.ADMIN],
        age: 26,
        description: 'description',
      })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toBeTypeOf('object');
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('refresh_token');
      });
  });

  it('should sign in existing user and return tokens', async () => {
    return request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        username: 'IvanChuvaev',
        password: '123',
      })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toBeTypeOf('object');
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('refresh_token');
      });
  });

  it('should generate new pair of tokens for refresh token', async () => {
    const { body: tokens } = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        username: 'IvanChuvaev',
        password: '123',
      });
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: tokens.refresh_token,
      })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toBeTypeOf('object');
        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('refresh_token');
      });
  });
});
