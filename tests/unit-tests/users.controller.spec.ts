import { Test, TestingModule } from '@nestjs/testing';
import { RequestAfterAuth } from '../../src/modules/auth/types/auth.types.js';
import { UsersController } from '../../src/modules/users/users.controller.js';
import { UsersService } from '../../src/modules/users/users.service.js';
import { Role } from '../../src/common/authorization/roles/role.enum.js';
import { ForbiddenException } from '@nestjs/common';

const mockedUsersService = {
  getUserById: vitest.fn(),
  getUsers: vitest.fn(),
  createUser: vitest.fn(),
  updateUser: vitest.fn(),
  deleteUser: vitest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockedUsersService }],
    }).compile();

    controller = module.get(UsersController);
  });

  afterEach(() => {
    vitest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a user', async () => {
    const user = {
      id: 1,
      username: 'IvanChuvaev',
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      password: 'hashed-password',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    };
    mockedUsersService.createUser.mockResolvedValue(user);
    mockedUsersService.getUsers.mockResolvedValue([user]);

    await expect(
      controller.createUser({
        username: 'IvanChuvaev',
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        password: '123',
        roles: [Role.ADMIN],
        age: 26,
        description: 'description',
      }),
    ).resolves.toEqual(user);
    await expect(controller.getUsers()).resolves.toEqual([user]);
  });

  it('should return the current user', () => {
    const user = {
      username: 'IvanChuvaev',
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    };
    const request = { user } as unknown as RequestAfterAuth;

    expect(controller.getCurrentUser(request)).toEqual(user);
  });

  it('should update the current user', async () => {
    const user = {
      id: 1,
      username: 'DanilBeburishvilly',
      firstName: 'Danil',
      lastName: 'Beburishvilly',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    };
    const request = {
      user: { id: 1 },
    } as unknown as RequestAfterAuth;
    mockedUsersService.updateUser.mockResolvedValue(user);

    await expect(
      controller.updateCurrentUser(request, {
        username: 'DanilBeburishvilly',
        firstName: 'Danil',
        lastName: 'Beburishvilly',
        password: '123',
        roles: [Role.ADMIN],
        age: 26,
        description: 'description',
      }),
    ).resolves.toEqual(user);
  });

  it('should partially update the current user', async () => {
    const user = {
      username: 'DanilBeburishvilly',
      firstName: 'Danil',
      lastName: 'Beburishvilly',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    };
    const request = {
      user,
    } as unknown as RequestAfterAuth;
    mockedUsersService.updateUser.mockResolvedValue(user);

    await expect(
      controller.updateCurrentUserPartial(request, { firstName: 'Danil' }),
    ).resolves.toEqual(user);
  });

  it('should throw on attempt to delete yourself', async () => {
    const user = {
      id: 1,
      username: 'IvanChuvaev',
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      password: 'hashed-password',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    };
    const request = {
      user,
    } as unknown as RequestAfterAuth;
    mockedUsersService.updateUser.mockResolvedValue(user);
    try {
      await controller.deleteUser(1, request);
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect((error as ForbiddenException).message).toBe(
        'Cannot delete yourself',
      );
    }
  });
});
