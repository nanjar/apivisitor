import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  companyName?: string;
}
