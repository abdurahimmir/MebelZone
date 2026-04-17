import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { UserStatus } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtUserPayload } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';

type JwtAccessPayload = {
  sub: string;
  email: string | null;
  role: string;
};

function resolveAccessSecret(config: ConfigService): string {
  const secretUnknown: unknown = config.get('JWT_ACCESS_SECRET');
  if (typeof secretUnknown === 'string' && secretUnknown.length >= 16) {
    return secretUnknown;
  }
  return 'development-access-secret-change-me';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly prisma: PrismaService;

  constructor(config: ConfigService, prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: resolveAccessSecret(config),
    });
    this.prisma = prisma;
  }

  async validate(payload: JwtAccessPayload): Promise<JwtUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException();
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
