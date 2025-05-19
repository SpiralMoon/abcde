import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { ItemModule } from '../item/item.module';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryEntity, InventorySchema } from './inventory.schema';
import { InventoryController } from './inventory.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: InventoryEntity.name,
        schema: InventorySchema,
      },
    ]),
    ItemModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
