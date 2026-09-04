import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { In, Repository } from 'typeorm';
import { EventMeeting } from './entities/event-meeting.entity';
import { VenueSpace } from '../venue/entities/venue-space.entity';
import { CompanyTimeslot } from './entities/company-timeslot.entity';
import { MeetingLocationV2 } from './entities/meeting-location-v2.entity';
import { Agenda } from '../schedule/entities/agenda.entity';
import { ExhCompanySpace } from '../venue/entities/exh-company-space.entity';
import { InterestOption } from './entities/interest-option.entity';
import { MeetingInterest } from './entities/meeting-interest.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentListQueryDto } from './dto/appointment-list-query.dto';
import { mapMeetingApprovalStatus } from './meeting-status.util';
import { ExhibitorHaveCompany } from '../exhibitor-app/entities/exhibitor-have-company.entity';
import { ExhibitorNotification } from '../exhibitor-app/entities/exhibitor-notification.entity';
import { ExhibitorDeviceToken } from '../exhibitor-app/entities/exhibitor-device-token.entity';
import { FirebaseAdminService } from '../push-notifications/firebase-admin.service';
import { GuestTicket } from '../visitors/entities/guest-ticket.entity';

// ASUMSI: durasi 1 meeting = 45 menit. Gak ada kolom durasi eksplisit di
// company_timeslot/events_meeting_v2 (cuma titik waktu mulai per 15 menit),
// jadi end_datetime dihitung dari sini. Perlu dikonfirmasi apakah 45 menit
// itu bener sesuai kebijakan event, atau harusnya beda (mis. 30/60 menit).
const MEETING_DURATION_MINUTES = 45;

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(EventMeeting)
    private readonly meetingRepo: Repository<EventMeeting>,
    @InjectRepository(VenueSpace)
    private readonly venueSpaceRepo: Repository<VenueSpace>,
    @InjectRepository(CompanyTimeslot)
    private readonly timeslotRepo: Repository<CompanyTimeslot>,
    @InjectRepository(MeetingLocationV2)
    private readonly meetingLocationRepo: Repository<MeetingLocationV2>,
    @InjectRepository(Agenda)
    private readonly agendaRepo: Repository<Agenda>,
    @InjectRepository(ExhCompanySpace)
    private readonly exhCompanySpaceRepo: Repository<ExhCompanySpace>,
    @InjectRepository(InterestOption)
    private readonly interestOptionRepo: Repository<InterestOption>,
    @InjectRepository(MeetingInterest)
    private readonly meetingInterestRepo: Repository<MeetingInterest>,
    @InjectRepository(ExhibitorHaveCompany)
    private readonly haveCompanyRepo: Repository<ExhibitorHaveCompany>,
    @InjectRepository(ExhibitorNotification)
    private readonly exhibitorNotificationRepo: Repository<ExhibitorNotification>,
    @InjectRepository(GuestTicket)
    private readonly guestTicketRepo: Repository<GuestTicket>,
    @InjectRepository(ExhibitorDeviceToken)
    private readonly exhibitorDeviceTokenRepo: Repository<ExhibitorDeviceToken>,
    private readonly firebaseAdmin: FirebaseAdminService,
    private readonly i18n: I18nService,
  ) {}

  // Screen: Meeting Setup / Appointment Booking -> checkbox "Interest 1/2/dst"
  async getInterestOptions(eventsId: number) {
    const options = await this.interestOptionRepo.find({
      where: { eventsId, isEnabled: 'Y' },
      order: { sortNo: 'ASC' },
    });
    return options.map((o) => ({ interestId: o.interestId, label: o.label }));
  }

  // Screen: Meeting Setup / Appointment Booking -> dropdown "Day Slot"
  async getAgendas(eventsId: number) {
    const agendas = await this.agendaRepo.find({
      where: { eventsId },
      order: { sortNo: 'ASC' },
    });
    return agendas.map((a) => ({
      agendaId: a.id,
      label: a.aliasName || a.agendaName,
      date: a.agendaDate,
    }));
  }

  // Screen: Meeting Setup / Appointment Booking -> dropdown "Meeting Location"
  async getMeetingLocations(eventsId: number) {
    const locations = await this.meetingLocationRepo.find({
      where: { eventsId, isEnabled: 'Y' },
      order: { sortNo: 'ASC' },
    });
    return locations.map((l) => ({ locationId: l.locationId, name: l.locationName }));
  }

  // Screen: Meeting Setup / Appointment Booking -> dropdown "Time Slot"
  // Cuma nampilin slot yang exhibitor AKTIFIN (is_enabled='Y') DAN belum
  // diambil visitor lain (booked='N') buat company+hari yang dipilih.
  async getAvailableTimeSlots(eventsId: number, companyId: number, agendaId: number) {
    const slots = await this.timeslotRepo.find({
      where: { eventsId, companyId, agendaId, isEnabled: 'Y', booked: 'N' },
      order: { timeSlot: 'ASC' },
    });
    return slots.map((s) => s.timeSlot);
  }

  // Screen: Appointment Booking (Meeting Setup)
  // Alur baru (31 Jul 2026): agenda_id + meeting_timeslot + meeting_location,
  // BUKAN lagi venue_id/space_id manual + datetime bebas. Booth company
  // (venue_id/space_id di events_meeting_v2) di-resolve OTOMATIS dari
  // exhcompany_space, visitor gak perlu milih itu manual lagi.
  async create(eventsId: number, guestsId: number, dto: CreateAppointmentDto) {
    const agenda = await this.agendaRepo.findOne({ where: { eventsId, id: dto.agendaId } });
    if (!agenda || !agenda.agendaDate) {
      throw new BadRequestException(this.i18n.t('messages.errors.agendaNotFound'));
    }

    const location = await this.meetingLocationRepo.findOne({
      where: { eventsId, locationId: dto.meetingLocationId, isEnabled: 'Y' },
    });
    if (!location) {
      throw new BadRequestException(this.i18n.t('messages.errors.meetingLocationNotFound'));
    }

    // Normalisasi format waktu ke HH:mm:ss buat konsisten disimpan & dibandingkan
    const normalizedTimeSlot = dto.timeSlot.length === 5 ? `${dto.timeSlot}:00` : dto.timeSlot;
    const start = new Date(`${agenda.agendaDate}T${normalizedTimeSlot}`);
    if (isNaN(start.getTime())) {
      throw new BadRequestException(this.i18n.t('messages.errors.agendaNotFound'));
    }
    if (start < new Date()) {
      throw new BadRequestException(this.i18n.t('messages.errors.bookingInThePast'));
    }
    const end = new Date(start.getTime() + MEETING_DURATION_MINUTES * 60_000);

    // Resolve booth milik company (buat isi venue_id/space_id di
    // events_meeting_v2 — dipakai Appointment List buat nampilin
    // hallLabel/boothLabel). Kalau company belum punya booth ter-assign,
    // biarin 0 (gak fatal, appointment tetap bisa dibuat).
    const companyBooth = await this.exhCompanySpaceRepo.findOne({
      where: { eventsId, companyId: dto.companyId },
    });

    // Slot check + booking digabung dalam 1 transaction, dikunci pakai
    // Postgres advisory lock per (eventsId, companyId, agendaId, timeSlot)
    // supaya dua visitor gak bisa rebutan slot yang sama secara bersamaan
    // (race condition). Lock otomatis lepas saat transaction commit/rollback.
    return this.meetingRepo.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1::int, hashtext($2))', [
        eventsId,
        `${dto.companyId}-${dto.agendaId}-${normalizedTimeSlot}`,
      ]);

      const timeslotRepo = manager.getRepository(CompanyTimeslot);
      const slot = await timeslotRepo.findOne({
        where: {
          eventsId,
          companyId: dto.companyId,
          agendaId: dto.agendaId,
          timeSlot: normalizedTimeSlot,
          isEnabled: 'Y',
          booked: 'N',
        },
      });
      if (!slot) {
        throw new BadRequestException(this.i18n.t('messages.errors.slotAlreadyBooked'));
      }

      slot.booked = 'Y';
      slot.lastUpdate = new Date();
      await timeslotRepo.save(slot);

      const meetingRepo = manager.getRepository(EventMeeting);
      const maxIdRow = await meetingRepo
        .createQueryBuilder('m')
        .select('COALESCE(MAX(m.id), 0)', 'maxId')
        .where('m.eventsId = :eventsId', { eventsId })
        .getRawOne<{ maxId: string }>();
      const nextId = parseInt(maxIdRow?.maxId ?? '0', 10) + 1;

      const meeting = meetingRepo.create({
        id: nextId,
        eventsId,
        meetingTitle: null,
        startDatetime: start,
        endDatetime: end,
        notes: dto.notes ?? null,
        approvalStatus: 'PE', // menunggu konfirmasi exhibitor
        status: 'OPEN',
        venueId: companyBooth?.venueId ?? 0,
        spaceId: companyBooth?.spaceId ?? 0,
        initiatedBy: 'VI',
        initiatorId: guestsId,
        comDirection: 'V2E',
        isDone: 'N',
        agendaId: dto.agendaId,
        meetingTimeslot: normalizedTimeSlot,
        meetingLocation: dto.meetingLocationId,
        meetingScore: dto.leadTemperature ?? 'Cold',
        // Fix Sept 2026: sebelumnya company_id gak pernah tersimpan di
        // mana pun untuk meeting baru (meeting_member_v2 juga gak pernah
        // di-insert) - exhibitor app gak bisa tahu meeting ini punya
        // company siapa. Sekarang company_id disimpan langsung di sini.
        companyId: dto.companyId,
      });
      await meetingRepo.save(meeting);

      // Simpan pilihan interest (checkbox "Interest 1/2/dst") ke pivot
      // meeting_interest — di luar transaction utama gpp karena kegagalan
      // di sini bukan alasan buat gagalin booking-nya (data sekunder).
      if (dto.interestIds?.length) {
        const meetingInterestRepo = manager.getRepository(MeetingInterest);
        await meetingInterestRepo.save(
          dto.interestIds.map((interestId) =>
            meetingInterestRepo.create({ eventsId, meetingId: nextId, interestId }),
          ),
        );
      }

      return {
        id: meeting.id,
        status: 'Pending',
        message: 'Permintaan appointment terkirim, menunggu konfirmasi exhibitor',
      };
    }).then(async (result) => {
      // Notifikasi ke semua exhibitor_id tim company ini - fire-and-forget
      // (kegagalan bikin notifikasi TIDAK boleh gagalin booking, booking-nya
      // sudah tersimpan duluan di transaction di atas).
      try {
        const teamLinks = await this.haveCompanyRepo.find({
          where: { eventsId, companyId: dto.companyId },
        });
        if (teamLinks.length > 0) {
          const guest = await this.guestTicketRepo.findOne({ where: { eventsId, guestsId } });
          const requesterName = guest?.fullname ?? 'Visitor';
          await this.exhibitorNotificationRepo.save(
            teamLinks.map((link) =>
              this.exhibitorNotificationRepo.create({
                eventsId,
                exhibitorId: link.exhibitorId,
                type: 'MEETING_REQUEST',
                title: 'Permintaan meeting baru',
                body: `${requesterName} minta meeting dengan booth kamu`,
                data: { meetingId: result.id },
                isRead: false,
                createdAt: new Date(),
              }),
            ),
          );

          // FCM push ke device exhibitor tim ini - fail open.
          if (this.firebaseAdmin.isEnabled) {
            const tokens = await this.exhibitorDeviceTokenRepo
              .createQueryBuilder('t')
              .where('t.eventsId = :eventsId', { eventsId })
              .andWhere('t.exhibitorId IN (:...ids)', {
                ids: teamLinks.map((l) => l.exhibitorId),
              })
              .getMany();
            if (tokens.length > 0) {
              await this.firebaseAdmin.sendToTokens(
                tokens.map((t) => t.deviceId),
                {
                  title: 'Permintaan meeting baru',
                  body: `${requesterName} minta meeting dengan booth kamu`,
                  data: { meetingId: String(result.id) },
                },
              );
            }
          }
        }
      } catch (err) {
        // Sengaja ditelan - notifikasi gagal bukan alasan gagalin response
        // booking ke visitor, booking-nya sendiri sudah sukses.
      }

      return result;
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

    // Ambil semua interest sekaligus (batch), bukan query per-meeting
    const meetingIds = meetings.map((m) => m.id);
    const allInterestLinks = meetingIds.length
      ? await this.meetingInterestRepo.find({ where: { eventsId, meetingId: In(meetingIds) } })
      : [];
    const interestIds = [...new Set(allInterestLinks.map((l) => l.interestId))];
    const interestOptions = interestIds.length
      ? await this.interestOptionRepo.find({ where: { eventsId, interestId: In(interestIds) } })
      : [];
    const interestLabelMap = new Map(interestOptions.map((o) => [o.interestId, o.label]));
    const interestsByMeeting = new Map<number, Array<{ id: number; label: string | null }>>();
    for (const link of allInterestLinks) {
      const list = interestsByMeeting.get(link.meetingId) ?? [];
      list.push({ id: link.interestId, label: interestLabelMap.get(link.interestId) ?? null });
      interestsByMeeting.set(link.meetingId, list);
    }

    const results: Array<{
      id: number;
      startDatetime: Date | null;
      endDatetime: Date | null;
      notes: string | null;
      status: string;
      agendaId: number | null;
      timeSlot: string | null;
      meetingLocationId: number | null;
      leadTemperature: string | null;
      interests: Array<{ id: number; label: string | null }>;
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
        startDatetime: meeting.startDatetime,
        endDatetime: meeting.endDatetime,
        notes: meeting.notes,
        status: mapMeetingApprovalStatus(this.i18n, meeting.approvalStatus),
        agendaId: meeting.agendaId,
        timeSlot: meeting.meetingTimeslot,
        meetingLocationId: meeting.meetingLocation,
        leadTemperature: meeting.meetingScore,
        interests: interestsByMeeting.get(meeting.id) ?? [],
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

    // Lepas slot-nya lagi (booked='N') biar bisa diambil visitor lain —
    // butuh companyId buat identifikasi row company_timeslot yang tepat,
    // di-resolve balik dari venue_id/space_id booth yang tersimpan di meeting.
    if (meeting.agendaId && meeting.meetingTimeslot && meeting.venueId) {
      const companyBooth = await this.exhCompanySpaceRepo.findOne({
        where: { eventsId, venueId: meeting.venueId, spaceId: meeting.spaceId },
      });
      if (companyBooth) {
        await this.timeslotRepo.update(
          {
            eventsId,
            companyId: companyBooth.companyId,
            agendaId: meeting.agendaId,
            timeSlot: meeting.meetingTimeslot,
          },
          { booked: 'N', lastUpdate: new Date() },
        );
      }
    }

    return { id: meeting.id, status: 'Cancelled' };
  }
}
