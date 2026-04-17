import { Type } from 'class-transformer';
import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class ProjectItemSaveDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  itemType!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @IsUUID()
  materialId?: string | null;

  @IsOptional()
  @IsUUID()
  textureId?: string | null;

  @IsOptional()
  @IsUUID()
  hardwarePresetId?: string | null;

  @IsObject()
  geometryJson!: Record<string, unknown>;

  @IsObject()
  transformJson!: Record<string, unknown>;

  @IsObject()
  dimensionJson!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  styleJson?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  rulesJson?: Record<string, unknown> | null;
}

export class SaveProjectDto {
  @IsOptional()
  @IsString()
  savedViewMode?: string | null;

  @IsOptional()
  @IsObject()
  savedCameraStateJson?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  savedUiStateJson?: Record<string, unknown> | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectItemSaveDto)
  items!: ProjectItemSaveDto[];
}
