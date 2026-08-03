import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsIn(['id', 'en'])
  language?: string;

  @IsOptional()
  @IsBoolean()
  pushNotificationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotificationEnabled?: boolean;
}
