import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * 유저 포인트
 */
@Schema({ timestamps: true })
export class UserPointEntity {
  /**
   * 유저 식별자
   */
  @Prop({ type: String, required: true, unique: true })
  user: string;

  /**
   * 현재 보유량
   */
  @Prop({ type: Number, required: true, default: 0, min: 0 })
  point: number;

  /**
   * 누적 획득량
   */
  @Prop({ type: Number, required: true, default: 0, min: 0 })
  total: number;

  /**
   * 누적 사용량
   */
  @Prop({ type: Number, required: true, default: 0, min: 0 })
  used: number;
}

export type UserPointDocument = HydratedDocument<UserPointEntity>;

export const UserPointSchema = SchemaFactory.createForClass(UserPointEntity);
