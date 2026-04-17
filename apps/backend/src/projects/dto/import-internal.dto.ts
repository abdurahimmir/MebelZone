import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SaveProjectDto } from './save-project.dto';

export class ImportInternalMetaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;
}

export class ImportInternalDto {
  @ValidateNested()
  @Type(() => ImportInternalMetaDto)
  meta!: ImportInternalMetaDto;

  @ValidateNested()
  @Type(() => SaveProjectDto)
  snapshot!: SaveProjectDto;
}
