import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import mongoose, { Connection } from 'mongoose';
import { RewardService } from './reward.service';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterMongoose } from '../lib/transaction/transactional-adapter-mongoose';
import { GlobalClsTransactionPlugin } from '../lib/transaction/transaction-hook';
import { RewardModule } from './reward.module';
import { ItemService } from '../item/item.service';
import { EventRewardType } from '../event/event.schema';
import { ApiException, ErrorCode } from '../common/exceptions';
import { ItemModule } from '../item/item.module';
import { PointModule } from '../point/point.module';
import { InventoryModule } from '../inventory/inventory.module';
import { PointService } from '../point/point.service';
import { InventoryService } from '../inventory/inventory.service';

mongoose.plugin(GlobalClsTransactionPlugin);

describe('RewardService 통합 테스트', () => {
  let module: TestingModule;
  let rewardService: RewardService;
  let itemService: ItemService;
  let inventoryService: InventoryService;
  let pointService: PointService;
  let connection: Connection;
  const userId = 'test-user-id';

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
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
            dbName: 'test_reward_' + config.get('MONGO_DATABASE_NAME'),
          }),
          inject: [ConfigService],
        }),
        ItemModule,
        PointModule,
        InventoryModule,
        RewardModule,
      ],
    }).compile();

    rewardService = module.get(RewardService);
    itemService = module.get(ItemService);
    inventoryService = module.get(InventoryService);
    pointService = module.get(PointService);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.db.dropDatabase();
    await connection.close();
  });

  it('포인트 보상을 지급하면 포인트가 적립된다', async () => {
    const amount = 300;
    await rewardService.provide(userId, {
      type: EventRewardType.POINT,
      quantity: 1,
      point: amount,
      key: 'key of event reward',
    });

    const userPoint = await pointService.get(userId);
    expect(userPoint.point).toBe(amount);
  });

  it('아이템 보상을 지급하면 인벤토리에 추가된다', async () => {
    const item = itemService.getItems()[0];
    const quantity = 2;

    await rewardService.provide(userId, {
      type: EventRewardType.ITEM,
      code: item.code,
      quantity: quantity,
      key: 'key of event reward',
    });

    const inventory = await inventoryService.getInventory(userId);
    const found = inventory.items.find((i) => i.code === item.code);

    expect(found).toBeDefined();
    expect(found.quantity).toBe(quantity);
  });

  it('지원하지 않는 보상 타입을 주면 예외가 발생한다', async () => {
    try {
      await rewardService.provide(userId, {
        type: 'UNKNOWN' as any,
        quantity: 1,
        key: 'key of event reward',
      });
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.UserEventRewardNotFound);
    }
  });

  it('isRewardableItem은 시스템에 존재하는 아이템 코드 포함 시 true를 반환한다', () => {
    const item = itemService.getItems()[0];
    const result = rewardService.isRewardableItem(item.code);
    expect(result).toBe(true);
  });

  it('isRewardableItem은 시스템에 존재하지 않는 아이템 코드 포함 시 false를 반환한다', () => {
    const item = itemService.getItems()[0];
    const result = rewardService.isRewardableItem(item.code, 999999);
    expect(result).toBe(false);
  });
});
