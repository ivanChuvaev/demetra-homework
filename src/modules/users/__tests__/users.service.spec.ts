import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service.js';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../entities/user.entity.js';
import { Role } from '../../../common/authorization/roles/role.enum.js';
import {
  DemetraBadRequestException,
  DemetraForbiddenException,
  DemetraNotFoundException,
} from '../../../common/demetra/demetra.exception.js';

const mockedUserRepository = {
  find: vitest.fn(),
  findOne: vitest.fn(),
  create: vitest.fn(),
  save: vitest.fn(),
  delete: vitest.fn(),
};

describe('UsersService', () => {
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockedUserRepository,
        },
      ],
    }).compile();
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    vitest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(usersService).toBeDefined();
  });

  it('should throw error on attempt to create user with existing username', async () => {
    mockedUserRepository.findOne.mockResolvedValue(
      Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: await usersService.hashPassword('123'),
        age: 26,
        description: 'description',
        roles: [Role.ADMIN],
        tokens: [],
      } satisfies User),
    );
    try {
      await usersService.createUser({
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: await usersService.hashPassword('123'),
        age: 26,
        description: 'description',
        roles: [Role.ADMIN],
      });
    } catch (error) {
      expect(error).toBeInstanceOf(DemetraBadRequestException);
    }
  });

  it('should update user', async () => {
    const user: User = Object.assign(new User(), {
      id: 1,
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      username: 'IvanChuvaev',
      age: 26,
      roles: [Role.ADMIN],
      password: await usersService.hashPassword('123'),
      description: 'description',
      tokens: [],
    } satisfies User);
    mockedUserRepository.findOne.mockImplementation(
      async (config: { where: { id?: number; username?: string } }) => {
        if (config.where.id === 1 || config.where.username === 'IvanChuvaev') {
          return user;
        }
        return null;
      },
    );
    mockedUserRepository.find.mockResolvedValue([user]);
    mockedUserRepository.save.mockImplementation(async (entity: User) => {
      expect(entity).toBeInstanceOf(User);
      expect(entity.id).toBe(1);
      expect(entity.firstName).toBe('Ivan');
      expect(entity.lastName).toBe('Chuvaev');
      expect(entity.username).toBe('DanilBeburishvilly');
      expect(
        await usersService.compareUserPasswordWithProvidedPassword(
          entity.id,
          '123',
        ),
      ).toBe(true);
      return entity;
    });
    await usersService.updateUser(1, {
      username: 'DanilBeburishvilly',
      password: '123',
    });
  });

  it('should throw error on attempt to update user with existing username', async () => {
    mockedUserRepository.find.mockResolvedValue([
      Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: await usersService.hashPassword('123'),
        description: 'description',
        age: 26,
        roles: [Role.ADMIN],
        tokens: [],
      } satisfies User),
      Object.assign(new User(), {
        id: 2,
        firstName: 'Danil',
        lastName: 'Beburishvilly',
        username: 'DanilBeburishvilly',
        password: await usersService.hashPassword('123'),
        description: 'description',
        age: 26,
        roles: [Role.ADMIN],
        tokens: [],
      } satisfies User),
    ]);
    mockedUserRepository.findOne.mockResolvedValue(
      Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: await usersService.hashPassword('123'),
        description: 'description',
        age: 26,
        roles: [Role.ADMIN],
        tokens: [],
      } satisfies User),
    );
    try {
      await usersService.updateUser(1, {
        username: 'DanilBeburishvilly',
      });
      throw new Error('should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(DemetraBadRequestException);
    }
  });

  it('should update username of user to the same username', async () => {
    mockedUserRepository.findOne.mockResolvedValue(
      Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: await usersService.hashPassword('123'),
        description: 'description',
        age: 26,
        roles: [Role.ADMIN],
        tokens: [],
      } satisfies User),
    );
    mockedUserRepository.find.mockResolvedValue([
      Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: await usersService.hashPassword('123'),
        description: 'description',
        age: 26,
        roles: [Role.ADMIN],
        tokens: [],
      } satisfies User),
    ]);
    await usersService.updateUser(1, { username: 'IvanChuvaev' });
  });

  it('should throw error on attempt to delete non existing user', async () => {
    mockedUserRepository.find.mockResolvedValue([]);
    mockedUserRepository.findOne.mockResolvedValue(null);
    try {
      await usersService.deleteUser({ userId: 1, currentUserId: 2 });
    } catch (error) {
      expect(error).toBeInstanceOf(DemetraNotFoundException);
    }
  });

  it('should throw on attempt to delete yourself', async () => {
    const user = Object.assign(new User(), {
      id: 1,
      username: 'IvanChuvaev',
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
      password: 'hashed-password',
      tokens: [],
    } satisfies User);
    mockedUserRepository.findOne.mockReturnValue(user);
    try {
      await usersService.softDeleteUser({ userId: 1, currentUserId: 1 });
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(DemetraForbiddenException);
      expect((error as DemetraForbiddenException).message).toBe(
        'Cannot delete yourself',
      );
    }
    try {
      await usersService.deleteUser({ userId: 1, currentUserId: 1 });
      throw new Error();
    } catch (error) {
      expect(error).toBeInstanceOf(DemetraForbiddenException);
      expect((error as DemetraForbiddenException).message).toBe(
        'Cannot delete yourself',
      );
    }
  });
});
