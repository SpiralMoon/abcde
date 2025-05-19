import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ApiException, ErrorCode } from '../common/exceptions';
import { JwtPayload } from '../common/interfaces/jwt';

/**
 * 인증 정보를 관리하는 서비스 입니다.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 인증을 수행 합니다.
   * @param email 계정 이메일
   * @param password 계정 비밀번호
   */
  async authenticate(email: string, password: string): Promise<string> {
    const user = await this.userService.getUserByEmail(email);
    const isMatchedPassword: boolean = await bcrypt.compare(
      password,
      user.password,
    );

    // 비밀번호가 일치하지 않으면 인증 실패
    if (!isMatchedPassword) {
      throw new ApiException(ErrorCode.UserNotFound, 'Authentication failed.');
    }

    const payload: JwtPayload = {
      version: Number(process.env.JWT_VERSION),
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // JWT 생성
    return this.jwtService.sign(payload);
  }
}
