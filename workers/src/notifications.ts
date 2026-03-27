import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';

interface NotificationPayload {
  type: 'email_verification' | 'lab_reminder' | 'waitlist_notification' | 'payment_reminder' | 'deadline_alert';
  recipientEmail: string;
  recipientId: string;
  subject: string;
  templateData: Record<string, unknown>;
}

class NotificationsWorker extends SqsConsumer<NotificationPayload> {
  protected async processMessage(message: ParsedMessage<NotificationPayload>): Promise<void> {
    const { type, recipientId } = message.body;
    this.log('info', `Sending ${type} notification to ${recipientId}`);

    // TODO: Send email/push notification via SES or notification provider
  }
}

const worker = new NotificationsWorker({
  queueName: 'notifications',
  queueUrl: process.env.NOTIFICATIONS_QUEUE_URL ?? '',
  dlqUrl: process.env.NOTIFICATIONS_DLQ_URL ?? '',
});

worker.start();
