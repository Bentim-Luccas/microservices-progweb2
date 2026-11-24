
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import {
  MicroserviceOptions,
  Transport,
} from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { UsersModule } from './users.module.js';
import { AllRpcExceptionsFilter } from './filters/rpc-exception.filter.js';

async function bootstrap() {
  const app =
    await NestFactory.createMicroservice<MicroserviceOptions>(
      UsersModule,
      {
        transport: Transport.TCP,
        options: {
          host: '127.0.0.1',
          port: 3001,
        },
      },
    );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new AllRpcExceptionsFilter(),
  );

  await app.listen();
}

bootstrap();
