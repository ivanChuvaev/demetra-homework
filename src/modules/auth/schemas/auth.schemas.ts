import z from 'zod';
import { createUserSchema } from '../../users/schemas/users.schemas.js';

export const signInSchema = z.object({
  username: z.string().nonempty().min(2).max(256),
  password: z.string().nonempty(),
});
export const signUpSchema = createUserSchema;
export const refreshSchema = z.object({
  refreshToken: z.string().nonempty(),
});
