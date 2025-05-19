import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { v4 } from 'uuid';
import { UserDataSetKeys } from '../user-data-set/user-data-set.schema';

export type EventConditionExpressionOperators =
  | 'gte'
  | 'lte'
  | 'gt'
  | 'lt'
  | 'eq'
  | 'neq';

@Schema({ _id: false })
export class EventConditionExpression {
  @Prop({ type: String, required: true })
  operator: EventConditionExpressionOperators;

  @Prop({ type: [mongoose.Schema.Types.Mixed], required: true })
  syntax: [UserDataSetKeys, number];
}

@Schema({ _id: false })
export class EventCondition {
  @Prop({ type: String })
  prev?: EventEntity['code'];

  @Prop({ type: [EventConditionExpression], required: true })
  expressions: EventConditionExpression[];
}

/**
 * 이벤트 보상 - 공통
 */
@Schema({ _id: false, discriminatorKey: 'type' })
export class EventReward {
  /**
   * 구분. (discriminator key)
   */
  type: EventRewardType;

  /**
   * 식별자
   */
  @Prop({ type: String, required: true, default: v4 })
  key: string;

  /**
   * 수량
   */
  @Prop({ required: true })
  quantity: number;
}

/**
 * 이벤트 보상 - 아이템
 */
@Schema()
export class EventRewardItem extends EventReward {
  /**
   * 수령 시 지급되는 아이템 식별자
   */
  @Prop({ required: true })
  code: number;
}

/**
 * 이벤트 보상 - 포인트
 */
@Schema()
export class EventRewardPoint extends EventReward {
  /**
   * 수령 시 지급되는 금액
   */
  @Prop({ required: true })
  point: number;
}

/**
 * 이벤트 보상 타입
 */
export enum EventRewardType {
  ITEM = 'ITEM',
  POINT = 'POINT',
}

/**
 * 이벤트
 */
@Schema({ timestamps: true })
export class EventEntity {
  /**
   * 식별자
   */
  @Prop({ type: String, required: true, unique: true, default: v4 })
  code: string;

  /**
   * 제목
   */
  @Prop({ required: true })
  title: string;

  /**
   * 설명
   */
  @Prop()
  description: string;

  /**
   * 조건
   */
  @Prop({ type: EventCondition })
  condition: EventCondition;

  /**
   * 이벤트 활성 상태. false인 경우 유저는 이벤트를 진행할 수 없어야 합니다.
   */
  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  /**
   * 시작일
   */
  @Prop({ type: Date, required: true })
  startDate: Date;

  /**
   * 종료일
   */
  @Prop({ type: Date, required: true })
  endDate: Date;

  /**
   * 보상 목록
   */
  @Prop({ type: [EventReward], default: [] })
  rewards: EventReward[];

  /**
   * 생성 주체
   */
  @Prop({ type: String, required: true })
  issuer: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  /**
   * 이벤트 진행 가능 여부를 확인 합니다.
   */
  isOnGoing: () => boolean;
}

export const EventRewardSchema = SchemaFactory.createForClass(EventReward);
export const EventRewardItemSchema =
  SchemaFactory.createForClass(EventRewardItem);
export const EventRewardPointSchema =
  SchemaFactory.createForClass(EventRewardPoint);
export const EventConditionExpressionSchema = SchemaFactory.createForClass(
  EventConditionExpression,
);

export type EventDocument = HydratedDocument<EventEntity>;

export const EventSchema = SchemaFactory.createForClass(EventEntity);

EventSchema.methods.isOnGoing = function (): boolean {
  const now = Date.now();
  const { startDate, endDate, enabled } = this;

  return startDate.getTime() <= now && now <= endDate.getTime() && enabled;
};

EventConditionExpressionSchema.set('strict', false);

//#region discriminator 등록

const rewardsPath = EventSchema.path('rewards') as any;

// type이 EventRewardType.ITEM 인 경우 EventRewardItemSchema 사용
rewardsPath.discriminator(EventRewardType.ITEM, EventRewardItemSchema);
// type이 EventRewardType.POINT 인 경우 EventRewardPointSchema 사용
rewardsPath.discriminator(EventRewardType.POINT, EventRewardPointSchema);

export function isItemReward(reward: EventReward): reward is EventRewardItem {
  return reward.type === EventRewardType.ITEM;
}

export function isPointReward(reward: EventReward): reward is EventRewardPoint {
  return reward.type === EventRewardType.POINT;
}

//#endregion
