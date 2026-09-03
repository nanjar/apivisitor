import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional } from 'class-validator';

export class LogLinkClickDto {
  @ApiProperty({
    enum: ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'TWITTER', 'WEBSITE', 'BROCHURE', 'PROMO'],
  })
  @IsIn(['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'TWITTER', 'WEBSITE', 'BROCHURE', 'PROMO'])
  linkType: string;

  @ApiPropertyOptional({
    description: 'Isi kalau klik dari Product Detail (link produk), kosongkan kalau dari Company Detail',
  })
  @IsOptional()
  @IsInt()
  productId?: number;
}
