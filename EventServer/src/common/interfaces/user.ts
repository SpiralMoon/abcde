import { UserRoles } from '../roles/roles';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRoles;
};
