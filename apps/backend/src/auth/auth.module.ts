import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secretUnknown: unknown = config.get('JWT_ACCESS_SECRET');
        const secret =
          typeof secretUnknown === 'string' && secretUnknown.length >= 16
            ? secretUnknown
            : 'development-access-secret-change-me';
        const ttlUnknown: unknown = config.get('JWT_ACCESS_TTL');
        const ttl =
          typeof ttlUnknown === 'number' && Number.isFinite(ttlUnknown)
            ? ttlUnknown
            : 900;

        return {
          secret,
          signOptions: { expiresIn: ttl },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
