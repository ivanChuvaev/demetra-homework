import { Role } from '../../../common/authorization/roles/role.enum.js';
import z from 'zod';

export const createUserSchema = z.object({
  username: z.string().nonempty().min(2).max(256),
  firstName: z.string().nonempty().max(256),
  lastName: z.string().nonempty().max(256),
  password: z.string().nonempty(),
  roles: z.array(z.enum(Role)).optional(),
  age: z.number(),
  description: z.string().optional(),
});

export const updateUserSchema = createUserSchema;
export const updateUserPartialSchema = updateUserSchema.partial();
export const updateCurrentUserSchema = createUserSchema;
export const updateCurrentUserPartialSchema = updateCurrentUserSchema.partial();
