import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service.js';
import { Role } from '../common/authorization/roles/role.enum.js';
import { AppModule } from '../app.module.js';
import { UserResponseDto } from '../modules/users/dto/user.dto.js';
import request from 'supertest';
import {
  SignInDto,
  SignUpDto,
  TokenResponseDto,
} from '../modules/auth/dto/auth.dto.js';

describe('Auth (integration)', () => {
  let app: INestApplication;
  let user: UserResponseDto;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
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
    await usersService.deleteUser({ userId: user.id, currentUserId: 10 });
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
      } satisfies SignUpDto)
      .expect(HttpStatus.OK)
      .expect((response) => {
        const body = response.body as TokenResponseDto;
        expect(body).toBeTypeOf('object');
        expect(body.accessToken).toBeDefined();
        const cookies = response.headers['set-cookie'] as unknown as string[];
        expect(cookies).toBeInstanceOf(Array);
        const matched = cookies.find((item) => item.startsWith('refreshToken'));
        expect(matched).toBeDefined();
      });
  });

  it('should sign in existing user and return tokens', async () => {
    return request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        username: 'IvanChuvaev',
        password: '123',
      } satisfies SignInDto)
      .expect(HttpStatus.OK)
      .expect((response) => {
        const body = response.body as TokenResponseDto;
        expect(body).toBeTypeOf('object');
        expect(body.accessToken).toBeDefined();
        const cookies = response.headers['set-cookie'] as unknown as string[];
        expect(cookies).toBeInstanceOf(Array);
        const matched = cookies.find((item) => item.startsWith('refreshToken'));
        expect(matched).toBeDefined();
      });
  });

  it('should generate new pair of tokens for refresh token', async () => {
    const singInResponse = await request(app.getHttpServer())
      .post('/auth/sign-in')
      .send({
        username: 'IvanChuvaev',
        password: '123',
      });
    const cookies = singInResponse.headers['set-cookie'] as unknown as string[];
    return request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookies)
      .expect(HttpStatus.OK)
      .expect((response) => {
        const body = response.body as TokenResponseDto;
        expect(body).toBeTypeOf('object');
        expect(body.accessToken).toBeDefined();
        const cookies = response.headers['set-cookie'] as unknown as string[];
        expect(cookies).toBeInstanceOf(Array);
        const matched = cookies.find((item) => item.startsWith('refreshToken'));
        expect(matched).toBeDefined();
      });
  });
});
