import { IsIn, IsInt } from 'class-validator';

export class ToggleFavoriteDto {
  @IsIn(['COMPANY', 'PRODUCT'])
  targetType: 'COMPANY' | 'PRODUCT';

  @IsInt()
  targetId: number;
}
