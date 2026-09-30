import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/modules/users/users.service.js';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/modules/users/user.entity.js';
import { Role } from '../../src/common/authorization/roles/role.enum.js';

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

  it('should throw error on attempt to create user with existings username', async () => {
    mockedUserRepository.findOne.mockResolvedValue(
      Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: 'hashed-password',
        roles: [Role.ADMIN],
        age: 26,
        description: 'description',
      }),
    );
    try {
      await usersService.createUser({
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: '123',
        roles: [Role.ADMIN],
        age: 26,
        description: 'description',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
    }
  });

  it('should update user', async () => {
    mockedUserRepository.findOne.mockImplementation(
      async (config: { where: { id?: number; username?: string } }) => {
        if (config.where.id === 1 || config.where.username === 'IvanChuvaev') {
          return Object.assign(new User(), {
            id: 1,
            firstName: 'Ivan',
            lastName: 'Chuvaev',
            username: 'IvanChuvaev',
            password: await usersService.hashPassword('123'),
          });
        }
        return null;
      },
    );
    mockedUserRepository.find.mockResolvedValue([
      Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: await usersService.hashPassword('123'),
      }),
    ]);
    mockedUserRepository.save.mockImplementation(async (entity: User) => {
      expect(entity).toBeInstanceOf(User);
      expect(entity.id).toBe(1);
      expect(entity.firstName).toBe('Ivan');
      expect(entity.lastName).toBe('Chuvaev');
      expect(entity.username).toBe('DanilBeburishvilly');
      expect(
        await usersService.comparePasswordWithHash('123', entity.password),
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
      }),
      Object.assign(new User(), {
        id: 2,
        firstName: 'Danil',
        lastName: 'Beburishvilly',
        username: 'DanilBeburishvilly',
        password: await usersService.hashPassword('123'),
      }),
    ]);
    mockedUserRepository.findOne.mockResolvedValue(
      Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: await usersService.hashPassword('123'),
      }),
    );
    try {
      await usersService.updateUser(1, {
        username: 'DanilBeburishvilly',
      });
      throw new Error('should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
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
      }),
    );
    mockedUserRepository.find.mockResolvedValue([
      Object.assign(new User(), {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Chuvaev',
        username: 'IvanChuvaev',
        password: await usersService.hashPassword('123'),
      }),
    ]);
    await usersService.updateUser(1, { username: 'IvanChuvaev' });
  });

  it('should throw error on attempt to delete non existing user', async () => {
    mockedUserRepository.find.mockResolvedValue([]);
    mockedUserRepository.findOne.mockResolvedValue(null);
    try {
      await usersService.deleteUser(1);
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
    }
  });

  it('should check that password is saved as hash', async () => {
    mockedUserRepository.findOne.mockResolvedValue(null);
    mockedUserRepository.save.mockImplementation(async (entity: User) => {
      expect(
        await usersService.comparePasswordWithHash('123', entity.password),
      ).toBe(true);
      return entity;
    });
    await usersService.createUser({
      firstName: 'Ivan',
      lastName: 'Chuvaev',
      username: 'IvanChuvaev',
      password: '123',
      roles: [Role.ADMIN],
      age: 26,
      description: 'description',
    });
  });
});
