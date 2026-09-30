import { Request } from 'express';
import { User } from '../users/user.entity.js';
import { refreshSchema, signInSchema, signUpSchema } from './auth.schemas.js';
import z from 'zod';

export type AuthJwtPayload = {
  /** User ID */
  sub: number;
  username: string;
};

export type TokenPair = {
  access_token: string;
  refresh_token: string;
};

export type RequestAfterAuth = Request & { user: User };
export type SignInDto = z.infer<typeof signInSchema>;
export type SignUpDto = z.infer<typeof signUpSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
