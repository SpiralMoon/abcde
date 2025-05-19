import {
  Body,
  Controller,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { EventService } from './event.service';
import { ReqEventCreateForm, ResEvent } from './event.dto';
import { XUser } from '../decorators/user.decorator';
import { User } from '../common/interfaces/user';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  async createEvent(
    @Body(new ValidationPipe()) form: ReqEventCreateForm,
    @XUser() user: User,
  ): Promise<ResEvent> {
    const result = await this.eventService.createEvent({
      ...form,
      issuer: user.id,
    });
    return ResEvent.fromEntity(result);
  }

  @Get(':id')
  async getEvent(@Param('id') id: string) {
    const result = await this.eventService.getEvent(id);
    return ResEvent.fromEntity(result);
  }

  @Get()
  async getEvents() {
    const results = await this.eventService.getEvents();
    return ResEvent.fromEntities(results);
  }

  @Patch(':id/status')
  async updateEventStatus(
    @Param('id') id: string,
    @Body('state', ParseBoolPipe) state: boolean,
  ) {
    const result = await this.eventService.updateEventEnabled(id, state);
    return ResEvent.fromEntity(result);
  }
}
