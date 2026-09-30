import z from 'zod';
import {
  createUserSchema,
  updateCurrentUserPartialSchema,
  updateCurrentUserSchema,
  updateUserPartialSchema,
  updateUserSchema,
} from './users.schemas.js';

export type CreateUserDto = z.infer<typeof createUserSchema>;
export type UpdateUserDto = z.infer<typeof updateUserSchema>;
export type UpdateUserPartialDto = z.infer<typeof updateUserPartialSchema>;
export type UpdateCurrentUserDto = z.infer<typeof updateCurrentUserSchema>;
export type UpdateCurrentUserPartialDto = z.infer<
  typeof updateCurrentUserPartialSchema
>;
