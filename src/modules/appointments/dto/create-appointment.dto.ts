import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @MaxLength(45)
  meetingTitle: string;

  @IsDateString()
  startDatetime: string;

  @IsDateString()
  endDatetime: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;

  // Booth/lokasi tujuan meeting (booth milik company yang mau ditemui).
  // Catatan: skema saat ini tidak punya company_id langsung di
  // events_meeting_v2, jadi target company diidentifikasi lewat venue+space
  // (lihat gap #2 & #5 di README).
  @IsInt()
  @Min(1)
  venueId: number;

  @IsInt()
  @Min(1)
  spaceId: number;
}
