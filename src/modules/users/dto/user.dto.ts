import {
  createUserSchema,
  deleteUserSchema,
  getUsersSchema,
  updateCurrentUserPartialSchema,
  updateCurrentUserSchema,
  updateUserPartialSchema,
  updateUserSchema,
  userResponseSchema,
} from '../schemas/users.schemas.js';
import { createZodDto } from 'nestjs-zod';

export class CreateUserDto extends createZodDto(createUserSchema) {}
export class UpdateUserDto extends createZodDto(updateUserSchema) {}
export class UpdateUserPartialDto extends createZodDto(
  updateUserPartialSchema,
) {}
export class UpdateCurrentUserDto extends createZodDto(
  updateCurrentUserSchema,
) {}
export class UpdateCurrentUserPartialDto extends createZodDto(
  updateCurrentUserPartialSchema,
) {}
export class UserResponseDto extends createZodDto(userResponseSchema) {}
export class GetUsersDto extends createZodDto(getUsersSchema) {}
export class DeleteUserDto extends createZodDto(deleteUserSchema) {}
