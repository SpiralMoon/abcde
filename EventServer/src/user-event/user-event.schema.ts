import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * 이벤트 진행도
 */
export enum UserEventStatus {
  /**
   * 참여(진행) 중
   */
  ACCEPTED = 'ACCEPTED',

  /**
   * 진행 완료
   */
  COMPLETED = 'COMPLETED',
}

/**
 * 보상 수령 현황
 */
@Schema({ _id: false })
export class UserEventReward {
  /**
   * 식별자. EventEntity.rewards[].key와 동일한 값이어야 합니다.
   */
  @Prop({ type: String, required: true })
  key: string;

  /**
   * 수령 가능한 보상 수량
   */
  @Prop({ type: Number, required: true })
  remain: number;
}

/**
 * 유저의 이벤트 참여 정보
 */
@Schema({ timestamps: true })
export class UserEventEntity {
  /**
   * 유저 식별자
   */
  @Prop({ type: String, required: true })
  user: string;

  /**
   * 이벤트 식별자
   */
  @Prop({ type: String, required: true })
  code: string;

  /**
   * 진행도. COMPLETED 상태일 때만 보상 지급이 가능
   */
  @Prop({ type: String, required: true, default: UserEventStatus.ACCEPTED })
  status: UserEventStatus;

  /**
   * 보상 수령 현황
   */
  @Prop({ type: [UserEventReward], required: true, default: [] })
  rewards: UserEventReward[];

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
}

export type UserEventDocument = HydratedDocument<UserEventEntity>;

export const UserEventSchema = SchemaFactory.createForClass(UserEventEntity);

UserEventSchema.index({ user: 1, code: 1 }, { unique: true });
