import { IsEmail, IsString, MinLength } from 'class-validator';

/**
 * 인증 요청 폼
 */
export class ReqLoginForm {
  /**
   * 계정 이메일
   */
  @IsEmail()
  email: string;

  /**
   * 계정 비밀번호
   */
  @IsString()
  @MinLength(1)
  password: string;
}

/**
 * 인증 결과 폼
*/
export class ResAuthResult {
  /**
   * JWT 토큰
   */
  accessToken: string;
}
