import { Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: CurrentVisitor) {
    return this.notificationsService.list(user.eventsId, user.guestsId);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: CurrentVisitor) {
    return this.notificationsService.unreadCount(user.eventsId, user.guestsId);
  }

  @Patch(':id/read')
  markAsRead(@CurrentUser() user: CurrentVisitor, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(user.eventsId, user.guestsId, id);
  }
}
