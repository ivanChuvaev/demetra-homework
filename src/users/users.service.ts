import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';
import type { CreateUserDto, UpdateUserPartialDto } from './users.types.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async getUserById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        id,
      },
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: {
        username,
      },
    });
  }

  async getUsers(args: { offset?: number; limit?: number }): Promise<User[]> {
    return this.userRepository.find({ skip: args.offset, take: args.limit });
  }

  async createUser({ password, ...data }: CreateUserDto): Promise<User> {
    const foundUserByUsername = await this.getUserByUsername(data.username);
    if (foundUserByUsername) {
      throw new BadRequestException(
        `User with username ${data.username} is already exists.`,
      );
    }
    const user = new User();
    Object.assign(user, data, { password: await this.hashPassword(password) });
    await this.userRepository.save(user);
    return user;
  }

  async updateUser(
    id: number,
    { password, ...data }: UpdateUserPartialDto,
  ): Promise<User> {
    const foundUserById = await this.getUserById(id);
    if (!foundUserById) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    if (
      data.username !== undefined &&
      data.username !== foundUserById.username
    ) {
      const foundUserByNewUsername = await this.getUserByUsername(
        data.username,
      );
      if (foundUserByNewUsername) {
        throw new BadRequestException(
          `User with username ${data.username} is already exists.`,
        );
      }
    }
    Object.assign(foundUserById, data);
    if (password !== undefined) {
      Object.assign(foundUserById, {
        password: await this.hashPassword(password),
      });
    }
    await this.userRepository.save(foundUserById);
    return foundUserById;
  }

  async deleteUser(id: number): Promise<User> {
    const foundUserById = await this.getUserById(id);
    if (!foundUserById) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    await this.userRepository.remove(foundUserById);
    return foundUserById;
  }

  async softDeleteUser(id: number): Promise<User> {
    const foundUserById = await this.getUserById(id);
    if (!foundUserById) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    await this.userRepository.softRemove(foundUserById);
    return foundUserById;
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePasswordWithHash(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
