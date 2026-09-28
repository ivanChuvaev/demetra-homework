import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permission.enum.js';

export const PERMISSIONS_DECORATOR_KEY = 'PERMISSIONS_DECORATOR_KEY';
/** Allow access for users that have all of provided permissions,
 * when provided nested array then each user must have all permissions
 * of at least one nested array,i.e OR operator outside, AND operator inside */
export const Permissions = (permissions: Permission[] | Permission[][]) =>
  SetMetadata(PERMISSIONS_DECORATOR_KEY, permissions);
