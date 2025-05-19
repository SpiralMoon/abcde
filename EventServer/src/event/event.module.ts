import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEntity, EventSchema } from './event.schema';
import { EventController } from './event.controller';
import { RewardModule } from '../reward/reward.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: EventEntity.name,
        schema: EventSchema,
      },
    ]),
    RewardModule,
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
