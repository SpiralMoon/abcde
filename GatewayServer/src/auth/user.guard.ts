import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoles } from '../common/roles/roles';
import { Request as ExpressRequest } from 'express';
import { User } from '../common/interfaces/user';

type Request = ExpressRequest & {
  user: User;
};

/**
 * 이 가드는 일반 유저가 자신의 리소스에만 접근할 수 있도록 제한 합니다.
 *
 * RolesGuard와 함께 사용하여야 하며, UserRoles.USER 일 때만 적용 됩니다.
 * @example
 * ``` typescript
 * @UseGuards(JwtAuthGuard, RolesGuard, UserIdMatchGuard)
 * @Roles([UserRoles.USER])
 * @Get(['users', 'users/:userId'])
 * getUser(@Param('userId') userId: string);
 * ```
 */
@Injectable()
export class UserIdMatchGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user;

    // 권한이 USER가 아니면 요청을 허용
    if (user.role !== UserRoles.USER) {
      return true;
    }

    const userIdParam = req.params['userId'];

    if (!userIdParam) {
      throw new ForbiddenException('userId parameter is missing.');
    }

    if (user.id !== userIdParam) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }

    return true;
  }
}
