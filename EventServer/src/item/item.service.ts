import { Injectable } from '@nestjs/common';
import { ItemEntity } from './item.schema';
import { ApiException, ErrorCode } from '../common/exceptions';

/**
 * 아이템 서비스 입니다.
 */
@Injectable()
export class ItemService {
  /**
   * 아이템 목록
   */
  private readonly items: ItemEntity[] = [
    {
      code: 10100,
      name: '파워엘릭서',
      description:
        '전설의 비약이다.\nHP, MP를 모두 회복시킨다. 단, 최대 HP, MP가 99,999를 초과할 경우는 HP, MP를 99,999로 회복한다.',
    },
    {
      code: 15100,
      name: '선택 심볼 교환권',
      description:
        '더블 클릭하여 사용하면 다음 아이템 중 1개를 선택해 얻을 수 있다.\n\n- 선택 아케인심볼 교환권 500개\n- 선택 어센틱심볼 교환권 100개',
    },
    {
      code: 15200,
      name: '아이템 버닝 상자',
      description:
        '더블클릭하면 직업에 맞는 도전자의 장비 세트를 획득할 수 있다.\n\n- 제로 직업군은 도전자의 무기가 지급되지 않습니다.\n- 아이템 사용 후 효과를 취소할 수 없습니다.',
    },
    {
      code: 50200,
      name: '블랙 큐브',
      description:
        '장비 아이템의 잠재능력을 새롭게 설정시켜주는 신비한 큐브이다.\n\n결과물 최고 등급: 레전드리',
    },
    {
      code: 50400,
      name: '화이트 에디셔널 큐브',
      description:
        '장비 아이템의 에디셔널 잠재능력을 새롭게 설정시켜주는 신비한 큐브이다.\n\n결과물 최고 등급: 레전드리',
    },
  ];

  /**
   * 아이템을 조회 합니다.
   * @param code 아이템 코드
   */
  getItem(code: number): ItemEntity {
    const item = this.items.find((item) => item.code === code);

    if (!item) {
      throw new ApiException(ErrorCode.ItemNotFound, 'Item not found.');
    }

    return item;
  }

  /**
   * 아이템 목록을 조회 합니다.
   */
  getItems(): ItemEntity[] {
    return this.items;
  }
}
