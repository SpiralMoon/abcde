import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { getConnectionToken, MongooseModule } from '@nestjs/mongoose';
import { ClsModule } from 'nestjs-cls';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterMongoose } from './lib/transaction/transactional-adapter-mongoose';
import { PointModule } from './point/point.module';
import mongoose from 'mongoose';
import { GlobalClsTransactionPlugin } from './lib/transaction/transaction-hook';
import { EventModule } from './event/event.module';
import { InventoryModule } from './inventory/inventory.module';
import { ItemModule } from './item/item.module';
import { UserEventModule } from './user-event/user-event.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DtoWrappingInterceptor } from './interceptor';
import { ApiFilter } from './filter';
import { RewardModule } from './reward/reward.module';
import { RewardLogModule } from './reward-log/reward-log.module';

mongoose.plugin(GlobalClsTransactionPlugin);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
      envFilePath: '.env',
    }),
    MongooseModule.forRoot(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DATABASE_NAME,
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
    EventModule,
    PointModule,
    InventoryModule,
    ItemModule,
    UserEventModule,
    RewardModule,
    RewardLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: DtoWrappingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ApiFilter,
    },
  ],
})
export class AppModule {}
