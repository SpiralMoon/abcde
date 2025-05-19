import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection } from 'mongoose';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterMongoose } from '../lib/transaction/transactional-adapter-mongoose';
import { GlobalClsTransactionPlugin } from '../lib/transaction/transaction-hook';
import { RewardLogService } from './reward-log.service';
import { RewardLogModule } from './reward-log.module';

mongoose.plugin(GlobalClsTransactionPlugin);

describe('RewardLogService 통합 테스트', () => {
  let module: TestingModule;
  let rewardLogService: RewardLogService;
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
            dbName: 'test_reward_log_' + config.get('MONGO_DATABASE_NAME'),
          }),
          inject: [ConfigService],
        }),
        RewardLogModule,
      ],
    }).compile();

    rewardLogService = module.get(RewardLogService);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.db.dropDatabase();
    await connection.close();
  });

  it('보상 로그를 생성하면 DB에 저장된다', async () => {
    const userId = 'user-001';

    const result = await rewardLogService.createLog({
      userId,
      success: true,
      message: '성공적으로 지급됨',
      data: {
        key: 'reward-key-001',
        quantity: 1,
      },
    });

    expect(result).toBeDefined();
    expect(result.user).toBe(userId);
    expect(result.success).toBe(true);
    expect(result.message).toBe('성공적으로 지급됨');
    expect(result.data.key).toBe('reward-key-001');
  });

  it('getAllRewardLogs()는 전체 로그를 반환한다', async () => {
    const logs = await rewardLogService.getAllRewardLogs();

    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
  });

  it('getUserRewardLogs()는 특정 유저의 로그만 반환한다', async () => {
    const userId = 'user-002';

    await rewardLogService.createLog({
      userId,
      success: false,
      message: '이미 지급된 보상',
      data: {
        key: 'reward-key-001',
        quantity: 1,
      },
    });

    const result = await rewardLogService.getUserRewardLogs(userId);

    expect(result.length).toBeGreaterThan(0);
    result.forEach((log) => {
      expect(log.user).toBe(userId);
    });
  });
});
