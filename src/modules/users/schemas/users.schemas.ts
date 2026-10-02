import { Role } from '../../../common/authorization/roles/role.enum.js';
import z from 'zod';

export const createUserSchema = z.object({
  username: z.string().nonempty().min(2).max(50),
  firstName: z.string().nonempty().max(256),
  lastName: z.string().nonempty().max(256),
  password: z.string().nonempty(),
  roles: z.array(z.enum(Role)).optional(),
  age: z.number(),
  description: z.string().optional(),
});
export const updateUserSchema = createUserSchema;
export const updateUserPartialSchema = updateUserSchema.partial();
export const updateCurrentUserSchema = updateUserSchema.omit({
  roles: true,
});
export const updateCurrentUserPartialSchema = updateCurrentUserSchema.partial();
export const userResponseSchema = z.object({
  id: z.number(),
  username: z.string().nonempty().min(2).max(50),
  firstName: z.string().nonempty().max(256),
  lastName: z.string().nonempty().max(256),
  roles: z.array(z.enum(Role)).optional(),
  age: z.number(),
  description: z.string().optional(),
});
export const getUsersSchema = z.object({
  page: z.coerce.number().positive().optional(),
  limit: z.coerce.number().positive().optional(),
});
export const deleteUserSchema = z.object({
  userId: z.number(),
  currentUserId: z.number(),
});
