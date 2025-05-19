import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserPointEntity } from './point.schema';

/**
 * 변동 직후의 스냅샷
 */
@Schema({ _id: false })
class UserPointSnapshot {
  @Prop({ type: Number, required: true })
  point: UserPointEntity['point'];

  @Prop({ type: Number, required: true })
  total: UserPointEntity['total'];

  @Prop({ type: Number, required: true })
  used: UserPointEntity['used'];
}

/**
 * 유저 포인트 변동 기록
 */
@Schema({ timestamps: true })
export class UserPointHistoryEntity {
  @Prop({ type: String, required: true })
  user: string;

  @Prop({ type: UserPointSnapshot, required: true })
  snapshot: UserPointSnapshot;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  reason: any;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type UserPointHistoryDocument = HydratedDocument<UserPointHistoryEntity>;

export const UserPointHistorySchema = SchemaFactory.createForClass(
  UserPointHistoryEntity,
);

UserPointHistorySchema.index({ user: 1, createdAt: 1 });
