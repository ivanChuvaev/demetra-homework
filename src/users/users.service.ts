import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity.js';
import z from 'zod';
import { createUserSchema, updateUserPartialSchema } from './users.schemas.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async getUserById(id: number) {
    return this.userRepository.findOne({
      where: {
        id,
      },
    });
  }

  async getUserByUsername(username: string) {
    return this.userRepository.findOne({
      where: {
        username,
      },
    });
  }

  async getUsers(args: { offset?: number; limit?: number }) {
    return this.userRepository.find({ skip: args.offset, take: args.limit });
  }

  async createUser({ password, ...data }: z.infer<typeof createUserSchema>) {
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
    { password, ...data }: z.infer<typeof updateUserPartialSchema>,
  ) {
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

  async deleteUser(id: number) {
    const foundUserById = await this.getUserById(id);
    if (!foundUserById) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }
    await this.userRepository.remove(foundUserById);
    return foundUserById;
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  async comparePasswordWithHash(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
