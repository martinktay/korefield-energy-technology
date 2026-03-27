import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';

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

class NotificationsWorker extends SqsConsumer<NotificationPayload> {
  protected async processMessage(message: ParsedMessage<NotificationPayload>): Promise<void> {
    const { type, recipientId, recipientEmail, subject, templateData } = message.body;
    this.log('info', `Sending ${type} notification to ${recipientId} (${recipientEmail})`);

    switch (type) {
      case 'new_application':
        // Push notification to Admin bell icon
        this.log('info', `[BELL] New application: ${templateData.applicantName} for ${templateData.jobTitle}`);
        break;

      case 'application_status_change':
        // Email to applicant on Interview/Offer/Hired
        this.log('info', `[EMAIL] Application ${templateData.applicationId} status → ${templateData.newStatus} — emailing ${recipientEmail}`);
        break;

      default:
        // Existing notification types
        this.log('info', `[EMAIL] ${subject} → ${recipientEmail}`);
        break;
    }

    // TODO: Send via SES or notification provider
  }
}

const worker = new NotificationsWorker({
  queueName: 'notifications',
  queueUrl: process.env.NOTIFICATIONS_QUEUE_URL ?? '',
  dlqUrl: process.env.NOTIFICATIONS_DLQ_URL ?? '',
});

worker.start();
