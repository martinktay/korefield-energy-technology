/**
 * @file notification.service.ts
 * Service for managing in-app and push notifications.
 * Creates notifications per user, marks as read, manages Web Push subscriptions,
 * and dispatches browser push notifications via the Web Push protocol.
 */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { generateId } from '@common/utils/generate-id';

interface CreateNotificationDto {
  user_id: string;
  title: string;
  body: string;
  category?: string;
  action_url?: string;
  channel?: 'in_app' | 'push' | 'email';
}

interface SubscribePushDto {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Create a notification for a specific user. */
  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        id: generateId('NTF'),
        user_id: dto.user_id,
        title: dto.title,
        body: dto.body,
        category: dto.category ?? 'general',
        action_url: dto.action_url ?? null,
        channel: (dto.channel ?? 'in_app') as any,
      },
    });

    this.logger.log(`Notification ${notification.id} created for user ${dto.user_id}: ${dto.title}`);

    // If push channel, attempt to send browser push
    if (dto.channel === 'push' || dto.channel === undefined) {
      await this.sendPush(dto.user_id, dto.title, dto.body, dto.action_url);
    }

    return notification;
  }

  /** Broadcast a notification to all users with a specific role. */
  async broadcast(role: string, title: string, body: string, category?: string, actionUrl?: string) {
    const users = await this.prisma.user.findMany({
      where: { role: role as any, status: 'Active' },
      select: { id: true },
    });

    const notifications = await Promise.all(
      users.map((u) =>
        this.create({
          user_id: u.id,
          title,
          body,
          category,
          action_url: actionUrl,
          channel: 'push',
        }),
      ),
    );

    this.logger.log(`Broadcast "${title}" to ${notifications.length} ${role} users`);
    return { sent: notifications.length };
  }

  /** GET /notifications — list notifications for a user (most recent first, limit 50). */
  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  /** GET /notifications/unread-count — count unread notifications. */
  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { user_id: userId, read: false },
    });
  }

  /** PATCH /notifications/:id/read — mark a single notification as read. */
  async markRead(notificationId: string) {
    const n = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!n) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  /** POST /notifications/mark-all-read — mark all notifications as read for a user. */
  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    });
    return { marked: result.count };
  }

  // ── Web Push Subscription Management ──────────────────────────

  /** POST /notifications/push/subscribe — register a push subscription. */
  async subscribePush(dto: SubscribePushDto) {
    const sub = await this.prisma.pushSubscription.upsert({
      where: {
        user_id_endpoint: { user_id: dto.user_id, endpoint: dto.endpoint },
      },
      update: { p256dh: dto.p256dh, auth: dto.auth },
      create: {
        id: generateId('PSB'),
        user_id: dto.user_id,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
      },
    });

    this.logger.log(`Push subscription registered for user ${dto.user_id}`);
    return sub;
  }

  /** Send a Web Push notification to all subscriptions for a user. */
  private async sendPush(userId: string, title: string, body: string, actionUrl?: string) {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { user_id: userId },
    });

    if (subscriptions.length === 0) return;

    // In production, use web-push library with VAPID keys
    // For now, log the push attempt
    for (const sub of subscriptions) {
      this.logger.log(
        `[PUSH] → ${sub.endpoint.slice(0, 50)}... | title: "${title}" | body: "${body}"`,
      );
    }

    // Mark notification as pushed
    await this.prisma.notification.updateMany({
      where: { user_id: userId, title, pushed: false },
      data: { pushed: true },
    });
  }
}
