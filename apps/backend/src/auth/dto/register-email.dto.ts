import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterEmailDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
