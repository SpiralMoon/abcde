import { Module } from '@nestjs/common';
import { RewardService } from './reward.service';
import { PointModule } from '../point/point.module';
import { InventoryModule } from '../inventory/inventory.module';
import { RewardController } from './reward.controller';
import { ItemModule } from '../item/item.module';

@Module({
  imports: [PointModule, InventoryModule, ItemModule],
  controllers: [RewardController],
  providers: [RewardService],
  exports: [RewardService],
})
export class RewardModule {}
