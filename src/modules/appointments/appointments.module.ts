import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventMeeting } from './entities/event-meeting.entity';
import { VenueSpace } from '../venue/entities/venue-space.entity';
import { CompanyTimeslot } from './entities/company-timeslot.entity';
import { MeetingLocationV2 } from './entities/meeting-location-v2.entity';
import { Agenda } from '../schedule/entities/agenda.entity';
import { ExhCompanySpace } from '../venue/entities/exh-company-space.entity';
import { InterestOption } from './entities/interest-option.entity';
import { MeetingInterest } from './entities/meeting-interest.entity';
import { ExhibitorHaveCompany } from '../exhibitor-app/entities/exhibitor-have-company.entity';
import { ExhibitorNotification } from '../exhibitor-app/entities/exhibitor-notification.entity';
import { GuestTicket } from '../visitors/entities/guest-ticket.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EventMeeting,
      VenueSpace,
      CompanyTimeslot,
      MeetingLocationV2,
      Agenda,
      ExhCompanySpace,
      InterestOption,
      MeetingInterest,
      ExhibitorHaveCompany,
      ExhibitorNotification,
      GuestTicket,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
