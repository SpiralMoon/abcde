import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { v4 } from 'uuid';
import {UserRoles} from "../common/roles/roles";

/**
 * 유저 스키마
 */
@Schema({ timestamps: true })
export class UserEntity {
  /**
   * 유저 식별자
   */
  @Prop({ type: String, required: true, unique: true, default: v4 })
  id: string;

  /**
   * 이메일
   */
  @Prop({ type: String, required: true, unique: true })
  email: string;

  /**
   * 비밀번호 (해싱됨)
   */
  @Prop({ type: String, required: true })
  password: string;

  /**
   * 이름
   */
  @Prop({ type: String, required: true })
  name: string;

  /**
   * 권한
   */
  @Prop({ type: String, required: true })
  role: UserRoles;

  /**
   * 가입일
   */
  @Prop({ type: Date })
  createdAt: Date;

  /**
   * 수정일
   */
  @Prop({ type: Date })
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<UserEntity>;

export const UserSchema = SchemaFactory.createForClass(UserEntity);
