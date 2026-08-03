import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Analytics')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // Screen: Visitor Analytics
  @Get('me')
  getMyAnalytics(@CurrentUser() user: CurrentVisitor) {
    return this.analyticsService.getMyAnalytics(user.eventsId, user.guestsId);
  }
}
