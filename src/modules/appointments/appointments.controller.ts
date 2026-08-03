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
