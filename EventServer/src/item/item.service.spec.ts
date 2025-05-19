import { Test, TestingModule } from '@nestjs/testing';
import { ItemService } from './item.service';
import { ApiException, ErrorCode } from '../common/exceptions';
import { ItemModule } from './item.module';

describe('ItemService 유닛 테스트', () => {
  let itemService: ItemService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ItemModule],
    }).compile();

    itemService = module.get(ItemService);
  });

  it('존재하는 아이템 코드를 조회하면 정상적으로 반환된다', () => {
    const item = itemService.getItem(10100);

    expect(item).toBeDefined();
    expect(item.name).toBe('파워엘릭서');
  });

  it('존재하지 않는 아이템 코드를 조회하면 예외가 발생한다', () => {
    const invalidCode = 99999;

    try {
      itemService.getItem(invalidCode);
      fail('예외가 발생해야 합니다');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiException);
      expect(err.code).toBe(ErrorCode.ItemNotFound);
    }
  });

  it('전체 아이템 목록을 조회하면 5개의 아이템이 반환된다', () => {
    const items = itemService.getItems();

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(5);
    expect(items[0]).toHaveProperty('code');
    expect(items[0]).toHaveProperty('name');
    expect(items[0]).toHaveProperty('description');
  });
});
