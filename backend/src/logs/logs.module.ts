/**
 * @file logs.module.ts
 * NestJS module for client-side error logging.
 * Provides a rate-limited endpoint that forwards frontend error payloads
 * to AWS CloudWatch Logs for centralized production monitoring.
 */
import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
  ],
  controllers: [LogsController],
  providers: [
    LogsService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [LogsService],
})
export class LogsModule {}
