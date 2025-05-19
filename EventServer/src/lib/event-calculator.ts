import { EventCondition } from '../event/event.schema';
import { UserDataSet } from '../user-data-set/user-data-set.schema';

/**
 * 유저의 서비스 이용 데이터 세트를 기반으로 이벤트의 완료 조건을 계산하는 클래스 입니다.
 */
export class EventCalculator {
  constructor(
    private readonly condition: EventCondition,
    private readonly userDataSet: UserDataSet,
  ) {}

  /**
   * 이벤트의 완료 조건을 계산 합니다.
   */
  isComplete(): boolean {
    // 수식으로 변환된 조건을 평가 합니다.
    // 모든 조건을 만족하면 이벤트 완료로 간주 합니다.
    return this.condition.expressions.every(({ syntax, operator }) => {
      const [key, value] = syntax;

      switch (operator) {
        case 'eq':
          return this.userDataSet[key] === value;
        case 'neq':
          return this.userDataSet[key] !== value;
        case 'gte':
          return this.userDataSet[key] >= value;
        case 'gt':
          return this.userDataSet[key] > value;
        case 'lte':
          return this.userDataSet[key] <= value;
        case 'lt':
          return this.userDataSet[key] < value;
        default:
          throw new Error(`Unknown operator: ${operator}`);
      }
    });
  }
}
