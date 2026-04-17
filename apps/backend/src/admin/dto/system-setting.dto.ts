import { IsObject, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertSystemSettingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  key!: string;

  @IsObject()
  valueJson!: Record<string, unknown>;
}
