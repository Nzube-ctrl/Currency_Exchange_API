import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  capital?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsNumber()
  population: Number;

  @IsOptional()
  @IsString()
  currency_code?: string | null;
}
