import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { RewardLogDocument, RewardLogEntity } from './reward-log.schema';
import { InjectModel } from '@nestjs/mongoose';

/**
 * 보상 지급의 성공/실패 로그를 관리하는 서비스 입니다.
 */
@Injectable()
export class RewardLogService {
  constructor(
    @InjectModel(RewardLogEntity.name)
    private readonly rewardLogModel: Model<RewardLogDocument>,
  ) {}

  /**
   * 보상 지급 로그를 생성 합니다.
   */
  createLog({
    userId,
    success,
    message,
    data,
  }: {
    userId: string;
    success: boolean;
    message?: string;
    data: any;
  }) {
    return this.rewardLogModel.create({
      user: userId,
      success,
      message,
      data,
    });
  }

  /**
   * 모든 유저의 보상 지급 로그를 조회 합니다.
   */
  getAllRewardLogs() {
    return this.rewardLogModel.find();
  }

  /**
   * 특정 유저의 보상 지급 로그를 조회 합니다.
   * @param userId 유저 식별자
   */
  getUserRewardLogs(userId: string) {
    return this.rewardLogModel.find({ user: userId });
  }
}
