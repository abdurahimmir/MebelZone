import { Controller, Get, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { randomBytes } from 'crypto';

const COOKIE_NAME = 'csrf_token';

@Controller('csrf')
export class CsrfController {
  constructor(private readonly config: ConfigService) {}

  @Get('token')
  issue(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const secretUnknown: unknown = this.config.get('CSRF_COOKIE_SECRET');
    const secret =
      typeof secretUnknown === 'string' && secretUnknown.length >= 16
        ? secretUnknown
        : undefined;

    if (!secret) {
      return { enabled: false };
    }

    const token = randomBytes(32).toString('hex');
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: req.secure,
      signed: true,
      maxAge: 60 * 60 * 1000,
    });

    return { enabled: true, headerName: 'x-csrf-token', token };
  }
}
