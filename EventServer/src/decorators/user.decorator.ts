import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../common/interfaces/user';

export const XUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User | null => {
    return parseXUser(ctx.switchToHttp().getRequest());
  },
);

export function parseXUser(req: Request): User | null {
  const raw = req.headers['x-user'];

  if (typeof raw !== 'string') {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
