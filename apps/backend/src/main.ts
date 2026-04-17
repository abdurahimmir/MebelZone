import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = Number(config.get('PORT') ?? 3000);
  const apiPrefix = String(config.get('API_PREFIX') ?? 'api');

  const csrfSecretUnknown: unknown = config.get('CSRF_COOKIE_SECRET');
  const csrfSecret =
    typeof csrfSecretUnknown === 'string' && csrfSecretUnknown.length >= 16
      ? csrfSecretUnknown
      : undefined;
  if (csrfSecret) {
    app.use(cookieParser(csrfSecret));
    logger.log('Cookie parser enabled for CSRF');
  }

  app.use(helmet());
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const nodeEnvUnknown: unknown = config.get('NODE_ENV');
  const nodeEnv =
    typeof nodeEnvUnknown === 'string' ? nodeEnvUnknown : 'development';
  const corsOriginRawUnknown: unknown = config.get('CORS_ORIGIN');
  const corsOrigin =
    typeof corsOriginRawUnknown === 'string' &&
    corsOriginRawUnknown.trim().length > 0
      ? corsOriginRawUnknown.trim()
      : undefined;
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.split(',').map((value) => value.trim()),
      credentials: true,
    });
  } else if (nodeEnv === 'production') {
    throw new Error('CORS_ORIGIN must be set in production');
  } else {
    app.enableCors({ origin: true });
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Furniture API')
    .setDescription('HTTP API для сервиса проектирования мебели')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  logger.log(`HTTP listening on :${port} (prefix /${apiPrefix})`);
}

void bootstrap();
