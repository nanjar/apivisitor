import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinBooth } from '../checkin/entities/checkin-booth.entity';
import { EventMeeting } from '../appointments/entities/event-meeting.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { EventChatMember } from '../chat/entities/event-chat-member.entity';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CheckinBooth, EventMeeting, Favorite, EventChatMember]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
