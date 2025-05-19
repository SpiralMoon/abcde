import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { ErrorCode, ApiException } from '../common/exceptions';
import mongoose, { Connection } from 'mongoose';
import { InventoryModule } from './inventory.module';
import { GlobalClsTransactionPlugin } from '../lib/transaction/transaction-hook';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterMongoose } from '../lib/transaction/transactional-adapter-mongoose';

mongoose.plugin(GlobalClsTransactionPlugin);

describe('InventoryService 통합 테스트', () => {
  let module: TestingModule;
  let inventoryService: InventoryService;
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
            dbName: 'test_inventory_' + config.get('MONGO_DATABASE_NAME'),
          }),
          inject: [ConfigService],
        }),
        InventoryModule,
      ],
    }).compile();

    inventoryService = module.get(InventoryService);
    connection = module.get<Connection>(getConnectionToken());
  });

  afterAll(async () => {
    await connection.db.dropDatabase();
    await connection.close();
  });

  it('인벤토리에 새 아이템을 추가하면 새로운 항목이 생성된다', async () => {
    const userId = 'user-001';
    const itemCode = 10100;
    const quantity = 2;

    await inventoryService.addItem(userId, {
      code: itemCode,
      quantity: quantity,
    });

    const inventory = await inventoryService.getInventory(userId);
    const item = inventory.items.find((i) => i.code === itemCode);

    expect(item).toBeDefined();
    expect(item.quantity).toBe(quantity);
  });

  it('이미 존재하는 아이템을 추가하면 수량이 증가한다', async () => {
    const userId = 'user-002';
    const itemCode = 50200;
    const quantityA = 1;
    const quantityB = 1;

    await inventoryService.addItem(userId, {
      code: itemCode,
      quantity: quantityA,
    });
    await inventoryService.addItem(userId, {
      code: itemCode,
      quantity: quantityB,
    });

    const inventory = await inventoryService.getInventory(userId);
    const item = inventory.items.find((i) => i.code === itemCode);

    expect(item).toBeDefined();
    expect(item.quantity).toBe(quantityA + quantityB);
  });

  it('인벤토리가 없을 경우 getInventory가 새로 생성한다', async () => {
    const userId = 'user-new';
    const inventory = await inventoryService.getInventory(userId);

    expect(inventory).toBeDefined();
    expect(inventory.user).toBe(userId);
    expect(inventory.items.length).toBe(0);
  });

  it('존재하지 않는 아이템 코드를 추가하려 하면 예외가 발생한다', async () => {
    const userId = 'user-error';
    const invalidItemCode = 999999;

    try {
      await inventoryService.addItem(userId, {
        code: invalidItemCode,
        quantity: 1,
      });
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.ItemNotFound);
    }
  });
});
