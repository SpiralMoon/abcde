import { Controller, Get, Param } from '@nestjs/common';
import { RewardLogService } from './reward-log.service';

@Controller()
export class RewardLogController {
  constructor(private readonly rewardLogService: RewardLogService) {}

  @Get('reward-logs')
  getAllRewardLogs() {
    return this.rewardLogService.getAllRewardLogs();
  }

  @Get('users/:userId/reward-logs')
  getUserRewardLogs(@Param('userId') userId: string) {
    return this.rewardLogService.getUserRewardLogs(userId);
  }
}
