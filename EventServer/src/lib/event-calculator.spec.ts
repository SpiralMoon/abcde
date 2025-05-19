import { EventCalculator } from './event-calculator';
import {
  EventCondition,
  EventConditionExpressionOperators,
} from '../event/event.schema';
import {
  UserDataSet,
  UserDataSetKeys,
} from '../user-data-set/user-data-set.schema';

describe('EventCalculator', () => {
  const condition = (
    operator: EventConditionExpressionOperators,
    key: UserDataSetKeys,
    value: number,
  ): EventCondition => ({
    expressions: [
      {
        operator,
        syntax: [key, value],
      },
    ],
  });

  const userDataSet: UserDataSet = {
    $user_level: 120,
    $total_hunt_count: 5000,
    $today_hunt_count: 3,
  };

  it('gte 조건을 만족하면 true를 반환한다', () => {
    const calc = new EventCalculator(
      condition('gte', '$user_level', 100),
      userDataSet,
    );
    expect(calc.isComplete()).toBe(true);
  });

  it('lte 조건을 만족하지 않으면 false를 반환한다', () => {
    const calc = new EventCalculator(
      condition('lte', '$total_hunt_count', 1000),
      userDataSet,
    );
    expect(calc.isComplete()).toBe(false);
  });

  it('eq 조건이 정확히 일치하면 true를 반환한다', () => {
    const calc = new EventCalculator(
      condition('eq', '$today_hunt_count', 3),
      userDataSet,
    );
    expect(calc.isComplete()).toBe(true);
  });

  it('neq 조건이 다르면 true를 반환한다', () => {
    const calc = new EventCalculator(
      condition('neq', '$today_hunt_count', 5),
      userDataSet,
    );
    expect(calc.isComplete()).toBe(true);
  });

  it('모든 조건을 만족해야 true를 반환한다', () => {
    const fullCondition: EventCondition = {
      expressions: [
        { operator: 'gte', syntax: ['$user_level', 100] },
        { operator: 'lte', syntax: ['$today_hunt_count', 5] },
        { operator: 'eq', syntax: ['$total_hunt_count', 5000] },
      ],
    };

    const calc = new EventCalculator(fullCondition, userDataSet);
    expect(calc.isComplete()).toBe(true);
  });

  it('하나라도 조건을 만족하지 않으면 false를 반환한다', () => {
    const partialFailCondition: EventCondition = {
      expressions: [
        { operator: 'gte', syntax: ['$user_level', 100] },
        { operator: 'lt', syntax: ['$today_hunt_count', 3] }, // false
      ],
    };

    const calc = new EventCalculator(partialFailCondition, userDataSet);
    expect(calc.isComplete()).toBe(false);
  });

  it('알 수 없는 연산자를 사용하면 예외를 던진다', () => {
    const badCondition: EventCondition = {
      expressions: [
        {
          operator: 'unknown_operator' as any,
          syntax: ['$user_level', 100],
        },
      ],
    };

    const calc = new EventCalculator(badCondition, userDataSet);
    expect(() => calc.isComplete()).toThrowError(
      'Unknown operator: unknown_operator',
    );
  });
});
