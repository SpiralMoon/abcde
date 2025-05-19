export enum ErrorCode {
  UserNotFound = 1000,
  UserAlreadyExist = 1001,
  EventNotFound = 2000,
  EventUnavailable = 2001,
  ItemNotFound = 3000,
  UserEventNotFound = 4000,
  UserEventAlreadyAccepted = 4001,
  UserEventPreConditionNotCompleted = 4002,
  UserEventRewardNotFound = 4003,
  UserEventRewardNotEnough = 4004,
  UserEventNotCompleted = 4005,
  RouteTargetDead = 9000,
  PermissionDenied = 9001,
  Undefined = 9999,
}

export class ApiException extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
  ) {
    super(message);
  }
}
