import { Injectable } from '@nestjs/common';
import { ItemService } from '../item/item.service';
import { Transactional } from '@nestjs-cls/transactional';
import { InjectModel } from '@nestjs/mongoose';
import { InventoryDocument, InventoryEntity } from './inventory.schema';
import { Model } from 'mongoose';

/**
 * 유저의 인벤토리 서비스 입니다.
 */
@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(InventoryEntity.name)
    private readonly inventoryModel: Model<InventoryDocument>,
    private readonly itemService: ItemService,
  ) {}

  /**
   * 유저의 인벤토리에 아이템을 추가 합니다. 이미 존재하는 아이템은 수량을 증가 시킵니다.
   * @param userId
   * @param form
   */
  @Transactional()
  async addItem(
    userId: string,
    form: { code: number; quantity: number },
  ): Promise<InventoryEntity> {
    const { code, quantity } = form;

    const item = this.itemService.getItem(code);

    const inventory = await this.getInventory(userId);
    const hasItem = inventory.items.find((item) => item.code === code);

    if (hasItem) {
      await this.inventoryModel.updateOne(
        {
          user: userId,
          'items.code': item.code,
        },
        {
          $inc: { 'items.$.quantity': quantity },
        },
      );
    } else {
      await this.inventoryModel.updateOne(
        { user: userId },
        {
          $push: {
            items: {
              code: item.code,
              quantity: quantity,
            },
          },
        },
      );
    }

    return;
  }

  /**
   * 유저의 인벤토리를 조회 합니다.
   * @param userId
   */
  async getInventory(userId: string): Promise<InventoryEntity> {
    return this.inventoryModel.findOneAndUpdate(
      { user: userId },
      {},
      {
        upsert: true,
        new: true,
      },
    );
  }
}
