export class EventBannerDto {
  id: number;
  eventName: string;
  startDate: Date | null;
  endDate: Date | null;
  venueName: string | null;
  bannerImage: string | null;
}

export class UpcomingAppointmentDto {
  id: number;
  meetingTitle: string | null;
  startDatetime: Date | null;
  status: string;
  companyId: number | null;
  companyName: string | null;
  companyLogo: string | null;
  venueName: string | null;
  hallLabel: string | null;
  boothLabel: string | null;
}

export class RecommendedCompanyDto {
  id: number;
  companyName: string;
  logo: string | null;
  country: string | null;
  venueName: string | null;
  hallLabel: string | null;
  boothLabel: string | null;
}

export class HomeDashboardResponseDto {
  event: EventBannerDto | null;
  upcomingAppointments: UpcomingAppointmentDto[];
  recommendedExhibitors: RecommendedCompanyDto[];
}
