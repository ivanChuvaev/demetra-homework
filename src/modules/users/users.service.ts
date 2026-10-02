import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import {
  CreateUserDto,
  DeleteUserDto,
  GetUsersDto,
  UpdateUserPartialDto,
  UserResponseDto,
} from './dto/user.dto.js';
import { userResponseSchema } from './schemas/users.schemas.js';
import {
  DemetraBadRequestException,
  DemetraForbiddenException,
  DemetraNotFoundException,
} from '../../common/demetra/demetra.exception.js';
import { PaginatedResponse } from "../../common/types/paginated-response.type.js";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async getUserById(id: number): Promise<UserResponseDto | null> {
    const foundUser = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    if (!foundUser) {
      return null;
    }
    return userResponseSchema.parse(foundUser);
  }

  async getUserByUsername(username: string): Promise<UserResponseDto | null> {
    const foundUser = await this.userRepository.findOne({
      where: {
        username,
      },
    });
    if (!foundUser) {
      return null;
    }
    return userResponseSchema.parse(foundUser);
  }

  async getUsers(
    dto?: GetUsersDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    const page = dto?.page ?? 1;
    const limit = dto?.limit ?? 50;
    const [foundUsers, count] = await this.userRepository.findAndCount({
      skip: Math.max(0, page - 1) * limit,
      take: limit,
    });
    return {
      items: foundUsers.map((foundUser) => userResponseSchema.parse(foundUser)),
      total: count,
    };
  }

  async createUser({
    password,
    ...data
  }: CreateUserDto): Promise<UserResponseDto> {
    const foundUserByUsername = await this.userRepository.findOne({
      where: {
        username: data.username,
      },
    });
    if (foundUserByUsername) {
      throw new DemetraBadRequestException(
        `User with username ${data.username} is already exists.`,
      );
    }
    const user = new User();
    Object.assign(user, data, { password: await this.hashPassword(password) });
    await this.userRepository.save(user);
    return userResponseSchema.parse(user);
  }

  async updateUser(
    id: number,
    { password, ...data }: UpdateUserPartialDto,
  ): Promise<UserResponseDto> {
    const foundUserById = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    if (!foundUserById) {
      throw new DemetraNotFoundException(`User with ID ${id} not found.`);
    }
    if (
      data.username !== undefined &&
      data.username !== foundUserById.username
    ) {
      const foundUserByNewUsername = await this.userRepository.findOne({
        where: {
          username: data.username,
        },
      });
      if (foundUserByNewUsername) {
        throw new DemetraBadRequestException(
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
    return userResponseSchema.parse(foundUserById);
  }

  async deleteUser(dto: DeleteUserDto): Promise<void> {
    if (dto.userId === dto.currentUserId) {
      throw new DemetraForbiddenException('Cannot delete yourself');
    }
    const foundUserById = await this.userRepository.findOne({
      where: {
        id: dto.userId,
      },
    });
    if (!foundUserById) {
      throw new DemetraNotFoundException(
        `User with ID ${dto.userId} not found.`,
      );
    }
    await this.userRepository.remove(foundUserById);
  }

  async softDeleteUser(dto: DeleteUserDto): Promise<void> {
    if (dto.userId === dto.currentUserId) {
      throw new DemetraForbiddenException('Cannot delete yourself');
    }
    const foundUserById = await this.userRepository.findOne({
      where: {
        id: dto.userId,
      },
    });
    if (!foundUserById) {
      throw new DemetraNotFoundException(
        `User with ID ${dto.userId} not found.`,
      );
    }
    await this.userRepository.softRemove(foundUserById);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async compareUserPasswordWithProvidedPassword(
    userId: number,
    password: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) {
      throw new DemetraNotFoundException(`User with id ${userId} not found`);
    }
    return bcrypt.compare(password, user.password);
  }
}
