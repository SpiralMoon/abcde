import { Injectable } from '@nestjs/common';
import { PointService } from '../point/point.service';
import {
  EventReward,
  isItemReward,
  isPointReward,
} from '../event/event.schema';
import { InventoryService } from '../inventory/inventory.service';
import { ItemEntity } from '../item/item.schema';
import { ItemService } from '../item/item.service';
import { ApiException, ErrorCode } from '../common/exceptions';

/**
 * 보상 지급 서비스 입니다.
 */
@Injectable()
export class RewardService {
  constructor(
    private readonly pointService: PointService,
    private readonly itemService: ItemService,
    private readonly inventoryService: InventoryService,
  ) {}

  /**
   * 보상을 지급 합니다.
   * @param userId 유저 식별자
   * @param reward 지급할 보상
   */
  async provide<T extends EventReward>(userId: string, reward: T) {
    // 아이템 보상 제공
    if (isItemReward(reward)) {
      const { code, quantity } = reward;
      await this.inventoryService.addItem(userId, { code, quantity });
    }
    // 포인트 보상 제공
    else if (isPointReward(reward)) {
      const { point } = reward;
      await this.pointService.accumulate(userId, point);
    }
    // 핸들링되지 않은 보상
    else {
      throw new ApiException(
        ErrorCode.UserEventRewardNotFound,
        'Not supported reward type.',
      );
    }
  }

  /**
   * 보상으로 등록 가능한 아이템인지 확인 합니다.
   *
   * 기준 : 시스템 내에 존재하는 아이템인지 확인
   * @param itemCodes 아이템 코드
   */
  isRewardableItem(...itemCodes: ItemEntity['code'][]): boolean {
    return itemCodes.every((code) => {
      try {
        this.itemService.getItem(code);
        return true;
      } catch {
        return false;
      }
    });
  }
}
