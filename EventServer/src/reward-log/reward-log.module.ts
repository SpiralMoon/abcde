import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardLogEntity, RewardLogSchema } from './reward-log.schema';
import { RewardLogger } from './reward-log.interceptor';
import { RewardLogController } from './reward-log.controller';
import { RewardLogService } from './reward-log.service';

const RewardLogModel = MongooseModule.forFeature([
  {
    name: RewardLogEntity.name,
    schema: RewardLogSchema,
  },
]);

@Module({
  imports: [RewardLogModel],
  controllers: [RewardLogController],
  providers: [RewardLogService, RewardLogger],
  exports: [RewardLogService, RewardLogger, RewardLogModel],
})
export class RewardLogModule {}
