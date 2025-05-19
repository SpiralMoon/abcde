import { Reflector } from '@nestjs/core';
import { UserRoles } from '../common/roles/roles';

export const Roles = Reflector.createDecorator<UserRoles[]>();
