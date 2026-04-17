import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateTariffAdminDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  code!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyPrice!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  yearlyPrice?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxProjects?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxRenderPerMonth?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxExportPerMonth?: number | null;

  @IsOptional()
  @IsObject()
  featuresJson?: Record<string, unknown> | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTariffAdminDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monthlyPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  yearlyPrice?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxProjects?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxRenderPerMonth?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxExportPerMonth?: number | null;

  @IsOptional()
  @IsObject()
  featuresJson?: Record<string, unknown> | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
