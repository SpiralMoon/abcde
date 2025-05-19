import {
  All,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { JwtAuthGuard } from '../auth/jwt.auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { IncomingMessage } from 'http';
import { User } from '../common/interfaces/user';
import { UserRoles } from '../common/roles/roles';
import { UserIdMatchGuard } from '../auth/user.guard';

type Request = IncomingMessage & {
  user?: User;
};

const proxy = (to: string) =>
  createProxyMiddleware({
    target: to,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req: Request) => {
        // passport에 의해 인증된 사용자 정보
        const user = req.user;

        if (user) {
          // 라우팅 대상 서버에 사용자 정보 전달
          proxyReq.setHeader('x-user', JSON.stringify(user));
        }
      },
    },
  });

const toAuthServer = (req, res) =>
  proxy(process.env.AUTH_SERVER_HOST)(req, res);
const toEventServer = (req, res) =>
  proxy(process.env.EVENT_SERVER_HOST)(req, res);

/**
 * GatewayServer 에서 다른 서버로 요청을 라우팅하는 컨트롤러
 */
@Controller()
export class ProxyController {
  @All(['auth/login'])
  toAuthServerAllAllowEvery(@Req() req, @Res() res) {
    return toAuthServer(req, res);
  }

  @Post(['users'])
  toAuthServerPostAllowEvery(@Req() req, @Res() res) {
    return toAuthServer(req, res);
  }

  @Get(['users', 'users/:userId'])
  @UseGuards(JwtAuthGuard, RolesGuard, UserIdMatchGuard)
  @Roles([UserRoles.USER, UserRoles.ADMIN])
  toAuthServerGetAllowUserOrAdmin(@Req() req, @Res() res) {
    return toAuthServer(req, res);
  }

  @Patch(['users/:userId/role'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRoles.ADMIN])
  toAuthServerPatchAllowAdmin(@Req() req, @Res() res) {
    return toAuthServer(req, res);
  }

  @Post(['events'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRoles.OPERATOR, UserRoles.ADMIN])
  toEventServerPostAllowOperatorOrAdmin(@Req() req, @Res() res) {
    return toEventServer(req, res);
  }

  @Patch(['events/:eventId/status'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRoles.OPERATOR, UserRoles.ADMIN])
  toEventServerPatchAllowOperatorOrAdmin(@Req() req, @Res() res) {
    return toEventServer(req, res);
  }

  @Get(['events', 'events/:eventId', 'items', 'items/:itemCode'])
  toEventServerGetAllowEvery(@Req() req, @Res() res) {
    return toEventServer(req, res);
  }

  @All([
    'users/:userId/events',
    'users/:userId/events/:eventId',
    'users/:userId/events/:eventId/take-reward',
    'users/:userId/events/:eventId/refresh',
    'users/:userId/data-set',
    'users/:userId/inventory',
    'users/:userId/point',
  ])
  @UseGuards(JwtAuthGuard, RolesGuard, UserIdMatchGuard)
  @Roles([UserRoles.USER, UserRoles.ADMIN])
  toEventServerAllAllowUserOrAdmin(@Req() req, @Res() res) {
    return toEventServer(req, res);
  }

  @All(['users/:userId/reward-logs'])
  @UseGuards(JwtAuthGuard, RolesGuard, UserIdMatchGuard)
  @Roles([
    UserRoles.USER,
    UserRoles.OPERATOR,
    UserRoles.AUDITOR,
    UserRoles.ADMIN,
  ])
  toEventServerAllAllowUserOrOperatorOrAuditorOrAdmin(@Req() req, @Res() res) {
    return toEventServer(req, res);
  }

  @All(['reward-logs'])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles([UserRoles.OPERATOR, UserRoles.AUDITOR, UserRoles.ADMIN])
  toEventServerAllAllowOperatorOrAuditorOrAdmin(@Req() req, @Res() res) {
    return toEventServer(req, res);
  }
}
