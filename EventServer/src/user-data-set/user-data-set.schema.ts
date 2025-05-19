import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDataSetKeys =
  | '$user_level'
  | '$today_hunt_count'
  | '$total_hunt_count';

export type UserDataSet = {
  [key in UserDataSetKeys]?: number;
};

/**
 * 유저의 서비스 이용 데이터 세트
 */
@Schema({ _id: false })
export class UserDataSetEntity {
  /**
   * 유저 식별자
   */
  @Prop({ type: String, required: true, unique: true })
  user: string;

  /**
   * 유저 데이터 세트
   */
  @Prop({ type: Object, required: true, default: {} })
  data: UserDataSet;
}

export type UserDataSetDocument = HydratedDocument<UserDataSetEntity>;

export const UserDataSetSchema =
  SchemaFactory.createForClass(UserDataSetEntity);
