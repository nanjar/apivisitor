import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  // Token unik yang didapat visitor saat beli tiket (hasil sync dari
  // sistem tiketing MySQL). Bisa diinput manual atau di-scan dari
  // QR code / link email konfirmasi tiket.
  @IsString()
  @IsNotEmpty()
  token: string;
}
