import { Request } from 'express';
import { User } from '../../users/user.entity.js';
import { Role } from '../../../common/authorization/roles/role.enum.js';

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
export type SignInDto = {
  username: string;
  password: string;
};
export type SignUpDto = {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: Role[];
  age: number;
  description?: string;
};
export type RefreshDto = {
  refreshToken: string;
};
