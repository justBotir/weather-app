import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFavoriteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  /** ISO 3166-1 alpha-2. Empty string allowed: mid-ocean coordinates have no country. */
  @IsString()
  @Length(0, 2)
  country!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  lon!: number;

  /** User-supplied nickname, e.g. "Home". */
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;
}
