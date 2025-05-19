import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mongoose, { Connection } from 'mongoose';
import { EventService } from './event.service';
import { ItemModule } from '../item/item.module';
import { EventModule } from './event.module';
import {
  ReqEventCreateForm,
  ReqEventItemReward,
  ReqEventPointReward,
} from './event.dto';
import { ErrorCode, ApiException } from '../common/exceptions';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterMongoose } from '../lib/transaction/transactional-adapter-mongoose';
import { GlobalClsTransactionPlugin } from '../lib/transaction/transaction-hook';
import { ItemService } from '../item/item.service';

mongoose.plugin(GlobalClsTransactionPlugin);

type EventCreateForm = ReqEventCreateForm & { issuer: string };

describe('EventService 통합 테스트', () => {
  let module: TestingModule;
  let eventService: EventService;
  let itemService: ItemService;
  let connection: Connection;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
          },
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
            dbName: 'test_event_' + config.get('MONGO_DATABASE_NAME'),
          }),
          inject: [ConfigService],
        }),
        ItemModule,
        EventModule,
      ],
    }).compile();

    eventService = module.get(EventService);
    itemService = module.get(ItemService);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.db.dropDatabase();
    await connection.close();
  });

  it('정상적인 보상 아이템으로 이벤트를 생성한다', async () => {
    // 시스템에 존재하는 아이템 코드
    const { code } = itemService.getItems()[0];
    const itemReward: ReqEventItemReward = {
      type: 'ITEM',
      code: code,
      quantity: 500,
    };

    const form: EventCreateForm = {
      title: '아이템 지급 이벤트',
      description:
        '100 레벨 이상 유저에게 아이템 보상을 지급하는 이벤트입니다.',
      condition: {
        expressions: [
          {
            operator: 'gte',
            syntax: ['$user_level', 100],
          },
        ],
      },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      rewards: [itemReward],
      issuer: 'admin',
    };

    const result = await eventService.createEvent(form);

    expect(result).toBeDefined();
    expect(result.rewards.length).toBe(1);
    expect(result.rewards[0].quantity).toBe(500);
  });

  it('이벤트 생성 시 존재하지 않는 아이템을 보상으로 등록하면 예외가 발생한다', async () => {
    const itemReward: ReqEventItemReward = {
      type: 'ITEM',
      code: 999999, // 유효하지 않은 아이템 코드
      quantity: 1,
    };

    const form: EventCreateForm = {
      title: '유효하지 않은 보상',
      description: '에러 발생 테스트',
      condition: {
        expressions: [],
      },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      rewards: [itemReward],
      issuer: 'admin',
    };

    try {
      await eventService.createEvent(form);
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.ItemNotFound);
    }
  });

  it('이벤트 식별자로 조회가 가능하다', async () => {
    const pointReward: ReqEventPointReward = {
      type: 'POINT',
      point: 100,
      quantity: 1,
    };

    const form: EventCreateForm = {
      title: '단건 조회 이벤트',
      description: '단건 테스트',
      condition: { expressions: [] },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      rewards: [pointReward],
      issuer: 'admin',
    };

    const created = await eventService.createEvent(form);
    const found = await eventService.getEvent(created.code);

    expect(found.code).toBe(created.code);
  });

  it('존재하지 않는 이벤트 조회 시 예외가 발생한다', async () => {
    try {
      await eventService.getEvent('non-existent-code');
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.EventNotFound);
    }
  });

  it('이벤트 상태를 변경할 수 있다', async () => {
    const pointReward: ReqEventPointReward = {
      type: 'POINT',
      point: 100,
      quantity: 1,
    };

    const form: EventCreateForm = {
      title: '활성 상태 테스트',
      description: '활성화/비활성화 테스트',
      condition: { expressions: [] },
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      rewards: [pointReward],
      issuer: 'admin',
    };

    const created = await eventService.createEvent(form);
    const updated = await eventService.updateEventEnabled(created.code, false);

    expect(updated.enabled).toBe(false);
  });
});
