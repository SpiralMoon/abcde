import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UserDataSetService } from './user-data-set.service';

@Controller('users/:userId/data-set')
export class UserDataSetController {
  constructor(private readonly userDataSetService: UserDataSetService) {}

  @Patch()
  async setUserDataSet(
    @Param('userId') userId: string,
    @Body() dataSets: object,
  ) {
    return this.userDataSetService.setUserDataSet(userId, dataSets);
  }

  @Get()
  async getUserDataSet(@Param('userId') userId: string) {
    return this.userDataSetService.getUserDataSet(userId);
  }
}
