import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

/**
 * 보상 수령 요청 기록
 */
@Schema({ timestamps: true })
export class RewardLogEntity {
  @Prop({ type: String })
  user: string;

  /**
   * 수령 여부
   */
  @Prop({ type: Boolean, required: true })
  success: boolean;

  /**
   * 수령 실패 시 오류 메시지 등
   */
  @Prop({ type: String })
  message: string;

  /**
   * 요청 데이터. 이벤트나 보상 식별자, 수량 등의 정보가 포함
   */
  @Prop({ type: mongoose.Schema.Types.Mixed, required: true })
  data: any;

  @Prop({ type: Date, index: true })
  createdAt: Date;
}

export type RewardLogDocument = HydratedDocument<RewardLogEntity>;

export const RewardLogSchema = SchemaFactory.createForClass(RewardLogEntity);
RewardLogSchema.index({ user: 1, createdAt: 1 });
