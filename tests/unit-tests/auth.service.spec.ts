import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from '../../src/modules/users/users.service.js';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/modules/users/user.entity.js';
import { Role } from '../../src/common/authorization/roles/role.enum.js';

const mockedUserRepository = {
  findOne: vi.fn(),
  save: vi.fn(),
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          global: true,
          secret: 'test-secret',
        }),
      ],
      providers: [
        AuthService,
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockedUserRepository,
        },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    vitest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should successfully sign in', async () => {
    const existingUser = Object.assign(new User(), {
      id: 1,
      username: 'IvanChuvaev',
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      password: await usersService.hashPassword('123'),
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });
    mockedUserRepository.findOne.mockImplementation(() => existingUser);
    const result = await authService.signIn({
      username: 'IvanChuvaev',
      password: '123',
    });
    expect(result).toBeTypeOf('object');
    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
  });

  it('should fail sign in for non existing user', async () => {
    try {
      await authService.signIn({ username: 'IvanChuvaev', password: '123' });
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).message).toBe(
        'User with username: "IvanChuvaev" not found',
      );
    }
  });

  it('should sign in and extract user from token', async () => {
    const existingUser = Object.assign(new User(), {
      id: 1,
      username: 'IvanChuvaev',
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      password: await usersService.hashPassword('123'),
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });
    mockedUserRepository.findOne.mockImplementation(() => existingUser);
    const { access_token: accessToken } = await authService.signIn({
      username: 'IvanChuvaev',
      password: '123',
    });
    mockedUserRepository.findOne.mockReset();
    await authService.extractUserFromToken(accessToken);
    expect(mockedUserRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('should sign up, create user and return tokens', async () => {
    const payloadUser = {
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      username: 'IvanChuvaev',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    };
    const createdUser = {
      ...payloadUser,
      password: await usersService.hashPassword('123'),
    };
    mockedUserRepository.save.mockReturnValue(createdUser);
    mockedUserRepository.findOne.mockImplementation(() => null);
    const result = await authService.signUp(payloadUser);
    expect(result).toBeTypeOf('object');
    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
  });

  it('should throw unauthorized error on attempt to refresh tokens by providing invalid refresh token', async () => {
    try {
      await authService.refreshTokens({ refreshToken: 'invalid-token' });
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).message).toBe(
        'JWT token did not pass verification',
      );
    }
  });

  it('should throw unauthorized error on attempt to refresh tokens by providing refresh token with non-existing user', async () => {
    const user = Object.assign(new User(), {
      id: 1,
      username: 'IvanChuvaev',
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      password: await usersService.hashPassword('123'),
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });
    mockedUserRepository.findOne.mockReturnValue(user);
    const tokens = await authService.signIn({
      username: 'IvanChuvaev',
      password: '123',
    });
    mockedUserRepository.findOne.mockReturnValue(null);
    try {
      await authService.refreshTokens({ refreshToken: tokens.refresh_token });
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).message).toBe(
        'Authorized user not found',
      );
    }
  });
});
