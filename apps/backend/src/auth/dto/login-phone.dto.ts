import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class LoginPhoneDto {
  @IsString()
  @Matches(/^\+?[0-9]{10,16}$/)
  phone!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  password?: string;

  @IsOptional()
  @IsString()
  @Length(6, 6)
  otp?: string;
}
