import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterMongoose } from '../lib/transaction/transactional-adapter-mongoose';
import { GlobalClsTransactionPlugin } from '../lib/transaction/transaction-hook';
import mongoose, { Connection } from 'mongoose';

import { UserEventService } from './user-event.service';
import { EventModule } from '../event/event.module';
import { RewardModule } from '../reward/reward.module';
import { UserDataSetModule } from '../user-data-set/user-data-set.module';
import { EventService } from '../event/event.service';
import { UserDataSetService } from '../user-data-set/user-data-set.service';
import { UserEventStatus } from './user-event.schema';
import { ErrorCode, ApiException } from '../common/exceptions';
import { ReqUserEventTakeRewardForm } from './user-event.dto';
import { UserEventModule } from './user-event.module';

mongoose.plugin(GlobalClsTransactionPlugin);

describe('UserEventService 통합 테스트', () => {
  let module: TestingModule;
  let connection: Connection;
  let userEventService: UserEventService;
  let eventService: EventService;
  let userDataSetService: UserDataSetService;
  let eventCode: string;

  const userId = 'event-test-user-id';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
        ClsModule.forRoot({
          global: true,
          middleware: { mount: true },
          plugins: [
            new ClsPluginTransactional({
              imports: [MongooseModule],
              adapter: new TransactionalAdapterMongoose({
                mongooseConnectionToken: getConnectionToken(),
              }),
            }),
          ],
        }),
        MongooseModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            uri: config.get('MONGO_URI'),
            dbName: 'test_user_event_' + config.get('MONGO_DATABASE_NAME'),
          }),
          inject: [ConfigService],
        }),
        UserEventModule,
        EventModule,
        RewardModule,
        UserDataSetModule,
      ],
    }).compile();

    connection = module.get(getConnectionToken());
    userEventService = module.get(UserEventService);
    eventService = module.get(EventService);
    userDataSetService = module.get(UserDataSetService);

    // 유효한 이벤트 등록
    const event = await eventService.createEvent({
      title: '테스트 이벤트',
      description: '이벤트 설명',
      condition: {
        expressions: [{ operator: 'gte', syntax: ['$user_level', 100] }],
      },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      rewards: [{ type: 'POINT', point: 100, quantity: 1 }],
      issuer: 'admin',
    });
    eventCode = event.code;

    // 유저 데이터 셋 초기화
    await userDataSetService.setUserDataSet(userId, {
      $user_level: 120,
    });
  });

  afterAll(async () => {
    await connection.db.dropDatabase();
    await connection.close();
  });

  it('이벤트에 정상적으로 참여할 수 있다', async () => {
    const result = await userEventService.accept(userId, eventCode);
    expect(result).toBeDefined();
    expect(result.code).toBe(eventCode);
    expect(result.user).toBe(userId);
    expect(result.status).toBe(UserEventStatus.ACCEPTED);
    expect(result.rewards.length).toBe(1);
  });

  it('이미 참여한 이벤트에 다시 참여하면 예외가 발생한다', async () => {
    try {
      await userEventService.accept(userId, eventCode);
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserEventAlreadyAccepted);
    }
  });

  it('이벤트 완료 조건을 만족후 갱신(refresh)하면 상태가 COMPLETED로 변경된다', async () => {
    const result = await userEventService.refresh(userId, eventCode);
    expect(result.status).toBe(UserEventStatus.COMPLETED);
  });

  it('선결 조건을 충족하지 않으면 참여할 수 없다', async () => {
    // 1. 선행 이벤트 생성 및 완료되지 않음
    const prevEvent = await eventService.createEvent({
      title: '선행 이벤트',
      description: '선결 조건용 이벤트',
      condition: { expressions: [] },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      rewards: [],
      issuer: 'admin',
    });

    // 2. 후속 이벤트 생성 - prev 조건 포함
    const nextEvent = await eventService.createEvent({
      title: '후속 이벤트',
      description: '선결조건 필요',
      condition: {
        prev: prevEvent.code,
        expressions: [{ operator: 'gte', syntax: ['$user_level', 100] }],
      },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      rewards: [],
      issuer: 'admin',
    });

    try {
      await userEventService.accept(userId, nextEvent.code);
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserEventPreConditionNotCompleted);
    }
  });

  it('비활성화된 이벤트에는 참여할 수 없다', async () => {
    const inactiveEvent = await eventService.createEvent({
      title: '비활성 이벤트',
      description: '사용 불가능한 이벤트',
      condition: { expressions: [] },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      rewards: [],
      issuer: 'admin',
    });

    await eventService.updateEventEnabled(inactiveEvent.code, false);

    try {
      await userEventService.accept(userId, inactiveEvent.code);
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.EventUnavailable);
    }
  });

  it('기간이 지난 이벤트에는 참여할 수 없다', async () => {
    const pastEvent = await eventService.createEvent({
      title: '만료된 이벤트',
      description: '기간이 지난 이벤트',
      condition: { expressions: [] },
      startDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2일 전
      endDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
      rewards: [],
      issuer: 'admin',
    });

    try {
      await userEventService.accept(userId, pastEvent.code);
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.EventUnavailable);
    }
  });

  it('getEvent()는 유저 이벤트 정보를 반환한다', async () => {
    const result = await userEventService.getEvent(userId, eventCode);
    expect(result).toBeDefined();
    expect(result.user).toBe(userId);
    expect(result.code).toBe(eventCode);
  });

  it('getEvents()는 유저의 모든 참여 이벤트를 반환한다', async () => {
    const results = await userEventService.getEvents(userId);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((e) => e.code === eventCode)).toBe(true);
  });

  it('보상을 정상적으로 수령하면 remain이 감소한다', async () => {
    const current = await userEventService.getEvent(userId, eventCode);
    const form: ReqUserEventTakeRewardForm = {
      key: current.rewards[0].key,
      quantity: 1,
    };

    const updated = await userEventService.takeReward(userId, eventCode, form);
    const reward = updated.rewards.find((r) => r.key === form.key);

    expect(reward).toBeDefined();
    expect(reward.remain).toBe(0);
  });

  it('존재하지 않는 보상을 수령하려 하면 예외가 발생한다', async () => {
    const current = await userEventService.getEvent(userId, eventCode);
    const form: ReqUserEventTakeRewardForm = {
      key: current.rewards[0].key + '-invalid',
      quantity: 1,
    };

    try {
      await userEventService.takeReward(userId, eventCode, form);
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserEventRewardNotFound);
    }
  });

  it('완료되지 않은 이벤트는 보상을 수령할 수 없다', async () => {
    // 새로운 유저 생성 및 참여 (조건 불충족)
    const userId = 'event-test-user-id-2';
    await userDataSetService.setUserDataSet(userId, { $user_level: 1 });
    await userEventService.accept(userId, eventCode);

    const form: ReqUserEventTakeRewardForm = {
      key: 'reward-1',
      quantity: 1,
    };

    try {
      await userEventService.takeReward(userId, eventCode, form);
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserEventNotCompleted);
    }
  });

  it('존재하지 않는 보상을 수령하려 하면 예외가 발생한다', async () => {
    const form: ReqUserEventTakeRewardForm = {
      key: 'invalid-key',
      quantity: 1,
    };

    try {
      await userEventService.takeReward(userId, eventCode, form);
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserEventRewardNotFound);
    }
  });

  it('보상을 초과 수령하려고 시도하면 예외가 발생한다', async () => {
    const current = await userEventService.getEvent(userId, eventCode);
    const form: ReqUserEventTakeRewardForm = {
      key: current.rewards[0].key,
      quantity: 999,
    };

    try {
      await userEventService.takeReward(userId, eventCode, form);
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserEventRewardNotEnough);
    }
  });

  it('보상 수령을 동시에 여러 번 요청해도 동시성 문제가 발생하지 않는다', async () => {
    // 별도 이벤트 생성 (1회만 수령 가능)
    const event = await eventService.createEvent({
      title: '동시성 테스트 이벤트',
      description: '동시성 테스트',
      condition: {
        expressions: [{ operator: 'gte', syntax: ['$user_level', 100] }],
      },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      rewards: [{ type: 'POINT', point: 100, quantity: 1 }],
      issuer: 'admin',
    });

    await userEventService.accept(userId, event.code);
    await userEventService.refresh(userId, event.code);

    const current = await userEventService.getEvent(userId, event.code);
    const form: ReqUserEventTakeRewardForm = {
      key: current.rewards[0].key,
      quantity: 1,
    };

    const tasks = Array.from({ length: 5 }).map(() =>
      userEventService.takeReward(userId, event.code, form).catch((err) => err),
    );

    const results = await Promise.all(tasks);
    const successCount = results.filter(
      (r) => !(r instanceof ApiException),
    ).length;
    const failCount = results.filter(
      (r) =>
        r instanceof ApiException &&
        r.code === ErrorCode.UserEventRewardNotEnough,
    ).length;

    expect(successCount).toBe(1);
    expect(failCount).toBe(4);
  });
});
