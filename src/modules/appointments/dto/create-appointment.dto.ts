import { IsArray, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  // Company/PIC yang mau ditemui — events_meeting_v2 gak punya kolom
  // company_id langsung, jadi target company diidentifikasi dari sini buat
  // validasi company_timeslot & resolve booth-nya (via exhcompany_space).
  @IsInt()
  @Min(1)
  companyId: number;

  @IsInt()
  @Min(1)
  agendaId: number;

  // Format "HH:mm" atau "HH:mm:ss", HARUS match salah satu slot dari
  // GET /appointments/time-slots?companyId=&agendaId= (yang is_enabled='Y'
  // dan booked='N' buat company+hari ini).
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, { message: 'timeSlot harus format HH:mm atau HH:mm:ss' })
  timeSlot: string;

  @IsInt()
  @Min(1)
  meetingLocationId: number;

  // Checkbox "Interest 1", "Interest 2", dst di screen Meeting Setup —
  // pilihan didapat dari GET /appointments/interest-options
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  interestIds?: number[];

  @IsOptional()
  @IsIn(['Cold', 'Warm', 'Hot'])
  leadTemperature?: 'Cold' | 'Warm' | 'Hot' = 'Cold';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
