import { Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { ScheduleService } from './schedule.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Schedule')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // Screen: Event Schedule — dengan search (?keyword=, nyari di nama hari/
  // track/judul sesi sekaligus), filter hari (?agendaId=), filter track (?trackId=)
  @Get()
  getRundown(@CurrentUser() user: CurrentVisitor, @Query() query: ScheduleQueryDto) {
    return this.scheduleService.getRundown(user.eventsId, query);
  }

  // Filter chip berdasarkan Track (rekomendasi dipakai gantiin kategori —
  // lebih simpel, langsung ngikutin struktur agenda->track). Opsional
  // ?agendaId= buat scope ke hari tertentu (track beda-beda tiap hari).
  @Get('tracks')
  getTracks(@CurrentUser() user: CurrentVisitor, @Query('agendaId') agendaId?: string) {
    return this.scheduleService.getTracks(
      user.eventsId,
      agendaId !== undefined ? Number(agendaId) : undefined,
    );
  }

  @Get('sessions/:sessionId')
  getSessionDetail(
    @CurrentUser() user: CurrentVisitor,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query('trackId', ParseIntPipe) trackId: number,
    @Query('agendaId', ParseIntPipe) agendaId: number,
  ) {
    return this.scheduleService.getSessionDetail(
      user.eventsId,
      sessionId,
      trackId,
      agendaId,
      user.guestsId,
    );
  }

  // Screen: "My Schedule" — daftar sesi yang udah disimpen visitor
  @Get('my-schedule')
  getMySchedule(@CurrentUser() user: CurrentVisitor) {
    return this.scheduleService.getMySchedule(user.eventsId, user.guestsId);
  }

  // Tombol "Add to My Schedule" di Speaker Detail / Event Schedule
  @Post('sessions/:sessionId/save')
  saveSession(
    @CurrentUser() user: CurrentVisitor,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query('trackId', ParseIntPipe) trackId: number,
    @Query('agendaId', ParseIntPipe) agendaId: number,
  ) {
    return this.scheduleService.saveSession(user.eventsId, user.guestsId, sessionId, trackId, agendaId);
  }

  @Delete('sessions/:sessionId/save')
  unsaveSession(
    @CurrentUser() user: CurrentVisitor,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query('trackId', ParseIntPipe) trackId: number,
    @Query('agendaId', ParseIntPipe) agendaId: number,
  ) {
    return this.scheduleService.unsaveSession(
      user.eventsId,
      user.guestsId,
      sessionId,
      trackId,
      agendaId,
    );
  }
}
