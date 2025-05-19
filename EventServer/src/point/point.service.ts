import { Injectable, NotImplementedException } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserPointDocument, UserPointEntity } from './point.schema';
import { Transactional } from '@nestjs-cls/transactional';
import { InjectModel } from '@nestjs/mongoose';
import {
  UserPointHistoryDocument,
  UserPointHistoryEntity,
} from './point-history.schema';
import {delay} from "@fxts/core";

/**
 * 유저의 포인트 서비스 입니다.
 */
@Injectable()
export class PointService {
  constructor(
    @InjectModel(UserPointEntity.name)
    private readonly pointModel: Model<UserPointDocument>,
    @InjectModel(UserPointHistoryEntity.name)
    private readonly pointHistoryModel: Model<UserPointHistoryDocument>,
  ) {}

  /**
   * 유저의 포인트 요약 정보를 조회 합니다.
   * @param userId 유저 식별자
   */
  async get(userId: string) {
    return this.pointModel.findOneAndUpdate(
      { user: userId },
      {},
      {
        new: true,
        upsert: true,
      },
    );
  }

  /**
   * 유저에게 포인트를 적립 합니다.
   * @param userId 유저 식별자
   * @param amount 변동량
   */
  @Transactional()
  async accumulate(userId: string, amount: number) {
    // 포인트 적립
    const userPoint = await this.pointModel.findOneAndUpdate(
      {
        user: userId,
      },
      {
        $inc: {
          point: amount,
          total: amount,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );
    // 변동 기록 저장
    await this.pointHistoryModel.create({
      user: userId,
      snapshot: {
        point: userPoint.point,
        total: userPoint.total,
        used: userPoint.used,
      },
    });

    return userPoint;
  }

  /**
   * 유저의 포인트를 소모 합니다.
   * @param userId 유저 식별자
   * @param amount 변동량
   */
  spend(userId: string, amount: number) {
    throw new NotImplementedException('Not implemented yet.');
  }

  /**
   * 유저의 포인트를 회수 합니다.
   * @param userId 유저 식별자
   * @param amount 변동량
   */
  revoke(userId: string, amount: number) {
    throw new NotImplementedException('Not implemented yet.');
  }

  /**
   * 유저의 포인트를 환불 합니다.
   * @param userId 유저 식별자
   * @param amount 변동량
   */
  refund(userId: string, amount: number) {
    throw new NotImplementedException('Not implemented yet.');
  }
}
