import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionGuard } from './permissions.guard.js';
import { Reflector } from '@nestjs/core';
import { User } from '../users/user.entity.js';
import { Role } from '../roles/role.enum.js';
import { Permission } from './permission.enum.js';

const mockedReflector = {
  getAllAndOverride: vi.fn(),
};

const mockedGetRequest = vi.fn(
  () =>
    ({
      user: Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: 'hashed-password',
        roles: [Role.ADMIN],
      }),
    }) as Record<string, unknown>,
);

const mockedContext = {
  getHandler: vi.fn(),
  getClass: vi.fn(),
  switchToHttp: vi.fn(() => ({ getRequest: mockedGetRequest })),
};

describe('AppController', () => {
  let permissionGuard: PermissionGuard;

  beforeEach(async () => {
    permissionGuard = new PermissionGuard(
      mockedReflector as unknown as Reflector,
    );
  });

  afterEach(() => {
    vitest.resetAllMocks();
  });

  it('should throw forbidden exception with no roles provided', async () => {
    mockedReflector.getAllAndOverride.mockReturnValue([]);
    try {
      await permissionGuard.canActivate(
        mockedContext as unknown as ExecutionContext,
      );
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
    }
  });

  it('should return true for admin role when user have admin role', async () => {
    mockedReflector.getAllAndOverride.mockReturnValue([
      Permission.USERS_EDIT,
      Permission.USERS_READ,
    ]);
    const result = await permissionGuard.canActivate(
      mockedContext as unknown as ExecutionContext,
    );
    expect(result).toBe(true);
  });

  it('should throw forbidden exception for partially absent permissions', async () => {
    mockedGetRequest.mockImplementation(() => ({
      user: Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: 'hashed-password',
        roles: [Role.CLIENT],
      }),
    }));
    mockedReflector.getAllAndOverride.mockReturnValue([
      Permission.USERS_EDIT,
      Permission.USERS_READ,
    ]);
    try {
      await permissionGuard.canActivate(
        mockedContext as unknown as ExecutionContext,
      );
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
    }
  });

  it('should return true when permissions are undefined', async () => {
    mockedReflector.getAllAndOverride.mockReturnValue(undefined);
    const result = await permissionGuard.canActivate(
      mockedContext as unknown as ExecutionContext,
    );
    expect(result).toBe(true);
  });

  it('should return true when request does not contain user', async () => {
    mockedGetRequest.mockImplementation(() => ({}));
    mockedReflector.getAllAndOverride.mockReturnValue([]);
    const result = await permissionGuard.canActivate(
      mockedContext as unknown as ExecutionContext,
    );
    expect(result).toBe(true);
  });
});
