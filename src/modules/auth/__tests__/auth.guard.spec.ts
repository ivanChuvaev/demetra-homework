import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '../guards/auth.guard.js';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../users/users.service.js';
import { AuthJwtPayload } from '../types/auth.types.js';
import { User } from '../../users/entities/user.entity.js';
import { Role } from '../../../common/authorization/roles/role.enum.js';
import {
  DemetraInvalidValueException,
  DemetraNotFoundException,
} from '../../../common/demetra/demetra.exception.js';

const mockedUsersService = {
  getUserById: vi.fn(),
};

const mockedReflector = {
  getAllAndOverride: vi.fn(() => false),
};

const mockedGetRequest = vi.fn(() => ({
  headers: {
    authorization: 'Bearer random-token',
  } as Record<string, unknown>,
}));

const mockedContext = {
  getHandler: vi.fn(),
  getClass: vi.fn(),
  switchToHttp: vi.fn(() => ({ getRequest: mockedGetRequest })),
};

describe('AppController', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    jwtService = new JwtService({
      secret: 'test-secret',
    });
    authGuard = new AuthGuard(
      jwtService,
      mockedUsersService as unknown as UsersService,
      mockedReflector as unknown as Reflector,
    );
  });

  afterEach(() => {
    vitest.resetAllMocks();
  });

  it('should be defined', async () => {
    expect(authGuard).toBeDefined();
  });

  it('should return true when called on public', async () => {
    mockedReflector.getAllAndOverride.mockReturnValue(true);
    const result = await authGuard.canActivate(
      mockedContext as unknown as ExecutionContext,
    );
    expect(result).toBe(true);
  });

  it('should throw unauthorized error when token is not provided in request headers', async () => {
    mockedGetRequest.mockReturnValue({ headers: {} });
    try {
      await authGuard.canActivate(mockedContext as unknown as ExecutionContext);
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(DemetraInvalidValueException);
      expect((error as DemetraInvalidValueException).message).toBe(
        'Token is not provided',
      );
    }
  });

  it('should throw unauthorized error when token is invalid', async () => {
    try {
      await authGuard.canActivate(mockedContext as unknown as ExecutionContext);
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(DemetraInvalidValueException);
      expect((error as DemetraInvalidValueException).message).toBe(
        'Token did not pass verification',
      );
    }
  });

  it('should throw unauthorized error when user extracted from token is not found in database', async () => {
    const payload: AuthJwtPayload = {
      sub: 1,
      username: 'IvanChuvaev',
    };
    const token = await jwtService.signAsync(payload);
    mockedGetRequest.mockImplementation(() => ({
      headers: {
        authorization: `Bearer ${token}`,
      },
    }));
    try {
      await authGuard.canActivate(mockedContext as unknown as ExecutionContext);
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(DemetraNotFoundException);
      expect((error as DemetraNotFoundException).message).toBe(
        'Authorized user not found',
      );
    }
  });

  it('should insert user into request and return true', async () => {
    const user = Object.assign(new User(), {
      id: 1,
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      username: 'IvanChuvaev',
      password: 'hashed-password',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });
    const payload: AuthJwtPayload = {
      sub: 1,
      username: 'IvanChuvaev',
    };
    const token = await jwtService.signAsync(payload);
    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };
    mockedGetRequest.mockImplementation(() => request);
    mockedUsersService.getUserById.mockReturnValue(user);
    await authGuard.canActivate(mockedContext as unknown as ExecutionContext);
    expect(request).toHaveProperty('user');
    expect((request as typeof request & { user: User }).user).toBe(user);
  });
});
