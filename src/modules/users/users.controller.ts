import {
  Body,
  Controller,
  Delete,
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
import type { AuthorizedRequest } from '../auth/types/auth.types.js';
import { UsersService } from './users.service.js';
import { Idempotent } from '../../common/idempotent/idempotent.decorator.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Permissions } from '../../common/authorization/decorators/permissions.decorator.js';
import { Permission } from '../../common/authorization/permissions/permission.enum.js';
import {
  CreateUserDto,
  GetUsersDto,
  UpdateCurrentUserDto,
  UpdateCurrentUserPartialDto,
  UpdateUserDto,
  UpdateUserPartialDto,
  UserResponseDto,
} from './dto/user.dto.js';
import { PaginatedResponse } from "../../common/types/paginated-response.type.js";

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getCurrentUser(@Req() request: AuthorizedRequest): UserResponseDto {
    return request.user;
  }

  @Put('me')
  async updateCurrentUser(
    @Req() request: AuthorizedRequest,
    @Body() body: UpdateCurrentUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(request.user.id, body);
  }

  @Patch('me')
  async updateCurrentUserPartial(
    @Req() request: AuthorizedRequest,
    @Body() body: UpdateCurrentUserPartialDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(request.user.id, body);
  }

  @Permissions([Permission.USERS_READ])
  @Get(':id')
  async getUser(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    const foundUser = await this.usersService.getUserById(id);
    if (!foundUser) {
      throw new NotFoundException();
    }
    return foundUser;
  }

  @Permissions([Permission.USERS_READ])
  @Get()
  async getUsers(
    @Query() query: GetUsersDto,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    return this.usersService.getUsers(query);
  }

  @Permissions([Permission.USERS_EDIT])
  @Idempotent()
  @Post()
  async createUser(@Body() body: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.createUser(body);
  }

  @Permissions([Permission.USERS_EDIT])
  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, body);
  }

  @Permissions([Permission.USERS_EDIT])
  @Patch(':id')
  async updateUserPartial(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserPartialDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, body);
  }

  @Permissions([Permission.USERS_EDIT])
  @Idempotent()
  @Delete(':id')
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthorizedRequest,
  ): Promise<void> {
    return this.usersService.softDeleteUser({
      userId: id,
      currentUserId: request.user.id,
    });
  }
}
