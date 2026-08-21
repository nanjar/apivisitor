import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ExploreQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  country?: string;

  // Filter tab Companies: company yang punya minimal 1 produk dengan
  // investment_fee di rentang [minInvestment, maxInvestment].
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minInvestment?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxInvestment?: number;

  // Filter tab Products: product yang punya SALAH SATU dari product type
  // ini (OR, bukan harus semua). Bisa kirim 1 nilai (?productTypeId=1)
  // atau banyak (?productTypeId=1&productTypeId=2&productTypeId=3).
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]).map(Number))
  @IsInt({ each: true })
  productTypeId?: number[];

  @IsOptional()
  @IsIn(['companies', 'products', 'categories'])
  tab: 'companies' | 'products' | 'categories' = 'companies';

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
