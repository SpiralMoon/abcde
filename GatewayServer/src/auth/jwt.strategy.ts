import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../common/interfaces/jwt';
import { User } from '../common/interfaces/user';

/**
 * JWT 인증 전략
 *
 * HTTP request header['authorization']에서 JWT를 추출하여 유효성을 검증 합니다.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  /**
   * JWT에 대한 추가 유효성 검증 및 유저 정보를 반환 합니다.
   *
   * 유효한 JWT일 때만 호출 됩니다.
   * @param payload
   */
  validate(payload: JwtPayload): User {
    const currentVersion = Number(process.env.JWT_VERSION);
    const isMatcedVersion = currentVersion === payload.version;

    // JWT 버전이 일치하지 않으면 유효하지 않은 것으로 간주
    if (!isMatcedVersion) {
      throw new UnauthorizedException('JWT version mismatch');
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };
  }
}
