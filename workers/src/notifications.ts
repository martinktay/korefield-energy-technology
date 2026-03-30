/**
 * @file notifications.ts — Notification dispatch worker.
 * Consumes messages from the notifications SQS queue and routes them
 * appropriately: email-type notifications are forwarded to the email
 * delivery queue via SQS, application-related notifications create
 * in-app notification records via Prisma, and status-change events
 * do both. Runs as a standalone process on ECS Fargate.
 */
import crypto from 'crypto';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';
import { getPrisma } from './services/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationPayload {
  type:
    | 'email_verification'
    | 'lab_reminder'
    | 'waitlist_notification'
    | 'payment_reminder'
    | 'deadline_alert'
    | 'new_application'
    | 'application_status_change';
  recipientEmail: string;
  recipientId: string;
  subject: string;
  templateData: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Notification types that should be forwarded to the email delivery queue. */
const EMAIL_ROUTED_TYPES: ReadonlySet<string> = new Set([
  'email_verification',
  'payment_reminder',
  'deadline_alert',
  'lab_reminder',
  'waitlist_notification',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a prefixed notification ID matching the NTF-xxxxxx convention. */
function generateNotificationId(): string {
  return `NTF-${crypto.randomUUID().replace(/-/g, '').substring(0, 6)}`;
}

/** Generate a correlation ID for email queue messages. */
function generateEmailCorrelationId(): string {
  return `EML-${crypto.randomUUID().slice(0, 6)}`;
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

class NotificationsWorker extends SqsConsumer<NotificationPayload> {
  private readonly emailQueueUrl: string;
  private readonly emailSqs: SQSClient;

  constructor(config: ConstructorParameters<typeof SqsConsumer>[0]) {
    super(config);
    this.emailQueueUrl = process.env.EMAIL_QUEUE_URL ?? '';
    this.emailSqs = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
  }

  protected async processMessage(message: ParsedMessage<NotificationPayload>): Promise<void> {
    const { type, recipientId, recipientEmail, subject, templateData } = message.body;
    this.log('info', `Sending ${type} notification to ${recipientId} (${recipientEmail})`);

    switch (type) {
      case 'new_application':
        // In-app notification only — shows in Admin bell icon
        this.log('info', `[BELL] New application: ${templateData.applicantName} for ${templateData.jobTitle}`);
        await this.createInAppNotification(recipientId, subject, templateData);
        break;

      case 'application_status_change':
        // Both in-app notification AND email to applicant
        this.log('info', `[EMAIL+BELL] Application ${templateData.applicationId} status → ${templateData.newStatus} — emailing ${recipientEmail}`);
        await this.createInAppNotification(recipientId, subject, templateData);
        await this.forwardToEmailQueue(type, recipientEmail, subject, templateData, recipientId);
        break;

      default:
        // All other types route to the email delivery queue
        this.log('info', `[EMAIL] ${subject} → ${recipientEmail}`);
        if (EMAIL_ROUTED_TYPES.has(type)) {
          await this.forwardToEmailQueue(type, recipientEmail, subject, templateData, recipientId);
        } else {
          this.log('warn', `Unknown notification type "${type}" — skipping`);
        }
        break;
    }
  }

  /**
   * Create an in-app notification record in the database.
   * Mirrors the backend NotificationService.create() shape.
   */
  private async createInAppNotification(
    userId: string,
    subject: string,
    templateData: Record<string, unknown>,
  ): Promise<void> {
    const prisma = getPrisma();
    const body = typeof templateData.body === 'string'
      ? templateData.body
      : subject;
    const category = typeof templateData.category === 'string'
      ? templateData.category
      : 'recruitment';
    const actionUrl = typeof templateData.actionUrl === 'string'
      ? templateData.actionUrl
      : null;

    await prisma.notification.create({
      data: {
        id: generateNotificationId(),
        user_id: userId,
        title: subject,
        body,
        category,
        action_url: actionUrl,
        channel: 'in_app',
        read: false,
        pushed: false,
      },
    });

    this.log('info', `In-app notification created for user ${userId}`);
  }

  /**
   * Forward a notification to the email delivery queue as an EmailPayload
   * message so the email-delivery worker handles rendering and SES dispatch.
   */
  private async forwardToEmailQueue(
    type: string,
    recipientEmail: string,
    subject: string,
    templateData: Record<string, unknown>,
    userId?: string,
  ): Promise<void> {
    if (!this.emailQueueUrl) {
      this.log('warn', 'EMAIL_QUEUE_URL not configured — skipping email forward');
      return;
    }

    const emailPayload = {
      id: generateEmailCorrelationId(),
      to: recipientEmail,
      type,
      data: { ...templateData, subject },
      userId: userId ?? undefined,
    };

    await this.emailSqs.send(
      new SendMessageCommand({
        QueueUrl: this.emailQueueUrl,
        MessageBody: JSON.stringify(emailPayload),
      }),
    );

    this.log('info', `Forwarded ${type} email to delivery queue for ${recipientEmail}`);
  }
}

// ---------------------------------------------------------------------------
// Standalone startup
// ---------------------------------------------------------------------------

const worker = new NotificationsWorker({
  queueName: 'notifications',
  queueUrl: process.env.NOTIFICATIONS_QUEUE_URL ?? '',
  dlqUrl: process.env.NOTIFICATIONS_DLQ_URL ?? '',
});

worker.start();
