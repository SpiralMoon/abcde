import { UserPointEntity } from './point.schema';

export class ResPoint {
  point: number;
  total: number;
  used: number;

  static fromEntity(entity: UserPointEntity): ResPoint {
    return {
      point: entity.point,
      total: entity.total,
      used: entity.used,
    };
  }
}
