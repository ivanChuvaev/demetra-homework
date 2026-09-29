import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import { UsersService } from '../src/users/users.service.js';
import { AuthService } from '../src/auth/auth.service.js';
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

describe('Users (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let authService: AuthService;
  let prepared: { user: User; accessToken: string; refreshToken: string };

  const extractComparablePart = (
    user: Omit<User, 'id' | 'password'> & { id?: number; password?: string },
  ) => {
    const copy = Object.assign({}, user) as Record<string, unknown>;
    delete copy['id'];
    delete copy['password'];
    return copy as Omit<User, 'id' | 'password'>;
  };

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
    authService = app.get(AuthService);

    await app.init();

    const createdUser = await usersService.createUser({
      username: 'IvanChuvaev',
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });

    const tokens = await authService.signIn({
      username: 'IvanChuvaev',
      password: '123',
    });

    prepared = {
      user: createdUser,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return current user', async () => {
    return request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .expect(HttpStatus.OK)
      .expect(Object.assign({}, prepared.user));
  });

  it('should update current user', async () => {
    return request(app.getHttpServer())
      .put('/users/me')
      .send({
        username: 'DanilBeburishvilly',
        firstName: 'Danil',
        lastName: 'Beburishvilly',
        password: '123',
        roles: [Role.ADMIN],
        age: 26,
        description: 'description',
      })
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toBeTypeOf('object');
        expect(response.body.username).toBe('DanilBeburishvilly');
        expect(response.body.firstName).toBe('Danil');
        expect(response.body.lastName).toBe('Beburishvilly');
      });
  });

  it('should fail on update current user', async () => {
    await usersService.createUser({
      username: 'DanilBeburishvilly',
      firstName: 'Danil',
      lastName: 'Beburishvilly',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });
    return request(app.getHttpServer())
      .put('/users/me')
      .send({
        username: 'DanilBeburishvilly',
      })
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .expect(HttpStatus.BAD_REQUEST)
      .catch((reason) => {
        expect(reason).toBeInstanceOf(BadRequestException);
      });
  });

  it('should update current user partially', async () => {
    return request(app.getHttpServer())
      .patch('/users/me')
      .send({
        username: 'DanilBeburishvilly',
      })
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toEqual({
          ...prepared.user,
          username: 'DanilBeburishvilly',
        });
      });
  });

  it('should fetch all users', async () => {
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .expect(HttpStatus.OK);
  });

  it('should fetch user by ID', async () => {
    return request(app.getHttpServer())
      .get('/users/10123513')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .expect(HttpStatus.NOT_FOUND);
  });

  it('should create user', async () => {
    const payload = {
      username: 'DanilBeburishvilly',
      firstName: 'Danil',
      lastName: 'Beburishvilly',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    };
    return request(app.getHttpServer())
      .post('/users')
      .send(payload)
      .set('Idempotency-Key', 'random-key')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .expect(HttpStatus.CREATED)
      .expect((res) => {
        expect(res.body).toBeTypeOf('object');
        expect(extractComparablePart(res.body)).toEqual(
          extractComparablePart(payload),
        );
      });
  });

  it('should create user only once', async () => {
    const createUserPayload = {
      username: 'DanilBeburishvilly',
      firstName: 'Danil',
      lastName: 'Beburishvilly',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    };

    const mainUser = await request(app.getHttpServer())
      .post('/users')
      .send(createUserPayload)
      .set('Idempotency-Key', 'random-key')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .then((res) => res.body as User);

    const subusers: User[] = [];

    for (let i = 0; i < 10; i++) {
      subusers.push(
        await request(app.getHttpServer())
          .post('/users')
          .send(createUserPayload)
          .set('Idempotency-Key', 'random-key')
          .set('Authorization', `Bearer ${prepared.accessToken}`)
          .then((res) => res.body),
      );
    }

    for (const subuser of subusers) {
      expect(extractComparablePart(subuser)).toEqual(
        extractComparablePart(mainUser),
      );
    }
  });

  it('should throw error on attempt to create user with existing username', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'DanilBeburishvilly',
        firstName: 'Danil',
        lastName: 'Beburishvilly',
        password: '123',
        roles: [Role.ADMIN],
        age: 26,
        description: 'description',
      })
      .set('Idempotency-Key', 'random-key-1')
      .set('Authorization', `Bearer ${prepared.accessToken}`);

    await request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'DanilBeburishvilly',
        firstName: 'Alexey',
        lastName: 'Streletsky',
        password: '123',
        roles: [Role.ADMIN],
        age: 26,
        description: 'description',
      })
      .set('Idempotency-Key', 'random-key-2')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it('should delete user only once', async () => {
    const user = await usersService.createUser({
      username: 'DanilBeburishvilly',
      firstName: 'Danil',
      lastName: 'Beburishvilly',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });
    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .set('Idempotency-Key', 'random-key-2')
        .set('Authorization', `Bearer ${prepared.accessToken}`)
        .expect(HttpStatus.OK);
    }
  });

  it('should fetch paginated users', async () => {
    const user1 = await usersService.createUser({
      username: 'DanilBeburishvilly',
      firstName: 'Danil',
      lastName: 'Beburishvilly',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });
    const user2 = await usersService.createUser({
      username: 'IbragimPostomon',
      firstName: 'Ibragim',
      lastName: 'Postomon',
      password: '123',
      roles: [Role.CLIENT],
      age: 28,
      description: 'description',
    });
    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .query({ offset: 1, limit: 1 })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toEqual([user1]);
      });

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .query({ offset: 2, limit: 1 })
      .expect(HttpStatus.OK)
      .expect((response) => {
        expect(response.body).toEqual([user2]);
      });
  });
});
