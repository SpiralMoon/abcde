import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ItemService } from './item.service';

@Controller('items')
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  getItems() {
    return this.itemService.getItems();
  }

  @Get(':code')
  getItem(@Param('code', ParseIntPipe) code: number) {
    return this.itemService.getItem(code);
  }
}
