import { IsIn, IsOptional } from 'class-validator';

export class AppointmentListQueryDto {
  @IsOptional()
  @IsIn(['upcoming', 'pending', 'past', 'cancelled', 'all'])
  status: 'upcoming' | 'pending' | 'past' | 'cancelled' | 'all' = 'upcoming';
}
