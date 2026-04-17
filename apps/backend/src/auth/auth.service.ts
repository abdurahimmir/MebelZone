import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProviderType, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import type Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { SystemService } from '../system/system.service';
import { REDIS } from '../redis/redis.module';
import type { JwtUserPayload } from '../common/decorators/current-user.decorator';
import type { GoogleAuthDto } from './dto/google-auth.dto';
import type { LoginEmailDto } from './dto/login-email.dto';
import type { LoginPhoneDto } from './dto/login-phone.dto';
import type { RegisterEmailDto } from './dto/register-email.dto';
import type { RegisterPhoneDto } from './dto/register-phone.dto';

const BCRYPT_ROUNDS = 12;

type RefreshJwtPayload = {
  sub: string;
  jti: string;
  typ: 'refresh';
};

@Injectable()
export class AuthService {
  private readonly googleClient?: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly system: SystemService,
    @Inject(REDIS) private readonly redis: Redis | null,
  ) {
    const clientIdUnknown: unknown = this.config.get('GOOGLE_CLIENT_ID');
    const clientId =
      typeof clientIdUnknown === 'string' && clientIdUnknown.trim().length > 0
        ? clientIdUnknown.trim()
        : undefined;
    if (clientId) {
      this.googleClient = new OAuth2Client(clientId);
    }
  }

  private getAccessSecret(): string {
    const sUnknown: unknown = this.config.get('JWT_ACCESS_SECRET');
    if (typeof sUnknown === 'string' && sUnknown.length >= 16) return sUnknown;
    return 'development-access-secret-change-me';
  }

  private getRefreshSecret(): string {
    const sUnknown: unknown = this.config.get('JWT_REFRESH_SECRET');
    if (typeof sUnknown === 'string' && sUnknown.length >= 16) return sUnknown;
    return 'development-refresh-secret-change-me';
  }

  private getRefreshTtlSeconds(): number {
    const vUnknown: unknown = this.config.get('JWT_REFRESH_TTL');
    if (typeof vUnknown === 'number' && Number.isFinite(vUnknown))
      return vUnknown;
    return 60 * 60 * 24 * 7;
  }

  private getAccessTtlSeconds(): number {
    const vUnknown: unknown = this.config.get('JWT_ACCESS_TTL');
    if (typeof vUnknown === 'number' && Number.isFinite(vUnknown))
      return vUnknown;
    return 900;
  }

  private refreshKey(userId: string, jti: string): string {
    return `refresh:${userId}:${jti}`;
  }

  private otpPhoneKey(normalizedPhone: string): string {
    return `otp:phone:${normalizedPhone}`;
  }

  private generateOtpCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  async sendPhoneOtp(phone: string) {
    const enabled = await this.system.getBooleanSetting(
      'auth.phone.enabled',
      false,
    );
    if (!enabled) throw new ForbiddenException('Phone OTP is disabled');

    if (!this.redis) {
      throw new BadRequestException('REDIS_URL is required for phone OTP');
    }

    const normalized = phone.replace(/\s+/g, '');
    const throttleKey = `otp:throttle:${normalized}`;
    const attempts = await this.redis.incr(throttleKey);
    if (attempts === 1) {
      await this.redis.expire(throttleKey, 60);
    }
    if (attempts > 5) {
      throw new BadRequestException('Too many OTP requests, try again later');
    }

    const code = this.generateOtpCode();
    await this.redis.set(this.otpPhoneKey(normalized), code, 'EX', 300);

    const webhookUnknown: unknown = this.config.get('SMS_WEBHOOK_URL');
    const webhook =
      typeof webhookUnknown === 'string' && webhookUnknown.trim().length > 0
        ? webhookUnknown.trim()
        : undefined;

    if (webhook) {
      void fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalized, code }),
      }).catch(() => undefined);
    }

    const exposeUnknown: unknown = this.config.get('EXPOSE_DEV_OTP');
    const expose =
      exposeUnknown === true ||
      exposeUnknown === 'true' ||
      (typeof exposeUnknown === 'string' &&
        exposeUnknown.toLowerCase() === 'true');

    return {
      ok: true,
      expiresIn: 300,
      ...(expose ? { devCode: code } : {}),
    };
  }

  private async consumePhoneOtp(
    normalizedPhone: string,
    otp: string,
  ): Promise<void> {
    if (!this.redis) {
      throw new BadRequestException('REDIS_URL is required for phone OTP');
    }
    const key = this.otpPhoneKey(normalizedPhone);
    const stored = await this.redis.get(key);
    if (!stored || stored !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    await this.redis.del(key);
  }

  private async persistRefreshSession(
    userId: string,
    jti: string,
  ): Promise<void> {
    if (!this.redis) {
      throw new BadRequestException(
        'REDIS_URL is required for session refresh tokens',
      );
    }
    await this.redis.set(
      this.refreshKey(userId, jti),
      '1',
      'EX',
      this.getRefreshTtlSeconds(),
    );
  }

  private async revokeRefreshSession(
    userId: string,
    jti: string,
  ): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(this.refreshKey(userId, jti));
  }

  private async issueTokens(
    userId: string,
    email: string | null,
    role: UserRole,
  ) {
    const accessTtl = this.getAccessTtlSeconds();
    const accessToken = await this.jwt.signAsync(
      { sub: userId, email, role },
      { secret: this.getAccessSecret(), expiresIn: accessTtl },
    );

    const jti = randomUUID();
    await this.persistRefreshSession(userId, jti);

    const refreshToken = await this.jwt.signAsync(
      { sub: userId, jti, typ: 'refresh' } satisfies RefreshJwtPayload,
      {
        secret: this.getRefreshSecret(),
        expiresIn: this.getRefreshTtlSeconds(),
      },
    );

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  async registerEmail(dto: RegisterEmailDto) {
    const enabled = await this.system.getBooleanSetting(
      'auth.email.enabled',
      true,
    );
    if (!enabled)
      throw new ForbiddenException('Email registration is disabled');

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        authProviders: {
          create: {
            providerType: AuthProviderType.EMAIL,
            providerUid: dto.email.toLowerCase(),
          },
        },
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async loginEmail(dto: LoginEmailDto) {
    const enabled = await this.system.getBooleanSetting(
      'auth.email.enabled',
      true,
    );
    if (!enabled) throw new ForbiddenException('Email login is disabled');

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user?.passwordHash)
      throw new UnauthorizedException('Invalid credentials');
    if (user.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException('Account inactive');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async registerPhone(dto: RegisterPhoneDto) {
    const enabled = await this.system.getBooleanSetting(
      'auth.phone.enabled',
      false,
    );
    if (!enabled)
      throw new ForbiddenException('Phone registration is disabled');

    const normalized = dto.phone.replace(/\s+/g, '');
    await this.consumePhoneOtp(normalized, dto.otp);

    const existing = await this.prisma.user.findUnique({
      where: { phone: normalized },
    });
    if (existing) throw new BadRequestException('Phone already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        phone: normalized,
        passwordHash,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        authProviders: {
          create: {
            providerType: AuthProviderType.PHONE,
            providerUid: normalized,
          },
        },
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async loginPhone(dto: LoginPhoneDto) {
    const enabled = await this.system.getBooleanSetting(
      'auth.phone.enabled',
      false,
    );
    if (!enabled) throw new ForbiddenException('Phone login is disabled');

    const normalized = dto.phone.replace(/\s+/g, '');
    const user = await this.prisma.user.findUnique({
      where: { phone: normalized },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status !== UserStatus.ACTIVE)
      throw new UnauthorizedException('Account inactive');

    if (dto.otp) {
      await this.consumePhoneOtp(normalized, dto.otp);
    } else {
      if (!dto.password) {
        throw new BadRequestException('password or otp is required');
      }
      if (!user.passwordHash) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const ok = await bcrypt.compare(dto.password, user.passwordHash);
      if (!ok) throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async google(dto: GoogleAuthDto) {
    const enabled = await this.system.getBooleanSetting(
      'auth.google.enabled',
      false,
    );
    if (!enabled) throw new ForbiddenException('Google login is disabled');
    if (!this.googleClient) {
      throw new BadRequestException('GOOGLE_CLIENT_ID is not configured');
    }

    const ticket = await this.googleClient.verifyIdToken({
      idToken: dto.idToken,
      audience: this.config.get('GOOGLE_CLIENT_ID') as string,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub) throw new UnauthorizedException('Invalid Google token');

    const googleId = payload.sub;
    const email = payload.email?.toLowerCase() ?? null;
    const fullName = dto.fullName?.trim() || payload.name || 'Google user';

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId }, ...(email ? [{ email }] : [])],
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          fullName,
          email,
          googleId,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          authProviders: {
            create: {
              providerType: AuthProviderType.GOOGLE,
              providerUid: googleId,
              metaJson: { email: payload.email },
            },
          },
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: user.googleId ?? googleId,
          lastLoginAt: new Date(),
          email: user.email ?? email,
        },
      });
    }

    const fresh = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    return this.issueTokens(fresh.id, fresh.email, fresh.role);
  }

  async refresh(refreshToken: string) {
    let decoded: RefreshJwtPayload;
    try {
      decoded = await this.jwt.verifyAsync<RefreshJwtPayload>(refreshToken, {
        secret: this.getRefreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (decoded.typ !== 'refresh' || !decoded.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!this.redis) {
      throw new BadRequestException('REDIS_URL is required for refresh');
    }

    const exists = await this.redis.exists(
      this.refreshKey(decoded.sub, decoded.jti),
    );
    if (!exists)
      throw new UnauthorizedException('Refresh token revoked or expired');

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    await this.revokeRefreshSession(decoded.sub, decoded.jti);
    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(user: JwtUserPayload, refreshToken?: string) {
    if (refreshToken) {
      try {
        const decoded = await this.jwt.verifyAsync<RefreshJwtPayload>(
          refreshToken,
          {
            secret: this.getRefreshSecret(),
          },
        );
        if (decoded.sub === user.sub && decoded.jti) {
          await this.revokeRefreshSession(decoded.sub, decoded.jti);
        }
      } catch {
        // ignore invalid refresh on logout
      }
    }
    return { ok: true };
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }
}
