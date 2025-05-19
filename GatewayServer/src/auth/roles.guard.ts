import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from './roles.decorator';
import { User } from '../common/interfaces/user';

/**
 * 유저의 권한을 검사하는 가드
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get(Roles, context.getHandler());

    // 권한이 지정되지 않으면 모든 요청을 허용
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest().user as User;
    const hasRole = requiredRoles.includes(user.role);

    return hasRole;
  }
}
