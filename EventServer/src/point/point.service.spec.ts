import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  MongooseModule,
  getConnectionToken,
  getModelToken,
} from '@nestjs/mongoose';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterMongoose } from '../lib/transaction/transactional-adapter-mongoose';
import { GlobalClsTransactionPlugin } from '../lib/transaction/transaction-hook';
import mongoose, { Connection, Model } from 'mongoose';
import { PointService } from './point.service';
import {
  UserPointHistoryDocument,
  UserPointHistoryEntity,
} from './point-history.schema';
import { PointModule } from './point.module';

mongoose.plugin(GlobalClsTransactionPlugin);

describe('PointService 통합 테스트', () => {
  let module: TestingModule;
  let pointService: PointService;
  let pointHistoryModel: mongoose.Model<UserPointHistoryDocument>;
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
            dbName: 'test_point_' + config.get('MONGO_DATABASE_NAME'),
          }),
          inject: [ConfigService],
        }),
        PointModule,
      ],
    }).compile();

    pointService = module.get(PointService);
    pointHistoryModel = module.get<Model<UserPointHistoryDocument>>(
      getModelToken(UserPointHistoryEntity.name),
    );
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.db.dropDatabase();
    await connection.close();
  });

  it('포인트를 적립하면 point, total 값이 증가하고 이력이 기록된다', async () => {
    const userId = 'user-001';
    const amount = 100;

    const result = await pointService.accumulate(userId, amount);

    expect(result.user).toBe(userId);
    expect(result.point).toBe(amount);
    expect(result.total).toBe(amount);
    expect(result.used).toBe(0);

    const history = await pointHistoryModel.findOne({ user: userId });

    expect(history).toBeDefined();
    expect(history.snapshot.point).toBe(amount);
    expect(history.snapshot.total).toBe(amount);
    expect(history.snapshot.used).toBe(0);
  });

  it('동일한 유저에게 동시에 적립을 시도해도 동시성 문제가 발생하지 않는다', async () => {
    const userId = 'user-dup';
    const amount = 100;
    const count = 5;

    await Promise.all(
      Array.from({ length: count }, () =>
        pointService.accumulate(userId, amount),
      ),
    );

    // 포인트 상태 검증
    const summary = await pointService.get(userId);
    expect(summary.point).toBe(amount * count);
    expect(summary.total).toBe(amount * count);
    expect(summary.used).toBe(0);

    // 포인트 이력 정합성 검증
    const histories = await pointHistoryModel.find({ user: userId });
    expect(histories.length).toBe(count);
    expect(histories[histories.length - 1].snapshot.point).toBe(amount * count);
  });

  it('포인트 요약 조회 시 없으면 새로 생성한다', async () => {
    const userId = 'user-new';
    const result = await pointService.get(userId);

    expect(result).toBeDefined();
    expect(result.user).toBe(userId);
    expect(result.point).toBe(0);
    expect(result.total).toBe(0);
    expect(result.used).toBe(0);
  });
});
