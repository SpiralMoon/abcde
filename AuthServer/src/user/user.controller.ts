import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ReqUserCreateForm, ResUser } from './user.dto';
import {UserRoles} from "../common/roles/roles";

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body(new ValidationPipe()) form: ReqUserCreateForm,
  ): Promise<ResUser> {
    const result = await this.userService.createUser(form);
    return ResUser.fromEntity(result);
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<ResUser> {
    const result = await this.userService.getUser(id);
    return ResUser.fromEntity(result);
  }

  @Patch(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: UserRoles,
  ): Promise<ResUser> {
    const result = await this.userService.updateUserRole(id, role);
    return ResUser.fromEntity(result);
  }
}
