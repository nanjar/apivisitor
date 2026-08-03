import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UniversalSearchDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  query: string;
}
