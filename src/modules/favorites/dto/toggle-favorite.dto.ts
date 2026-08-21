import { IsInt, IsOptional, Min } from 'class-validator';

export class ToggleFavoriteDto {
  // Wajib diisi buat SEMUA favorite (company favorite = companyId itu
  // sendiri; product favorite = company PEMILIK produknya).
  @IsInt()
  @Min(1)
  companyId: number;

  // Kosongin (undefined/null) kalau favorite-nya buat COMPANY. Isi kalau
  // favorite-nya buat PRODUCT spesifik.
  @IsOptional()
  @IsInt()
  @Min(1)
  productId?: number;
}
