import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizedRequest } from '../../auth/types/auth.types.js';
import { UsersController } from '../users.controller.js';
import { UsersService } from '../users.service.js';
import { Role } from '../../../common/authorization/roles/role.enum.js';
import { UserResponseDto } from '../dto/user.dto.js';
import { DemetraForbiddenException } from '../../../common/demetra/demetra.exception.js';

const mockedUsersService = {
  getUserById: vitest.fn(),
  getUsers: vitest.fn(),
  createUser: vitest.fn(),
  updateUser: vitest.fn(),
  deleteUser: vitest.fn(),
  softDeleteUser: vitest.fn(),
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
    await expect(controller.getUsers({})).resolves.toEqual([user]);
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
    const request = { user } as unknown as AuthorizedRequest;

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
    } as unknown as AuthorizedRequest;
    mockedUsersService.updateUser.mockResolvedValue(user);

    await expect(
      controller.updateCurrentUser(request, {
        username: 'DanilBeburishvilly',
        firstName: 'Danil',
        lastName: 'Beburishvilly',
        password: '123',
        age: 26,
        description: 'description',
      }),
    ).resolves.toEqual(user);
  });

  it('should partially update the current user', async () => {
    const user: UserResponseDto = {
      id: 1,
      username: 'DanilBeburishvilly',
      firstName: 'Danil',
      lastName: 'Beburishvilly',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    };
    const request = {
      user,
    } as unknown as AuthorizedRequest;
    mockedUsersService.updateUser.mockResolvedValue(user);

    await expect(
      controller.updateCurrentUserPartial(request, { firstName: 'Danil' }),
    ).resolves.toEqual(user);
  });
});
