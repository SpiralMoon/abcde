import { Injectable } from '@nestjs/common';
import { ReqEventCreateForm } from './event.dto';
import { EventDocument, EventEntity } from './event.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ApiException, ErrorCode } from '../common/exceptions';
import { RewardService } from '../reward/reward.service';

/**
 * 이벤트 정보를 관리하는 서비스 입니다.
 */
@Injectable()
export class EventService {
  constructor(
    @InjectModel(EventEntity.name)
    private readonly eventModel: Model<EventDocument>,
    private readonly rewardService: RewardService,
  ) {}

  /**
   * 신규 이벤트를 개설 합니다.
   * @param form 이벤트 생성 폼
   */
  async createEvent(
    form: ReqEventCreateForm & { issuer: string },
  ): Promise<EventEntity> {
    const { issuer, ...rest } = form;

    //#region 보상으로 등록한 아이템이 시스템에 존재하는지 유효성 검증

    const rewardItemCodes = form.rewards
      .filter((reward) => reward.type === 'ITEM')
      .map((reward) => reward.code);

    if (!this.rewardService.isRewardableItem(...rewardItemCodes)) {
      throw new ApiException(
        ErrorCode.ItemNotFound,
        'Item not found in the system.',
      );
    }

    //#endregion

    const event = new this.eventModel({
      ...rest,
      issuer: issuer,
    });

    return event.save();
  }

  /**
   * 이벤트를 조회 합니다.
   * @param code 이벤트 식별자
   */
  async getEvent(code: string): Promise<EventEntity> {
    const event = await this.eventModel.findOne({ code: code });

    if (!event) {
      throw new ApiException(ErrorCode.EventNotFound, 'Event not found.');
    }

    return event;
  }

  /**
   * 이벤트 목록을 조회 합니다.
   */
  async getEvents(): Promise<EventEntity[]> {
    return this.eventModel.find();
  }

  /**
   * 이벤트의 활성 상태를 변경 합니다.
   * @param code 이벤트 식별자
   * @param state 변경할 상태
   */
  async updateEventEnabled(code: string, state: boolean): Promise<EventEntity> {
    const event = await this.eventModel.findOneAndUpdate(
      { code: code },
      { $set: { enabled: state } },
      { new: true },
    );

    if (!event) {
      throw new ApiException(ErrorCode.EventNotFound, 'Event not found.');
    }

    return event;
  }
}
