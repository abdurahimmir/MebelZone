import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const port = Number(config.get('PORT') ?? 3000);
  const apiPrefix = String(config.get('API_PREFIX') ?? 'api');

  app.use(helmet());
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
