/**
 * @file notification.controller.ts
 * REST controller for the notification domain.
 * Exposes endpoints for listing, reading, and managing push subscriptions.
 * All endpoints require JWT authentication.
 */
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';
import { RbacGuard } from '@common/guards/rbac.guard';
import { Roles } from '@common/decorators/roles.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /** GET /notifications?user_id=USR-xxx — list notifications for a user. */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async list(@Query('user_id') userId: string) {
    return this.notificationService.listForUser(userId);
  }

  /** GET /notifications/unread-count?user_id=USR-xxx — get unread count. */
  @UseGuards(AuthGuard('jwt'))
  @Get('unread-count')
  async unreadCount(@Query('user_id') userId: string) {
    return { count: await this.notificationService.unreadCount(userId) };
  }

  /** PATCH /notifications/:id/read — mark a notification as read. */
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.notificationService.markRead(id);
  }

  /** POST /notifications/mark-all-read — mark all as read for a user. */
  @UseGuards(AuthGuard('jwt'))
  @Post('mark-all-read')
  async markAllRead(@Body('user_id') userId: string) {
    return this.notificationService.markAllRead(userId);
  }

  /** POST /notifications/push/subscribe — register a Web Push subscription. */
  @UseGuards(AuthGuard('jwt'))
  @Post('push/subscribe')
  async subscribePush(
    @Body() body: { user_id: string; endpoint: string; p256dh: string; auth: string },
  ) {
    return this.notificationService.subscribePush(body);
  }

  /** POST /notifications/broadcast — send a notification to all users of a role (SuperAdmin only). */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin')
  @Post('broadcast')
  async broadcast(
    @Body() body: { role: string; title: string; body: string; category?: string; action_url?: string },
  ) {
    return this.notificationService.broadcast(body.role, body.title, body.body, body.category, body.action_url);
  }
}
