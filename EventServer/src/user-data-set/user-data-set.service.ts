import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { UserDataSetDocument, UserDataSetEntity } from './user-data-set.schema';
import { InjectModel } from '@nestjs/mongoose';

/**
 * 유저의 서비스 이용 데이터 세트 서비스 입니다.
 *
 * 이벤트 완료 조건 계산에 필요한 유저의 특정 데이터를 외부 서비스/저장소로부터 가져오는 행위를 시뮬레이션 합니다.
 */
@Injectable()
export class UserDataSetService {
  constructor(
    @InjectModel(UserDataSetEntity.name)
    private readonly userDataSetModel: Model<UserDataSetDocument>,
  ) {}

  /**
   * 유저 데이터 세트를 설정 합니다.
   * @param userId 유저 식별자
   * @param userDataSet
   */
  async setUserDataSet(
    userId: string,
    userDataSet: object,
  ): Promise<UserDataSetEntity> {
    return this.userDataSetModel.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          data: userDataSet,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );
  }

  /**
   * 유저 데이터 세트를 조회 합니다.
   * @param userId 유저 식별자
   */
  async getUserDataSet(userId: string): Promise<UserDataSetEntity> {
    return this.userDataSetModel.findOneAndUpdate(
      { user: userId },
      {},
      {
        new: true,
        upsert: true,
      },
    );
  }
}
