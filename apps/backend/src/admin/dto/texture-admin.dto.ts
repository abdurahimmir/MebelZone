import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTextureAdminDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  previewImage!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  texturePath!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  normalMapPath?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  roughnessMapPath?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTextureAdminDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  previewImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  texturePath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  normalMapPath?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  roughnessMapPath?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
