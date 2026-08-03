import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckinBooth } from '../checkin/entities/checkin-booth.entity';
import { EventMeeting } from '../appointments/entities/event-meeting.entity';
import { Favorite } from '../favorites/entities/favorite.entity';
import { EventChatMember } from '../chat/entities/event-chat-member.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(CheckinBooth) private readonly checkinRepo: Repository<CheckinBooth>,
    @InjectRepository(EventMeeting) private readonly meetingRepo: Repository<EventMeeting>,
    @InjectRepository(Favorite) private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(EventChatMember)
    private readonly chatMemberRepo: Repository<EventChatMember>,
  ) {}

  // Screen: Visitor Analytics — statistik aktivitas visitor SENDIRI
  // (bukan analytics buat organizer/exhibitor, itu di luar scope app ini)
  async getMyAnalytics(eventsId: number, guestsId: number) {
    const [
      boothsVisited,
      meetingsByStatus,
      favoritesCount,
      chatRoomsCount,
    ] = await Promise.all([
      this.getBoothsVisitedCount(eventsId, guestsId),
      this.getMeetingCountByStatus(eventsId, guestsId),
      this.favoriteRepo.count({ where: { eventsId, guestsId } }),
      this.chatMemberRepo.count({ where: { eventsId, guestsId } }),
    ]);

    return {
      boothsVisited,
      appointments: meetingsByStatus,
      favoritesCount,
      chatRoomsCount,
    };
  }

  private async getBoothsVisitedCount(eventsId: number, guestsId: number): Promise<number> {
    const row = await this.checkinRepo
      .createQueryBuilder('c')
      .select('COUNT(DISTINCT c.companyId)', 'count')
      .where('c.eventsId = :eventsId', { eventsId })
      .andWhere('c.guestsId = :guestsId', { guestsId })
      .getRawOne<{ count: string }>();
    return parseInt(row?.count ?? '0', 10);
  }

  private async getMeetingCountByStatus(eventsId: number, guestsId: number) {
    const rows = await this.meetingRepo
      .createQueryBuilder('m')
      .select('m.approvalStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('m.eventsId = :eventsId', { eventsId })
      .andWhere('m.initiatorId = :guestsId', { guestsId })
      .groupBy('m.approvalStatus')
      .getRawMany<{ status: string; count: string }>();

    const total = rows.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
    return {
      total,
      byStatus: Object.fromEntries(rows.map((r) => [r.status, parseInt(r.count, 10)])),
    };
  }
}
