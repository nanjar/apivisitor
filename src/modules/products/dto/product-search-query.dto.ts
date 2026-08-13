import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ProductSearchQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  // Filter berdasarkan product type (dari filter chip: Automation/IoT/AI/dst)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  productTypeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;
}
