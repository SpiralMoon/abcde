import { InventoryService } from './inventory.service';
import { Controller, Get, Param } from '@nestjs/common';
import { ResInventory } from './inventory.dto';

@Controller('users/:userId/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async getInventory(@Param('userId') userId: string): Promise<ResInventory> {
    const result = await this.inventoryService.getInventory(userId);
    return ResInventory.fromEntity(result);
  }
}
