// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { AllExceptionsFilter } from './common/exception/catch-everything.exception';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { SentryService } from '@ntegral/nestjs-sentry';
import * as basicAuth from 'express-basic-auth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerUsername = process.env.SWAGGER_USERNAME || 'Sw@gg@rUs@rD@v@123';
  const swaggerPassword =
    process.env.SWAGGER_PASSWORD || 'Sw@gg@rUs@rD@vP@ss@rd@123';

  // After NestFactory setup HTTP Basic Auth
  app.use(
    ['/docs', '/docs-json'],
    basicAuth({
      challenge: true,
      users: {
        [swaggerUsername]: swaggerPassword,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Rok API V2')
    .setDescription('Rok API V2 Restul API')
    .setVersion('2.0')
    .addTag('health')
    .addTag('parcel-rates')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  const prismaService: PrismaService = app.get(PrismaService);

  prismaService.enableShutdownHooks(app);

  app.useLogger(SentryService.SentryServiceInstance());

  await app.listen(process.env.PORT || 8080);
}

bootstrap();
