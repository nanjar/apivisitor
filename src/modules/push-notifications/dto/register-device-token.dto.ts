import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceToken: string;

  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
