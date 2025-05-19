import { Controller, Get, Param } from '@nestjs/common';
import { PointService } from './point.service';
import { ResPoint } from './point.dto';

@Controller('users/:userId/point')
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @Get()
  async getPoint(@Param('userId') userId: string): Promise<ResPoint> {
    const result = await this.pointService.get(userId);
    return ResPoint.fromEntity(result);
  }
}
