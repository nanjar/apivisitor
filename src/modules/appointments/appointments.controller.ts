import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentVisitor } from '../../common/decorators/current-user.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentListQueryDto } from './dto/appointment-list-query.dto';
import { AppointmentsService } from './appointments.service';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Screen: Appointment Booking
  @Post()
  create(@CurrentUser() user: CurrentVisitor, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(user.eventsId, user.guestsId, dto);
  }

  // Dropdown "Day Slot" di Meeting Setup
  @Get('agendas')
  getAgendas(@CurrentUser() user: CurrentVisitor) {
    return this.appointmentsService.getAgendas(user.eventsId);
  }

  // Dropdown "Meeting Location" di Meeting Setup
  @Get('meeting-locations')
  getMeetingLocations(@CurrentUser() user: CurrentVisitor) {
    return this.appointmentsService.getMeetingLocations(user.eventsId);
  }

  // Checkbox "Interest 1/2/dst" di Meeting Setup
  @Get('interest-options')
  getInterestOptions(@CurrentUser() user: CurrentVisitor) {
    return this.appointmentsService.getInterestOptions(user.eventsId);
  }

  // Dropdown "Time Slot" di Meeting Setup - butuh companyId + agendaId
  // (slot yang tersedia beda-beda per company per hari)
  @Get('time-slots')
  getAvailableTimeSlots(
    @CurrentUser() user: CurrentVisitor,
    @Query('companyId', ParseIntPipe) companyId: number,
    @Query('agendaId', ParseIntPipe) agendaId: number,
  ) {
    return this.appointmentsService.getAvailableTimeSlots(user.eventsId, companyId, agendaId);
  }

  // Screen: Appointment List
  @Get()
  list(@CurrentUser() user: CurrentVisitor, @Query() query: AppointmentListQueryDto) {
    return this.appointmentsService.list(user.eventsId, user.guestsId, query);
  }

  @Patch(':id/cancel')
  cancel(@CurrentUser() user: CurrentVisitor, @Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.cancel(user.eventsId, user.guestsId, id);
  }
}
