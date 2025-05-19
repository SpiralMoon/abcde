import { UserEventEntity } from './user-event.schema';
import { IsInt, IsString, Min } from 'class-validator';

/**
 * 보상 수령 요청 폼
 */
export class ReqUserEventTakeRewardForm {
  @IsString()
  key: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class ResUserEvent {
  code: string;
  status: string;
  rewards: {
    key: string;
    remain: number;
  }[];
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: UserEventEntity): ResUserEvent {
    return {
      code: entity.code,
      status: entity.status,
      rewards: entity.rewards.map((reward) => ({
        key: reward.key,
        remain: reward.remain,
      })),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static fromEntities(entities: UserEventEntity[]): ResUserEvent[] {
    return entities.map(this.fromEntity);
  }
}
