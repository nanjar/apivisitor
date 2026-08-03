import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { ScheduleService } from './schedule.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Schedule')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // Screen: Event Schedule
  @Get()
  getRundown(@CurrentUser() user: CurrentVisitor) {
    return this.scheduleService.getRundown(user.eventsId);
  }

  @Get('sessions/:sessionId')
  getSessionDetail(
    @CurrentUser() user: CurrentVisitor,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query('trackId', ParseIntPipe) trackId: number,
    @Query('agendaId', ParseIntPipe) agendaId: number,
  ) {
    return this.scheduleService.getSessionDetail(user.eventsId, sessionId, trackId, agendaId);
  }
}
