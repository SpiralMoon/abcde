import { InventoryEntity } from './inventory.schema';

export class ResInventory {
  items: {
    code: number;
    quantity: number;
  }[];

  static fromEntity(entity: InventoryEntity): ResInventory {
    return {
      items: entity.items.map((item) => ({
        code: item.code,
        quantity: item.quantity,
      })),
    };
  }
}
