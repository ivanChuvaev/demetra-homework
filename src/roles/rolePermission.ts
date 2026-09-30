import { Permission } from '../permissions/permission.enum.js';
import { Role } from './role.enum.js';

const rolePermissionsMap: Record<Role, Permission[]> = {
  [Role.ADMIN]: [Permission.USERS_EDIT, Permission.USERS_READ],
  [Role.CLIENT]: [Permission.USERS_READ],
};

export function getRolePermissions(role: Role): Permission[] {
  return rolePermissionsMap[role];
}
