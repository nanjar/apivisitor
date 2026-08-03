import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { BadgeService } from './badge.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Badge')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('badge')
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  // Screen: QR Badge
  @Get()
  getBadge(@CurrentUser() user: CurrentVisitor) {
    return this.badgeService.getBadge(user.eventsId, user.guestsId);
  }

  @Get('checkin-history')
  getCheckinHistory(@CurrentUser() user: CurrentVisitor) {
    return this.badgeService.getCheckinHistory(user.eventsId, user.guestsId);
  }
}
