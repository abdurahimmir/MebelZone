import { IsString, Matches, MinLength } from 'class-validator';

export class LoginPhoneDto {
  @IsString()
  @Matches(/^\+?[0-9]{10,16}$/)
  phone!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
