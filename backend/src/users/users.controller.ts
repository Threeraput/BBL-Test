import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { type AuthenticatedRequest } from '../auth/auth.types';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get('me')
  async getMe(@Req() request: AuthenticatedRequest) {
    const { subject, payload, token } = request.auth!;

    const user = await this.usersService.upsertFromToken(payload, token);

    return user;
  }
}
