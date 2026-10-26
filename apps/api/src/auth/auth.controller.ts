import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  ForbiddenException,
  Delete,
  Param,
} from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RegisterDto, LoginDto } from './auth.dto';
import { AuthUser } from '../auth/user.decorator';
import type { AuthUserPayload } from '../auth/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password);
  }
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  getProfile(@AuthUser() user: AuthUserPayload) {
    return user;
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('impersonate')
  async impersonate(
    @AuthUser() user: AuthUserPayload,
    @Body() body: { targetUserId: string },
  ) {
    const adminId = user.sub;
    return this.authService.impersonateUser(adminId, body.targetUserId);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('OWNER')
  @Post('assistants')
  async assistants(
    @AuthUser() user: AuthUserPayload,
    @Body() body: RegisterDto,
  ) {
    if (user.is_impersonating)
      throw new ForbiddenException(
        'This action is not permitted in admin mode.',
      );

    const adminId = user.sub;
    return this.authService.createAssistant(adminId, body.email, body.password);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles('OWNER')
  @Delete('assistants/:id')
  async removeAssistant(
    @AuthUser() user: AuthUserPayload,
    @Param('id') id: string,
  ) {
    if (user.is_impersonating) throw new ForbiddenException('Not permitted');
    return this.authService.removeAssistant(user.sub, id);
  }
}
