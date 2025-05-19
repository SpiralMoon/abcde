import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserPointEntity, UserPointSchema } from './point.schema';
import { PointService } from './point.service';
import {
  UserPointHistoryEntity,
  UserPointHistorySchema,
} from './point-history.schema';
import { PointController } from './point.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: UserPointEntity.name,
        schema: UserPointSchema,
      },
      {
        name: UserPointHistoryEntity.name,
        schema: UserPointHistorySchema,
      },
    ]),
  ],
  controllers: [PointController],
  providers: [PointService],
  exports: [PointService],
})
export class PointModule {}
