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
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import {
  createUserSchema,
  updateCurrentUserPartialSchema,
  updateCurrentUserSchema,
  updateUserPartialSchema,
  updateUserSchema,
} from './users.schemas.js';
import type { RequestAfterAuth } from '../auth/auth.types.js';
import { Idempotent } from '../idempotent/decorators/idempotent.decorator.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from '../permissions/decorators/permissions.decorator.js';
import { Permission } from '../permissions/permission.enum.js';
import z from 'zod';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  getCurrentUser(@Req() request: RequestAfterAuth) {
    return request.user;
  }

  @Put('me')
  async updateCurrentUser(
    @Req() request: RequestAfterAuth,
    @Body({ schema: updateCurrentUserSchema })
    body: z.infer<typeof updateCurrentUserSchema>,
  ) {
    return this.usersService.updateUser(request.user.id, body);
  }

  @Patch('me')
  async updateCurrentUserPartial(
    @Req() request: RequestAfterAuth,
    @Body({ schema: updateCurrentUserPartialSchema })
    body: z.infer<typeof updateCurrentUserPartialSchema>,
  ) {
    return this.usersService.updateUser(request.user.id, body);
  }

  @Permissions([Permission.USERS_READ])
  @Get(':id')
  async getUser(@Param('id', ParseIntPipe) id: number) {
    const foundUser = await this.usersService.getUserById(id);
    if (!foundUser) {
      throw new NotFoundException();
    }
    return foundUser;
  }

  @Permissions([Permission.USERS_READ])
  @Get()
  async getUsers() {
    return this.usersService.getUsers();
  }

  @Idempotent()
  @Post()
  async createUser(
    @Body({ schema: createUserSchema })
    body: z.infer<typeof createUserSchema>,
  ) {
    return this.usersService.createUser(body);
  }

  @Permissions([Permission.USERS_EDIT])
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body({ schema: updateUserSchema })
    body: z.infer<typeof updateUserSchema>,
  ) {
    return this.usersService.updateUser(id, body);
  }

  @Permissions([Permission.USERS_EDIT])
  @Patch(':id')
  async updateUserPartial(
    @Param('id', ParseIntPipe) id: number,
    @Body({ schema: updateUserPartialSchema })
    body: z.infer<typeof updateUserPartialSchema>,
  ) {
    return this.usersService.updateUser(id, body);
  }

  @Permissions([Permission.USERS_EDIT])
  @Idempotent()
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: RequestAfterAuth,
  ) {
    if (request.user.id === id) {
      throw new ForbiddenException('Cannot delete yourself');
    }
    return this.usersService.softDeleteUser(id);
  }
}
