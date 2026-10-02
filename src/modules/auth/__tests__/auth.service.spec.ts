import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Token } from '../entities/token.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Role } from '../../../common/authorization/roles/role.enum.js';
import { DemetraNotFoundException } from '../../../common/demetra/demetra.exception.js';
import { TokenService } from '../token.service.js';
import { SignUpDto } from '../dto/auth.dto.js';

const mockedUserRepository = {
  findOne: vi.fn(),
  save: vi.fn(),
};

const mockedTokenRepository = {
  create: vi.fn((): Token => ({
    user_id: 1,
    active: true,
    token: 'test-token',
  })),
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
        TokenService,
        {
          provide: getRepositoryToken(User),
          useValue: mockedUserRepository,
        },
        {
          provide: getRepositoryToken(Token),
          useValue: mockedTokenRepository,
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
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('should fail sign in for non existing user', async () => {
    try {
      await authService.signIn({ username: 'IvanChuvaev', password: '123' });
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(DemetraNotFoundException);
      expect((error as DemetraNotFoundException).message).toBe(
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
    const { accessToken } = await authService.signIn({
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
    const signUpDto = {
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      username: 'IvanChuvaev',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    } satisfies SignUpDto;
    const createdUser: User = {
      ...signUpDto,
      id: 1,
      password: await usersService.hashPassword('123'),
      tokens: [],
    };
    mockedUserRepository.save.mockImplementation((user) =>
      Object.assign(user, createdUser),
    );
    mockedUserRepository.findOne.mockImplementation(() => null);
    const result = await authService.signUp(signUpDto);
    expect(result).toBeTypeOf('object');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
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
      tokens: [],
    } satisfies User);
    mockedUserRepository.findOne.mockReturnValue(user);
    mockedTokenRepository.create.mockReturnValue({
      user_id: 1,
      active: true,
      token: 'random-token',
    });
    const tokens = await authService.signIn({
      username: 'IvanChuvaev',
      password: '123',
    });
    mockedUserRepository.findOne.mockReturnValue(null);
    try {
      await authService.refreshTokens({ refreshToken: tokens.refreshToken });
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(DemetraNotFoundException);
      expect((error as DemetraNotFoundException).message).toBe(
        'Authorized user not found',
      );
    }
  });
});
