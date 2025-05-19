import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardModule } from '../reward/reward.module';
import { EventModule } from '../event/event.module';
import { UserEventEntity, UserEventSchema } from './user-event.schema';
import { UserEventController } from './user-event.controller';
import { UserEventService } from './user-event.service';
import { UserDataSetModule } from '../user-data-set/user-data-set.module';
import {RewardLogModule} from "../reward-log/reward-log.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserEventEntity.name,
        schema: UserEventSchema,
      },
    ]),
    EventModule,
    RewardModule,
    RewardLogModule,
    UserDataSetModule,
  ],
  controllers: [UserEventController],
  providers: [UserEventService],
})
export class UserEventModule {}
