import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ReqLoginForm, ResAuthResult } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body(new ValidationPipe()) form: ReqLoginForm,
  ): Promise<ResAuthResult> {
    const accessToken = await this.authService.authenticate(
      form.email,
      form.password,
    );

    return {
      accessToken,
    };
  }
}
