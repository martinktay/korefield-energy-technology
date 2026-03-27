/**
 * @file email.service.ts
 * Stub email service for the auth domain.
 * Logs verification emails to console during development.
 * Will be replaced by SQS-based notification worker in production (Task 10.2).
 */
import { Injectable, Logger } from '@nestjs/common';

/**
 * Stub email service — logs emails to console.
 * Actual email integration comes in Task 10.2 (notification worker via SQS).
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:3001'}/auth/verify-email?token=${token}`;
    this.logger.log(
      `[STUB] Verification email to ${email}: ${verificationUrl}`,
    );
  }
}
