import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventSpeaker } from './entities/event-speaker.entity';
import { SessionSpeaker } from '../schedule/entities/session-speaker.entity';
import { Session } from '../schedule/entities/session.entity';
import { SpeakersController } from './speakers.controller';
import { SpeakersService } from './speakers.service';

@Module({
  imports: [TypeOrmModule.forFeature([EventSpeaker, SessionSpeaker, Session])],
  controllers: [SpeakersController],
  providers: [SpeakersService],
})
export class SpeakersModule {}
