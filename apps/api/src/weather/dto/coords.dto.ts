import { Type } from 'class-transformer';
import {
  IsIn,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CoordsQueryDto {
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  lat!: number;

  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  lon!: number;

  @IsOptional()
  @IsIn(['metric', 'imperial'])
  units?: 'metric' | 'imperial';

  /**
   * The place name the caller already has, from a search result.
   *
   * When present we skip reverse geocoding entirely: it would cost an extra
   * upstream call only to overwrite the name the user actually picked with
   * whatever settlement happens to own those coordinates.
   */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(0, 2)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;
}

export class CitySearchQueryDto {
  @IsString()
  @MinLength(2)
  q!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
