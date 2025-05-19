import {
  Body,
  Controller,
  Get,
  Param,
  Post, UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { UserEventService } from './user-event.service';
import { ReqUserEventTakeRewardForm, ResUserEvent } from './user-event.dto';
import {RewardLogger} from "../reward-log/reward-log.interceptor";

@Controller('users/:userId/events')
export class UserEventController {
  constructor(private readonly userEventService: UserEventService) {}

  @Post(':eventId')
  async accept(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ): Promise<ResUserEvent> {
    const result = await this.userEventService.accept(userId, eventId);
    return ResUserEvent.fromEntity(result);
  }

  @Get(':eventId')
  async getEvent(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ): Promise<ResUserEvent> {
    const result = await this.userEventService.getEvent(userId, eventId);
    return ResUserEvent.fromEntity(result);
  }

  @Get()
  async getEvents(@Param('userId') userId: string): Promise<ResUserEvent[]> {
    const results = await this.userEventService.getEvents(userId);
    return ResUserEvent.fromEntities(results);
  }

  @Post(':eventId/refresh')
  async refresh(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ): Promise<ResUserEvent> {
    const result = await this.userEventService.refresh(userId, eventId);
    return ResUserEvent.fromEntity(result);
  }

  @Post(':eventId/take-reward')
  @UseInterceptors(RewardLogger)
  async takeReward(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
    @Body(new ValidationPipe()) form: ReqUserEventTakeRewardForm,
  ): Promise<ResUserEvent> {
    const result = await this.userEventService.takeReward(
      userId,
      eventId,
      form,
    );
    return ResUserEvent.fromEntity(result);
  }
}
