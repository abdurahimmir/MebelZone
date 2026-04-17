import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateMaterialAdminDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  category!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsInt()
  @Min(1)
  thicknessMm!: number;

  @IsInt()
  @Min(1)
  sheetWidthMm!: number;

  @IsInt()
  @Min(1)
  sheetHeightMm!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerSheet!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerM2?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  density?: number;

  @IsOptional()
  @IsUUID()
  defaultTextureId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMaterialAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  thicknessMm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sheetWidthMm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  sheetHeightMm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerSheet?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  pricePerM2?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  density?: number | null;

  @IsOptional()
  @IsUUID()
  defaultTextureId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
