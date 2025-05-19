import { UserRoles } from '../roles/roles';

export type JwtPayload = {
  version: number;
  id: string;
  name: string;
  email: string;
  role: UserRoles;
};
