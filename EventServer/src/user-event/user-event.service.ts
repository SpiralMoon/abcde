import { Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Model } from 'mongoose';
import {
  UserEventDocument,
  UserEventEntity,
  UserEventStatus,
} from './user-event.schema';
import { InjectModel } from '@nestjs/mongoose';
import { ReqUserEventTakeRewardForm } from './user-event.dto';
import { RewardService } from '../reward/reward.service';
import { unwrap } from '../lib/proxy';
import { EventService } from '../event/event.service';
import { EventCalculator } from '../lib/event-calculator';
import { UserDataSetService } from '../user-data-set/user-data-set.service';
import { ApiException, ErrorCode } from '../common/exceptions';

/**
 * 유저의 이벤트 참여 정보를 관리하는 서비스 입니다.
 */
@Injectable()
export class UserEventService {
  constructor(
    @InjectModel(UserEventEntity.name)
    private readonly userEventModel: Model<UserEventDocument>,
    private readonly eventService: EventService,
    private readonly rewardService: RewardService,
    private readonly userDataSetService: UserDataSetService,
  ) {}

  /**
   * 유저를 이벤트에 참여 시킵니다.
   * @param userId
   * @param eventId
   */
  @Transactional()
  async accept(userId: string, eventId: string): Promise<UserEventEntity> {
    const [event, isAlreadyAccepted] = await Promise.all([
      this.eventService.getEvent(eventId),
      this.userEventModel.exists({
        user: userId,
        code: eventId,
      }),
    ]);

    //#region 이벤트 중복 참여 검사

    if (isAlreadyAccepted) {
      throw new ApiException(
        ErrorCode.UserEventAlreadyAccepted,
        'Already accepted.',
      );
    }

    //#endregion

    //#region 이벤트 활성 여부 검사

    if (!event.isOnGoing()) {
      throw new ApiException(
        ErrorCode.EventUnavailable,
        'Event is not available.',
      );
    }

    //#endregion

    //#region 이벤트 선행 조건 검사

    if (event.condition?.prev) {
      const isPrevCompleted = await this.userEventModel.exists({
        userId: userId,
        eventId: event.condition.prev,
        status: UserEventStatus.COMPLETED,
      });

      if (!isPrevCompleted) {
        throw new ApiException(
          ErrorCode.UserEventPreConditionNotCompleted,
          'Previous event is not completed.',
        );
      }
    }

    //#endregion

    const userEvent = new this.userEventModel({
      user: userId,
      code: eventId,
      rewards: event.rewards.map((reward) => {
        return {
          key: reward.key,
          remain: reward.quantity,
        };
      }),
      status: UserEventStatus.ACCEPTED,
    });

    // 참여 정보 등록
    return await userEvent.save();
  }

  /**
   * 유저의 이벤트 참여 정보를 조회 합니다.
   * @param userId 유저 식별자
   * @param eventId 이벤트 식별자
   */
  async getEvent(userId: string, eventId: string): Promise<UserEventEntity> {
    const userEvent = await this.userEventModel.findOne({
      user: userId,
      code: eventId,
    });

    if (!userEvent) {
      throw new ApiException(
        ErrorCode.UserEventNotFound,
        'User event not found.',
      );
    }

    return userEvent;
  }

  /**
   * 유저의 이벤트 참여 정보 목록을 조회 합니다.
   * @param userId  유저 식별자
   */
  async getEvents(userId: string): Promise<UserEventEntity[]> {
    return this.userEventModel.find({ user: userId });
  }

  /**
   * 유저의 이벤트 참여 진행도를 갱신 합니다.
   * @param userId 유저 식별자
   * @param eventId 이벤트 식별자
   */
  @Transactional()
  async refresh(userId: string, eventId: string): Promise<UserEventEntity> {
    const userEvent = await this.userEventModel.findOne({
      user: userId,
      code: eventId,
    });
    const event = await this.eventService.getEvent(eventId);

    if (!userEvent) {
      throw new ApiException(
        ErrorCode.UserEventNotFound,
        'User event not found.',
      );
    }

    if (!event) {
      throw new ApiException(ErrorCode.EventNotFound, 'Event not found.');
    }

    if (!event.isOnGoing()) {
      throw new ApiException(
        ErrorCode.EventUnavailable,
        'Event is not available.',
      );
    }

    if (userEvent.status === UserEventStatus.COMPLETED) {
      return userEvent;
    }

    const { condition } = event;
    const { data: userDataSet } =
      await this.userDataSetService.getUserDataSet(userId);

    const calculator = new EventCalculator(condition, userDataSet);

    if (calculator.isComplete()) {
      userEvent.status = UserEventStatus.COMPLETED;
      await userEvent.save();
    }

    return userEvent;
  }

  /**
   * 유저가 참여중인 이벤트의 완료 보상을 지급 합니다.
   *
   * 기간이 지났거나, 보상을 이미 지급 받은 경우 중복으로 지급되지 않습니다.
   * @param userId 유저 식별자
   * @param eventId 이벤트 식별자
   * @param form 보상 신청 폼
   */
  @Transactional()
  async takeReward(
    userId: string,
    eventId: string,
    form: ReqUserEventTakeRewardForm,
  ): Promise<UserEventEntity> {
    const [event, userEvent] = await Promise.all([
      this.eventService.getEvent(eventId),
      this.getEvent(userId, eventId),
    ]);

    //#region 이벤트 활성 여부 검사

    if (!event.isOnGoing()) {
      throw new ApiException(
        ErrorCode.EventUnavailable,
        'End of reward period.',
      );
    }

    //#endregion

    //#region 이벤트 진행도 검사

    if (userEvent.status !== UserEventStatus.COMPLETED) {
      throw new ApiException(
        ErrorCode.UserEventNotCompleted,
        'User event is not completed.',
      );
    }

    //#endregion

    //#region 이벤트 보상 중복 수령 검사

    const userReward = userEvent.rewards.find((r) => r.key === form.key);

    if (!userReward) {
      throw new ApiException(
        ErrorCode.UserEventRewardNotFound,
        'Invalid reward.',
      );
    }

    if (userReward.remain < form.quantity) {
      throw new ApiException(
        ErrorCode.UserEventRewardNotEnough,
        'Not enough remain reward.',
      );
    }

    //#endregion

    const reward = event.rewards.find((r) => r.key === form.key);

    // 보상 지급
    await this.rewardService.provide(userId, {
      ...unwrap(reward),
      quantity: form.quantity,
    });

    // 남은 보상 수량 차감
    const updated = await this.userEventModel.findOneAndUpdate(
      {
        user: userId,
        code: eventId,
        'rewards.key': form.key,
      },
      {
        $inc: {
          'rewards.$.remain': -form.quantity,
        },
      },
      { new: true },
    );

    return updated;
  }
}
