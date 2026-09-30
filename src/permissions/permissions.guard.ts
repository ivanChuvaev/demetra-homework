import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PERMISSIONS_DECORATOR_KEY } from './decorators/permissions.decorator.js';
import { Permission } from './permission.enum.js';
import { User } from '../users/user.entity.js';
import { getRolePermissions } from '../roles/rolePermission.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<
      undefined | Permission[] | Permission[][]
    >(PERMISSIONS_DECORATOR_KEY, [context.getHandler(), context.getClass()]);
    const request = context.switchToHttp().getRequest() as Request & {
      user?: User;
    };
    if (!request.user || !permissions) {
      return true;
    }
    const userPermissionSet = request.user.roles.reduce<Set<Permission>>(
      (set, role) => {
        const permissions = getRolePermissions(role);
        for (const permission of permissions) {
          set.add(permission);
        }
        return set;
      },
      new Set(),
    );
    const isNested = permissions.length > 0 && Array.isArray(permissions[0]);
    const nestedPermissions = isNested
      ? (permissions as Permission[][])
      : [permissions as Permission[]];
    for (const subPermissions of nestedPermissions) {
      if (
        subPermissions.length > 0 &&
        subPermissions.every((permission) => userPermissionSet.has(permission))
      ) {
        return true;
      }
    }
    throw new ForbiddenException('User does not have appropriate permissions');
  }
}
