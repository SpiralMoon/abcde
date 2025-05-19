import { UserEntity } from './user.schema';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import {UserRoles} from "../common/roles/roles";

/**
 * 계정 생성 폼
 */
export class ReqUserCreateForm {
  /**
   * 이메일
   */
  @IsEmail()
  email: string;

  /**
   * 비밀번호
   */
  @IsString()
  @MinLength(1)
  password: string;

  /**
   * 이름
   */
  @IsString()
  @MinLength(1)
  name: string;

  /**
   * 권한
   */
  @IsEnum(UserRoles)
  role: UserRoles;
}

export class ResUser {
  id: string;
  email: string;
  name: string;
  role: UserRoles;
  createdAt: Date;

  static fromEntity(entity: UserEntity): ResUser {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      role: entity.role,
      createdAt: entity.createdAt,
    };
  }
}
