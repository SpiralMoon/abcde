import { EventEntity } from './event.schema';
import {
  IsArray,
  IsDateString,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ReqResEventConditionExpression {
  @IsString()
  operator: string;

  @IsArray()
  syntax: [string, number];
}

export class ReqResEventCondition {
  @IsString()
  prev?: string;

  @IsArray()
  @ValidateNested({ each: true })
  expressions: ReqResEventConditionExpression[];
}

export type ReqEventPointReward = {
  type: 'POINT';
  point: number;
  quantity: number;
};

export type ReqEventItemReward = {
  type: 'ITEM';
  code: number;
  quantity: number;
};

export class ReqEventCreateForm {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @ValidateNested()
  condition: ReqResEventCondition;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsArray()
  rewards: (ReqEventPointReward | ReqEventItemReward)[];
}

export class ResEvent {
  code: string;
  title: string;
  description: string;
  condition: ReqResEventCondition;
  startDate: Date;
  endDate: Date;
  rewards: { key: string; quantity: number }[];
  issuer: string;

  static fromEntity(entity: EventEntity): ResEvent {
    return {
      code: entity.code,
      title: entity.title,
      description: entity.description,
      condition: entity.condition,
      startDate: entity.startDate,
      endDate: entity.endDate,
      rewards: entity.rewards,
      issuer: entity.issuer,
    };
  }

  static fromEntities(entities: EventEntity[]): ResEvent[] {
    return entities.map(this.fromEntity);
  }
}
