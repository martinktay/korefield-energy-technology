/**
 * @file notification.module.ts
 * NestJS module for the notification domain.
 * Provides in-app notifications, Web Push subscriptions, and broadcast capabilities.
 */
import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
