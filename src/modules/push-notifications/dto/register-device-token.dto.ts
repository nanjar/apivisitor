import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM registration token dari device (didapat dari Firebase SDK di Flutter)',
    example: 'dGhpcyBpcyBhIGZha2UgZmNtIHRva2Vu...',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deviceToken: string;

  @ApiProperty({
    description:
      "Isi 'ios' kalau device-nya iPhone/iPad, isi 'android' kalau device-nya Android. " +
      'Wajib sesuai platform ASLI device pengirim — dipakai buat nentuin format payload ' +
      'push notification yang benar (APNs vs FCM Android), BUKAN sekadar metadata.',
    enum: ['ios', 'android'],
    example: 'android',
  })
  @IsIn(['ios', 'android'])
  platform: 'ios' | 'android';
}
