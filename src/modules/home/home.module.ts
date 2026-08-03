import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../events/entities/event.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { EventMeeting } from '../appointments/entities/event-meeting.entity';
import { VenueSpace } from '../venue/entities/venue-space.entity';
import { LocationAddress } from '../venue/entities/location-address.entity';
import { CheckinModule } from '../checkin/checkin.module';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, ExhibitorCompany, EventMeeting, VenueSpace, LocationAddress]),
    CheckinModule,
  ],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
