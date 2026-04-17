import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  type JwtUserPayload,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { LoginPhoneDto } from './dto/login-phone.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { RegisterPhoneDto } from './dto/register-phone.dto';
import { SendPhoneOtpDto } from './dto/send-phone-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register/email')
  registerEmail(@Body() dto: RegisterEmailDto) {
    return this.auth.registerEmail(dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('login/email')
  loginEmail(@Body() dto: LoginEmailDto) {
    return this.auth.loginEmail(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('phone/send-otp')
  sendPhoneOtp(@Body() dto: SendPhoneOtpDto) {
    return this.auth.sendPhoneOtp(dto.phone);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register/phone')
  registerPhone(@Body() dto: RegisterPhoneDto) {
    return this.auth.registerPhone(dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('login/phone')
  loginPhone(@Body() dto: LoginPhoneDto) {
    return this.auth.loginPhone(dto);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('google')
  google(@Body() dto: GoogleAuthDto) {
    return this.auth.google(dto);
  }

  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: JwtUserPayload, @Body() body: LogoutDto) {
    return this.auth.logout(user, body.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtUserPayload) {
    return this.auth.me(user.sub);
  }
}
