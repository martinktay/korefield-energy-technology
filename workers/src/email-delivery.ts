/**
 * @file email-delivery.ts — Email delivery worker.
 * Consumes messages from the email SQS queue, renders branded HTML templates,
 * dispatches emails via AWS SES (or logs to console in development), and
 * records every delivery attempt in the email_logs table.
 * Runs as a standalone process on ECS Fargate.
 */
import crypto from 'crypto';
import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';
import { renderEmail, EMAIL_TYPES } from './services/template-engine';
import { SesClient, PermanentSesFailure, createSesClient } from './services/ses-client';
import { RateLimiter, createRateLimiter } from './services/rate-limiter';
import { getPrisma } from './services/db';
import { DeleteMessageCommand } from '@aws-sdk/client-sqs';

// ---------------------------------------------------------------------------
// Types — mirrors backend EmailPayload (self-contained to avoid cross-package)
// ---------------------------------------------------------------------------

/** JSON payload consumed from the email SQS queue. */
interface EmailPayload {
  /** Correlation ID in EML-xxxxx format. */
  id: string;
  /** Recipient email address. */
  to: string;
  /** One of the 9 supported email types. */
  type: string;
  /** Template-specific variables. */
  data: Record<string, unknown>;
  /** Associated user ID for preference checks and log association. */
  userId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a prefixed ID for email log records. */
function generateEmailLogId(): string {
  return `EML-${crypto.randomUUID().slice(0, 6)}`;
}

// ---------------------------------------------------------------------------
// EmailWorker
// ---------------------------------------------------------------------------

export class EmailWorker extends SqsConsumer<EmailPayload> {
  private readonly sesClient: SesClient;
  private readonly rateLimiter: RateLimiter;
  private readonly isDevelopment: boolean;

  constructor(config: ConstructorParameters<typeof SqsConsumer>[0]) {
    super(config);
    this.sesClient = createSesClient();
    this.rateLimiter = createRateLimiter();
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  protected async processMessage(message: ParsedMessage<EmailPayload>): Promise<void> {
    const { id, to, type, data, userId } = message.body;
    const prisma = getPrisma();

    // 1. Validate email type — unknown types throw to route to DLQ
    if (!(EMAIL_TYPES as readonly string[]).includes(type)) {
      this.log('error', `Unknown email type "${type}" for message ${id}. Routing to DLQ.`);
      throw new Error(`Unknown email type: "${type}"`);
    }

    // 2. Render template (do this early so we have the subject for the log)
    const rendered = renderEmail(type, data);

    // 3. Create email_log record with status: pending
    const logId = generateEmailLogId();
    await prisma.emailLog.create({
      data: {
        id: logId,
        user_id: userId ?? null,
        email_type: type,
        recipient: to,
        subject: rendered.subject,
        status: 'pending',
        correlation_id: id,
        attempt_number: 1,
      },
    });

    // 4. For marketing emails: check email_preferences — skip if opted out
    if (userId) {
      const preference = await prisma.emailPreference.findUnique({
        where: { user_id: userId },
      });

      if (preference?.marketing_opted_out && !isTransactionalType(type)) {
        this.log('info', `Skipping marketing email ${id} — user ${userId} opted out`);
        await prisma.emailLog.update({
          where: { id: logId },
          data: { status: 'skipped', updated_at: new Date() },
        });
        return;
      }
    }

    // 5. Route by environment
    if (this.isDevelopment) {
      // Development: log rendered content to console
      console.log(`\n========== EMAIL (dev) ==========`);
      console.log(`To:      ${to}`);
      console.log(`Type:    ${type}`);
      console.log(`Subject: ${rendered.subject}`);
      console.log(`--- HTML ---\n${rendered.html}`);
      console.log(`--- TEXT ---\n${rendered.text}`);
      console.log(`================================\n`);

      await prisma.emailLog.update({
        where: { id: logId },
        data: { status: 'sent', updated_at: new Date() },
      });
      return;
    }

    // 6. Production/staging: send via SES through rate limiter
    try {
      await this.rateLimiter.acquire();
      const sesMessageId = await this.sesClient.send(
        to,
        rendered.subject,
        rendered.html,
        rendered.text,
      );

      await prisma.emailLog.update({
        where: { id: logId },
        data: {
          status: 'sent',
          ses_message_id: sesMessageId,
          updated_at: new Date(),
        },
      });

      this.log('info', `Email sent: ${id} → ${to} (SES: ${sesMessageId})`);
    } catch (err) {
      if (err instanceof PermanentSesFailure) {
        // 7. Permanent SES failure: update log to failed, delete message (no retry)
        this.log('error', `Permanent SES failure for ${id}: ${err.message} (code: ${err.code})`);

        await prisma.emailLog.update({
          where: { id: logId },
          data: {
            status: 'failed',
            error_message: `${err.code}: ${err.message}`,
            updated_at: new Date(),
          },
        });

        // Delete message from queue to prevent retry
        const receiptHandle = message.raw.ReceiptHandle;
        if (receiptHandle) {
          await this.sqs.send(
            new DeleteMessageCommand({
              QueueUrl: this.config.queueUrl,
              ReceiptHandle: receiptHandle,
            }),
          );
        }
        return;
      }

      // Transient failure: update log and re-throw so SQS retries
      await prisma.emailLog.update({
        where: { id: logId },
        data: {
          status: 'failed',
          error_message: (err as Error).message,
          updated_at: new Date(),
        },
      });
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Email category helper
// ---------------------------------------------------------------------------

/** All 9 current email types are transactional. */
const TRANSACTIONAL_TYPES: ReadonlySet<string> = new Set([
  'email_verification',
  'welcome',
  'password_reset',
  'payment_confirmation',
  'enrollment_confirmation',
  'certificate_issued',
  'pod_assignment',
  'mfa_setup_confirmation',
  'account_status_change',
]);

function isTransactionalType(type: string): boolean {
  return TRANSACTIONAL_TYPES.has(type);
}

// ---------------------------------------------------------------------------
// Standalone startup
// ---------------------------------------------------------------------------

if (require.main === module) {
  const worker = new EmailWorker({
    queueName: 'email-delivery',
    queueUrl: process.env.EMAIL_QUEUE_URL ?? '',
    dlqUrl: process.env.EMAIL_DLQ_URL ?? '',
  });

  worker.start();
}
