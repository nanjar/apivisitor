import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agenda } from './entities/agenda.entity';
import { Track } from './entities/track.entity';
import { Session } from './entities/session.entity';
import { SessionSpeaker } from './entities/session-speaker.entity';
import { EventSpeaker } from '../speakers/entities/event-speaker.entity';
import { VisitorSavedSession } from './entities/visitor-saved-session.entity';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Agenda,
      Track,
      Session,
      SessionSpeaker,
      EventSpeaker,
      VisitorSavedSession,
    ]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
