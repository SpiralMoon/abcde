import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection } from 'mongoose';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterMongoose } from '../lib/transaction/transactional-adapter-mongoose';
import { GlobalClsTransactionPlugin } from '../lib/transaction/transaction-hook';
import { UserDataSetService } from './user-data-set.service';
import { UserDataSetModule } from './user-data-set.module';

mongoose.plugin(GlobalClsTransactionPlugin);

describe('UserDataSetService 통합 테스트', () => {
  let module: TestingModule;
  let userDataSetService: UserDataSetService;
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
            dbName: 'test_user_data_set_' + config.get('MONGO_DATABASE_NAME'),
          }),
          inject: [ConfigService],
        }),
        UserDataSetModule,
      ],
    }).compile();

    userDataSetService = module.get(UserDataSetService);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.db.dropDatabase();
    await connection.close();
  });

  it('유저 데이터 셋을 설정하면 정상 저장된다', async () => {
    const userId = 'user-001';
    const data = {
      $user_level: 120,
      $total_hunt_count: 5000,
    };

    const result = await userDataSetService.setUserDataSet(userId, data);

    expect(result).toBeDefined();
    expect(result.user).toBe(userId);
    expect(result.data.$user_level).toBe(120);
    expect(result.data.$total_hunt_count).toBe(5000);
  });

  it('유저 데이터 셋을 조회하면 기존 값을 반환한다', async () => {
    const userId = 'user-002';
    const initData = { $today_hunt_count: 50 };

    await userDataSetService.setUserDataSet(userId, initData);

    const result = await userDataSetService.getUserDataSet(userId);

    expect(result.user).toBe(userId);
    expect(result.data.$today_hunt_count).toBe(50);
  });

  it('getUserDataSet 호출 시 데이터가 없으면 새로 생성된다', async () => {
    const userId = 'user-new';

    const result = await userDataSetService.getUserDataSet(userId);

    expect(result).toBeDefined();
    expect(result.user).toBe(userId);
    expect(result.data).toEqual({});
  });

  it('setUserDataSet을 여러 번 호출하면 기존 데이터를 덮어쓴다', async () => {
    const userId = 'user-003';

    await userDataSetService.setUserDataSet(userId, {
      $user_level: 100,
    });

    await userDataSetService.setUserDataSet(userId, {
      $user_level: 200,
    });

    const result = await userDataSetService.getUserDataSet(userId);
    expect(result.data.$user_level).toBe(200);
  });
});
