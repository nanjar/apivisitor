import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { HomeService } from './home.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Home')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('dashboard')
  getDashboard(@CurrentUser() user: CurrentVisitor) {
    return this.homeService.getDashboard(user.eventsId, user.guestsId);
  }
}
