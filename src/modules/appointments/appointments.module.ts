import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventMeeting } from './entities/event-meeting.entity';
import { VenueSpace } from '../venue/entities/venue-space.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventMeeting, VenueSpace])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
