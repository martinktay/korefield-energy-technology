/**
 * @file email.service.ts — Production EmailService that publishes typed email
 * payloads to the SQS email queue for asynchronous delivery by the Email Worker.
 * Replaces the console-logging stub at `auth/email.service.ts`.
 */
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { generateId } from '@common/utils/generate-id';
import {
  EmailPayload,
  EmailType,
  PaymentEmailData,
  EnrollmentEmailData,
  CertificateEmailData,
  PodAssignmentEmailData,
  AccountStatusEmailData,
} from './email.types';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly sqsClient: SQSClient;
  private readonly queueUrl: string;
  private readonly frontendUrl: string;

  constructor(private readonly jwtService: JwtService) {
    this.sqsClient = new SQSClient({});
    this.queueUrl = process.env.EMAIL_QUEUE_URL ?? '';
    this.frontendUrl =
      process.env.FRONTEND_URL ?? 'http://localhost:3000';
  }

  /**
   * Publish a typed email payload to the SQS email queue.
   * Generates a correlation ID and logs failures before re-throwing.
   */
  private async publishToQueue(payload: EmailPayload): Promise<void> {
    try {
      await this.sqsClient.send(
        new SendMessageCommand({
          QueueUrl: this.queueUrl,
          MessageBody: JSON.stringify(payload),
        }),
      );
      this.logger.log(
        `Email queued: ${payload.id} type=${payload.type} to=${payload.to}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue email ${payload.id}: ${(error as Error).message}`,
      );
      throw new InternalServerErrorException(
        `Failed to queue email (correlation: ${payload.id})`,
      );
    }
  }

  /**
   * Build a standard EmailPayload with a fresh correlation ID.
   */
  private buildPayload(
    to: string,
    type: EmailType,
    data: Record<string, unknown>,
    userId?: string,
  ): EmailPayload {
    return {
      id: generateId('EML'),
      to,
      type,
      data,
      userId,
    };
  }

  // -------------------------------------------------------------------
  // Public send methods — one per email type
  // -------------------------------------------------------------------

  /**
   * Send a verification email after user registration.
   * Signature preserved for backward compatibility with auth.service.ts.
   */
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${this.frontendUrl}/auth/verify-email?token=${token}`;
    const payload = this.buildPayload(email, 'email_verification', {
      verificationUrl,
      email,
    });
    await this.publishToQueue(payload);
  }

  /**
   * Send a welcome email after successful email verification.
   */
  async sendWelcomeEmail(email: string, userId: string): Promise<void> {
    const dashboardUrl = `${this.frontendUrl}/learner`;
    const foundationUrl = `${this.frontendUrl}/learner/foundation`;
    const payload = this.buildPayload(
      email,
      'welcome',
      { dashboardUrl, foundationUrl },
      userId,
    );
    await this.publishToQueue(payload);
  }

  /**
   * Send a password reset email with a purpose-scoped JWT (1-hour expiry).
   */
  async sendPasswordResetEmail(email: string, userId: string): Promise<void> {
    const resetToken = this.jwtService.sign(
      { sub: userId, purpose: 'password-reset' },
      { expiresIn: '1h' },
    );
    const resetUrl = `${this.frontendUrl}/auth/reset-password?token=${resetToken}`;
    const payload = this.buildPayload(
      email,
      'password_reset',
      { resetUrl, resetToken },
      userId,
    );
    await this.publishToQueue(payload);
  }

  /**
   * Send a payment confirmation email when an installment is marked paid.
   */
  async sendPaymentConfirmationEmail(
    email: string,
    data: PaymentEmailData,
    userId?: string,
  ): Promise<void> {
    const paymentHistoryUrl = `${this.frontendUrl}/learner/payments`;
    const payload = this.buildPayload(
      email,
      'payment_confirmation',
      { ...data, paymentHistoryUrl },
      userId,
    );
    await this.publishToQueue(payload);
  }

  /**
   * Send an enrollment confirmation email when a learner enrolls in a track.
   */
  async sendEnrollmentConfirmationEmail(
    email: string,
    data: EnrollmentEmailData,
    userId?: string,
  ): Promise<void> {
    const payload = this.buildPayload(
      email,
      'enrollment_confirmation',
      { ...data },
      userId,
    );
    await this.publishToQueue(payload);
  }

  /**
   * Send a certificate issuance notification email.
   */
  async sendCertificateIssuedEmail(
    email: string,
    data: CertificateEmailData,
    userId?: string,
  ): Promise<void> {
    const payload = this.buildPayload(
      email,
      'certificate_issued',
      { ...data },
      userId,
    );
    await this.publishToQueue(payload);
  }

  /**
   * Send a pod assignment notification email.
   */
  async sendPodAssignmentEmail(
    email: string,
    data: PodAssignmentEmailData,
    userId?: string,
  ): Promise<void> {
    const payload = this.buildPayload(
      email,
      'pod_assignment',
      { ...data },
      userId,
    );
    await this.publishToQueue(payload);
  }

  /**
   * Send an MFA setup confirmation email.
   */
  async sendMfaSetupConfirmationEmail(
    email: string,
    userId?: string,
  ): Promise<void> {
    const payload = this.buildPayload(
      email,
      'mfa_setup_confirmation',
      { activatedAt: new Date().toISOString() },
      userId,
    );
    await this.publishToQueue(payload);
  }

  /**
   * Send an account status change notification email.
   */
  async sendAccountStatusChangeEmail(
    email: string,
    data: AccountStatusEmailData,
    userId?: string,
  ): Promise<void> {
    const loginUrl = `${this.frontendUrl}/learner/login`;
    const supportContactUrl = `${this.frontendUrl}/support`;
    const payload = this.buildPayload(
      email,
      'account_status_change',
      { ...data, loginUrl, supportContactUrl },
      userId,
    );
    await this.publishToQueue(payload);
  }
}
