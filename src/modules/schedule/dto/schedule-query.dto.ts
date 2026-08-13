import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ScheduleQueryDto {
  // Search di nama hari (agenda), nama track, dan judul sesi sekaligus
  @IsOptional()
  @IsString()
  keyword?: string;

  // Filter tab hari "Today | Tue 21 May | Wed 22 May | dst" (opsional —
  // kalau kosong, balikin semua hari kayak sebelumnya)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  agendaId?: number;

  // Filter chip berdasarkan Track
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  trackId?: number;
}
