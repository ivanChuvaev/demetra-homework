import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import {
  createUserSchema,
  updateCurrentUserPartialSchema,
  updateCurrentUserSchema,
  updateUserPartialSchema,
  updateUserSchema,
} from './schemas/users.schemas.js';
import type { RequestAfterAuth } from '../auth/types/auth.types.js';
import { Idempotent } from '../../common/idempotent/idempotent.decorator.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from '../../common/authorization/decorators/permissions.decorator.js';
import { Permission } from '../../common/authorization/permissions/permission.enum.js';
import type {
  CreateUserDto,
  UpdateCurrentUserDto,
  UpdateCurrentUserPartialDto,
  UpdateUserDto,
  UpdateUserPartialDto,
} from './types/users.types.js';
import { User } from './user.entity.js';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getCurrentUser(@Req() request: RequestAfterAuth): User {
    return request.user;
  }

  @Put('me')
  async updateCurrentUser(
    @Req() request: RequestAfterAuth,
    @Body({ schema: updateCurrentUserSchema })
    body: UpdateCurrentUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(request.user.id, body);
  }

  @Patch('me')
  async updateCurrentUserPartial(
    @Req() request: RequestAfterAuth,
    @Body({ schema: updateCurrentUserPartialSchema })
    body: UpdateCurrentUserPartialDto,
  ): Promise<User> {
    return this.usersService.updateUser(request.user.id, body);
  }

  @Permissions([Permission.USERS_READ])
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const foundUser = await this.usersService.getUserById(id);
    if (!foundUser) {
      throw new NotFoundException();
    }
    return foundUser;
  }

  @Permissions([Permission.USERS_READ])
  @Get()
  async getUsers(
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 50,
  ): Promise<User[]> {
    return this.usersService.getUsers({ offset, limit });
  }

  @Idempotent()
  @Post()
  async createUser(
    @Body({ schema: createUserSchema })
    body: CreateUserDto,
  ): Promise<User> {
    return this.usersService.createUser(body);
  }

  @Permissions([Permission.USERS_EDIT])
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body({ schema: updateUserSchema })
    body: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(id, body);
  }

  @Permissions([Permission.USERS_EDIT])
  @Patch(':id')
  async updateUserPartial(
    @Param('id', ParseIntPipe) id: number,
    @Body({ schema: updateUserPartialSchema })
    body: UpdateUserPartialDto,
  ): Promise<User> {
    return this.usersService.updateUser(id, body);
  }

  @Permissions([Permission.USERS_EDIT])
  @Idempotent()
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: RequestAfterAuth,
  ): Promise<User> {
    if (request.user.id === id) {
      throw new ForbiddenException('Cannot delete yourself');
    }
    return this.usersService.softDeleteUser(id);
  }
}
