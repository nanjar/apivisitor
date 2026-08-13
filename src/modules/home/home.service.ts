import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Event } from '../events/entities/event.entity';
import { ExhibitorCompany } from '../companies/entities/exhibitor-company.entity';
import { EventMeeting } from '../appointments/entities/event-meeting.entity';
import { VenueSpace } from '../venue/entities/venue-space.entity';
import { LocationAddress } from '../venue/entities/location-address.entity';
import { BoothResolverService } from '../checkin/booth-resolver.service';
import { PushNotificationsService } from '../push-notifications/push-notifications.service';
import { RegisterDeviceTokenDto } from '../push-notifications/dto/register-device-token.dto';
import { mapMeetingApprovalStatus } from '../appointments/meeting-status.util';
import {
  EventBannerDto,
  HomeDashboardResponseDto,
  RecommendedCompanyDto,
  UpcomingAppointmentDto,
} from './dto/home-dashboard-response.dto';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(ExhibitorCompany)
    private readonly companyRepo: Repository<ExhibitorCompany>,
    @InjectRepository(EventMeeting)
    private readonly meetingRepo: Repository<EventMeeting>,
    @InjectRepository(VenueSpace)
    private readonly venueSpaceRepo: Repository<VenueSpace>,
    @InjectRepository(LocationAddress)
    private readonly locationAddressRepo: Repository<LocationAddress>,
    private readonly boothResolver: BoothResolverService,
    private readonly pushNotifications: PushNotificationsService,
    private readonly i18n: I18nService,
  ) {}

  // Dipanggil pas Home Dashboard dibuka — register/update FCM device token
  // visitor ini. Disimpan di visitor_device_token (bukan guests_ticket,
  // yang ke-overwrite tiap sync MySQL->Postgres jalan).
  async updateDeviceId(eventsId: number, guestsId: number, dto: RegisterDeviceTokenDto) {
    return this.pushNotifications.registerDeviceToken(eventsId, guestsId, dto);
  }

  async getDashboard(eventsId: number, guestsId: number): Promise<HomeDashboardResponseDto> {
    const [event, upcomingAppointments, recommendedExhibitors] = await Promise.all([
      this.getEventBanner(eventsId),
      this.getUpcomingAppointments(eventsId, guestsId),
      this.getRecommendedExhibitors(eventsId),
    ]);

    return { event, upcomingAppointments, recommendedExhibitors };
  }

  private async getEventBanner(eventsId: number): Promise<EventBannerDto | null> {
    const event = await this.eventRepo.findOne({ where: { id: eventsId } });
    if (!event) return null;

    return {
      id: event.id,
      eventName: event.eventName,
      startDate: event.eventStartDate,
      endDate: event.eventEndDate,
      venueName: event.venueName,
      bannerImage: event.bannerImage,
    };
  }

  private async getUpcomingAppointments(
    eventsId: number,
    guestsId: number,
  ): Promise<UpcomingAppointmentDto[]> {
    // MVP: appointment milik visitor = yang dia inisiasi sendiri (initiated_by = 'VI').
    // Appointment yang di-generate exhibitor untuk visitor ini butuh tabel
    // participant terpisah yang belum ada di skema saat ini (lihat catatan di
    // event-meeting.entity.ts) — perlu klarifikasi skema lanjutan.
    const meetings = await this.meetingRepo.find({
      where: {
        eventsId,
        initiatorId: guestsId,
        status: 'OPEN' as any,
        startDatetime: MoreThanOrEqual(new Date()) as any,
      },
      order: { startDatetime: 'ASC' },
      take: 5,
    });

    const results: UpcomingAppointmentDto[] = [];
    for (const meeting of meetings) {
      const [space, venue] = await Promise.all([
        meeting.spaceId
          ? this.venueSpaceRepo
              .findOne({ where: { id: meeting.spaceId, venueId: meeting.venueId, eventsId } })
              .catch(() => null)
          : Promise.resolve(null),
        meeting.venueId
          ? this.locationAddressRepo
              .findOne({ where: { venueId: meeting.venueId, eventsId } })
              .catch(() => null)
          : Promise.resolve(null),
      ]);

      results.push({
        id: meeting.id,
        meetingTitle: meeting.meetingTitle,
        startDatetime: meeting.startDatetime,
        status: mapMeetingApprovalStatus(this.i18n, meeting.approvalStatus),
        venueName: venue?.venueName || null,
        hallLabel: space?.spaceType === 'BO' ? space.spaceName : null,
        boothLabel: space?.spaceDetails ?? null,
      });
    }
    return results;
  }

  private async getRecommendedExhibitors(eventsId: number): Promise<RecommendedCompanyDto[]> {
    const companies = await this.companyRepo.find({
      where: { eventsId, approvalStatus: 'AP' },
      order: { lastUpdate: 'DESC' },
      take: 6,
    });

    const boothMap = await this.boothResolver.resolveMany(
      eventsId,
      companies.map((c) => c.id),
    );

    return companies.map((c) => {
      const booth = boothMap.get(c.id);
      return {
        id: c.id,
        companyName: c.companyName,
        logo: c.logo,
        country: c.country,
        venueName: booth?.venueName ?? null,
        hallLabel: booth?.hallLabel ?? null,
        boothLabel: booth?.boothLabel ?? null,
      };
    });
  }
}
