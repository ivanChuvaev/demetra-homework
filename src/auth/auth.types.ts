import { Request } from 'express';
import { User } from '../users/user.entity.js';

export type AuthJwtPayload = {
  /** User ID */
  sub: number;
  username: string;
};

export type RequestAfterAuth = Request & { user: User };
