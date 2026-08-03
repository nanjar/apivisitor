import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { EventMeeting } from './entities/event-meeting.entity';
import { VenueSpace } from '../venue/entities/venue-space.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentListQueryDto } from './dto/appointment-list-query.dto';
import { mapMeetingApprovalStatus } from './meeting-status.util';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(EventMeeting)
    private readonly meetingRepo: Repository<EventMeeting>,
    @InjectRepository(VenueSpace)
    private readonly venueSpaceRepo: Repository<VenueSpace>,
    private readonly i18n: I18nService,
  ) {}

  // Screen: Appointment Booking
  async create(eventsId: number, guestsId: number, dto: CreateAppointmentDto) {
    const start = new Date(dto.startDatetime);
    const end = new Date(dto.endDatetime);
    if (end <= start) {
      throw new BadRequestException(this.i18n.t('messages.errors.endBeforeStart'));
    }
    if (start < new Date()) {
      throw new BadRequestException(this.i18n.t('messages.errors.bookingInThePast'));
    }

    const space = await this.venueSpaceRepo.findOne({
      where: { id: dto.spaceId, venueId: dto.venueId, eventsId },
    });
    if (!space) {
      throw new BadRequestException(this.i18n.t('messages.errors.boothVenueNotFound'));
    }

    // Overlap-check + insert digabung dalam 1 transaction, dikunci dengan
    // Postgres advisory lock per (eventsId, venueId, spaceId) supaya dua
    // request booking untuk booth yang sama tidak lolos overlap-check
    // bersamaan (race condition -> double booking). Lock otomatis lepas
    // saat transaction commit/rollback.
    return this.meetingRepo.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1::int, hashtext($2))', [
        eventsId,
        `${dto.venueId}-${dto.spaceId}`,
      ]);

      const meetingRepo = manager.getRepository(EventMeeting);

      const conflict = await meetingRepo.findOne({
        where: {
          eventsId,
          venueId: dto.venueId,
          spaceId: dto.spaceId,
          status: 'OPEN' as any,
          startDatetime: LessThan(end) as any,
          endDatetime: MoreThan(start) as any,
        },
      });
      if (conflict) {
        throw new BadRequestException(this.i18n.t('messages.errors.slotAlreadyBooked'));
      }

      const maxIdRow = await meetingRepo
        .createQueryBuilder('m')
        .select('COALESCE(MAX(m.id), 0)', 'maxId')
        .where('m.eventsId = :eventsId', { eventsId })
        .getRawOne<{ maxId: string }>();
      const nextId = parseInt(maxIdRow?.maxId ?? '0', 10) + 1;

      const meeting = meetingRepo.create({
        id: nextId,
        eventsId,
        meetingTitle: dto.meetingTitle,
        startDatetime: start,
        endDatetime: end,
        notes: dto.notes ?? null,
        approvalStatus: 'PE', // menunggu konfirmasi exhibitor
        status: 'OPEN',
        venueId: dto.venueId,
        spaceId: dto.spaceId,
        initiatedBy: 'VI',
        initiatorId: guestsId,
        comDirection: 'V2E',
        isDone: 'N',
      });
      await meetingRepo.save(meeting);

      return {
        id: meeting.id,
        status: 'Pending',
        message: 'Permintaan appointment terkirim, menunggu konfirmasi exhibitor',
      };
    });
  }

  // Screen: Appointment List
  async list(eventsId: number, guestsId: number, query: AppointmentListQueryDto) {
    const qb = this.meetingRepo
      .createQueryBuilder('m')
      .where('m.eventsId = :eventsId', { eventsId })
      .andWhere('m.initiatorId = :guestsId', { guestsId }); // lihat catatan gap #5 di README

    const now = new Date();
    switch (query.status) {
      case 'upcoming':
        qb.andWhere('m.approvalStatus = :ap', { ap: 'AP' }).andWhere('m.startDatetime >= :now', { now });
        break;
      case 'pending':
        qb.andWhere('m.approvalStatus = :ap', { ap: 'PE' });
        break;
      case 'past':
        qb.andWhere('m.startDatetime < :now', { now }).andWhere('m.approvalStatus != :cl', { cl: 'CL' });
        break;
      case 'cancelled':
        qb.andWhere('m.approvalStatus = :cl', { cl: 'CL' });
        break;
      // 'all' -> tanpa filter tambahan
    }

    const meetings = await qb.orderBy('m.startDatetime', 'ASC').getMany();

    const results: Array<{
      id: number;
      meetingTitle: string | null;
      startDatetime: Date | null;
      endDatetime: Date | null;
      notes: string | null;
      status: string;
      hallLabel: string | null;
      boothLabel: string | null;
    }> = [];
    for (const meeting of meetings) {
      const space = meeting.spaceId
        ? await this.venueSpaceRepo.findOne({
            where: { id: meeting.spaceId, venueId: meeting.venueId, eventsId },
          })
        : null;

      results.push({
        id: meeting.id,
        meetingTitle: meeting.meetingTitle,
        startDatetime: meeting.startDatetime,
        endDatetime: meeting.endDatetime,
        notes: meeting.notes,
        status: mapMeetingApprovalStatus(this.i18n, meeting.approvalStatus),
        hallLabel: space?.spaceName ?? null,
        boothLabel: space?.spaceDetails ?? null,
      });
    }
    return results;
  }

  // Cancel appointment (dari Appointment List)
  async cancel(eventsId: number, guestsId: number, meetingId: number) {
    const meeting = await this.meetingRepo.findOne({ where: { eventsId, id: meetingId } });
    if (!meeting) {
      throw new NotFoundException(this.i18n.t('messages.errors.appointmentNotFound'));
    }
    if (meeting.initiatorId !== guestsId) {
      throw new ForbiddenException(this.i18n.t('messages.errors.notAppointmentOwner'));
    }
    if (meeting.approvalStatus === 'CL') {
      return { id: meeting.id, status: 'Cancelled' };
    }

    meeting.approvalStatus = 'CL';
    meeting.status = 'CANCEL';
    await this.meetingRepo.save(meeting);

    return { id: meeting.id, status: 'Cancelled' };
  }
}
