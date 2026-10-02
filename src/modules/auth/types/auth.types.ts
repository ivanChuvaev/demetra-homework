import { Request } from 'express';
import { UserResponseDto } from '../../users/dto/user.dto.js';

export type AuthJwtPayload = {
  /** User ID */
  sub: number;
  username: string;
};
export type AuthorizedRequest = Request & { user: UserResponseDto };
export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
