import { Role } from '../../../common/authorization/roles/role.enum.js';

export type CreateUserDto = {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: Role[];
  age: number;
  description?: string;
};
export type UpdateUserDto = CreateUserDto;
export type UpdateUserPartialDto = Partial<CreateUserDto>;
export type UpdateCurrentUserDto = UpdateUserDto;
export type UpdateCurrentUserPartialDto = Partial<UpdateUserDto>;
