import { IsString, Matches } from 'class-validator';

export class SendPhoneOtpDto {
  @IsString()
  @Matches(/^\+?[0-9]{10,16}$/)
  phone!: string;
}
