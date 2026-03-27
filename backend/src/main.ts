/**
 * @file main.ts
 * Application entry point for the KoreField Academy backend.
 * Bootstraps the NestJS application with global validation pipes,
 * exception filters, logging/tracing interceptors, and CORS support.
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TracingInterceptor } from './common/interceptors/tracing.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Reject unknown properties and auto-transform payloads to DTO instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TracingInterceptor());

  app.enableCors();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
