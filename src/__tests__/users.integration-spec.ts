import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  HttpStatus,
  INestApplication,
} from '@nestjs/common';
import { UsersService } from '../modules/users/users.service.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { Role } from '../common/authorization/roles/role.enum.js';
import { QueryFailedError } from 'typeorm';
import { AppModule } from '../app.module.js';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserPartialDto,
  UserResponseDto,
} from '../modules/users/dto/user.dto.js';
import request from 'supertest';
import { PaginatedResponse } from "../common/types/paginated-response.type.js";

describe('Users (integration)', () => {
  let app: INestApplication;
  let usersService: UsersService;
  let authService: AuthService;
  let prepared: {
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  };

  beforeEach(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
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
      } satisfies UpdateUserDto)
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .expect(HttpStatus.OK)
      .expect((response) => {
        const body = response.body as UserResponseDto;
        expect(body).toBeTypeOf('object');
        expect(body.username).toBe('DanilBeburishvilly');
        expect(body.firstName).toBe('Danil');
        expect(body.lastName).toBe('Beburishvilly');
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
      } satisfies UpdateUserPartialDto)
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
      } satisfies UpdateUserPartialDto)
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
    const payload: CreateUserDto = {
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
      .expect((response) => {
        const body = response.body as UserResponseDto;
        expect(body).toBeTypeOf('object');
        expect(body.username).toBe(payload.username);
        expect(body.firstName).toBe(payload.firstName);
        expect(body.lastName).toBe(payload.lastName);
        expect(body.roles).toEqual(payload.roles);
        expect(body.age).toBe(payload.age);
        expect(body.description).toBe(payload.description);
      });
  });

  it('should create user only once', async () => {
    const payload: CreateUserDto = {
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
      .send(payload)
      .set('Idempotency-Key', 'random-key')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .then((res) => res.body as UserResponseDto);

    const subusers: UserResponseDto[] = [];

    for (let i = 0; i < 10; i++) {
      subusers.push(
        await request(app.getHttpServer())
          .post('/users')
          .send(payload)
          .set('Idempotency-Key', 'random-key')
          .set('Authorization', `Bearer ${prepared.accessToken}`)
          .then((res) => res.body as UserResponseDto),
      );
    }

    for (const subuser of subusers) {
      expect(subuser).toEqual(mainUser);
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
      } satisfies CreateUserDto)
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
      } satisfies CreateUserDto)
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
        .set('Idempotency-Key', 'random-key')
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
      .query({ page: 2, limit: 1 })
      .expect(HttpStatus.OK)
      .expect((response) => {
        const body = response.body as PaginatedResponse<UserResponseDto>;
        expect(body.items).toEqual([user1]);
        expect(body.total).toBe(3);
      });

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .query({ page: 3, limit: 1 })
      .expect(HttpStatus.OK)
      .expect((response) => {
        const body = response.body as PaginatedResponse<UserResponseDto>;
        expect(body.items).toEqual([user2]);
        expect(body.total).toBe(3);
      });
  });

  it('should soft delete user and unable to create new one with the same username', async () => {
    const user = await usersService.createUser({
      username: 'DanilBeburishvilly',
      firstName: 'Danil',
      lastName: 'Beburishvilly',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });
    await request(app.getHttpServer())
      .delete(`/users/${user.id}`)
      .set('Idempotency-Key', 'random-key')
      .set('Authorization', `Bearer ${prepared.accessToken}`)
      .expect(HttpStatus.OK);
    try {
      await usersService.createUser({
        username: 'DanilBeburishvilly',
        firstName: 'Danil',
        lastName: 'Beburishvilly',
        password: '123',
        roles: [Role.ADMIN],
        age: 26,
        description: 'description',
      });
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(QueryFailedError);
    }
  });

  it('should return forbidden status when user with role client tries to create another user', async () => {
    const client = await usersService.createUser({
      username: 'DanilBeburishvilly',
      firstName: 'Danil',
      lastName: 'Beburishvilly',
      password: '123',
      roles: [Role.CLIENT],
      age: 26,
      description: 'description',
    });

    const tokens = await authService.signIn({
      username: client.username,
      password: '123',
    });

    await request(app.getHttpServer())
      .post('/users')
      .set('Idempotency-Key', 'random-key')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({
        username: 'AlexeyStreletsky',
        firstName: 'Alexey',
        lastName: 'Streletsky',
        password: '123',
        roles: [Role.CLIENT],
        age: 26,
        description: 'description',
      } satisfies CreateUserDto)
      .expect(HttpStatus.FORBIDDEN);
  });
});
