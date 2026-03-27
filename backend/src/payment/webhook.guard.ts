/**
 * @file webhook.guard.ts
 * NestJS guard for verifying HMAC-SHA256 signatures on payment provider webhooks.
 * Includes replay protection via timestamp validation (5-minute window).
 * Uses timing-safe comparison to prevent timing attacks.
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';

/**
 * Default header name for the webhook signature.
 */
const DEFAULT_SIGNATURE_HEADER = 'x-webhook-signature';

/**
 * Default timestamp header for replay protection.
 */
const DEFAULT_TIMESTAMP_HEADER = 'x-webhook-timestamp';

/**
 * Maximum age of a webhook request in milliseconds (5 minutes).
 */
const MAX_WEBHOOK_AGE_MS = 5 * 60 * 1000;

/**
 * Guard that verifies HMAC-SHA256 signatures on payment provider webhook callbacks.
 *
 * Requirement 31.14: Validate payment provider webhook requests using
 * request signature verification before processing any payment event.
 *
 * The webhook secret is read from the PAYMENT_WEBHOOK_SECRET env var.
 */
@Injectable()
export class WebhookGuard implements CanActivate {
  private readonly logger = new Logger(WebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers[DEFAULT_SIGNATURE_HEADER] as
      | string
      | undefined;
    const timestamp = request.headers[DEFAULT_TIMESTAMP_HEADER] as
      | string
      | undefined;
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.error(
        JSON.stringify({
          event: 'webhook_secret_missing',
          message: 'PAYMENT_WEBHOOK_SECRET env var is not configured',
          timestamp: new Date().toISOString(),
        }),
      );
      throw new UnauthorizedException('Webhook verification not configured');
    }

    if (!signature) {
      this.logger.warn(
        JSON.stringify({
          event: 'webhook_signature_missing',
          ip: request.ip,
          timestamp: new Date().toISOString(),
        }),
      );
      throw new UnauthorizedException('Missing webhook signature');
    }

    // Replay protection: reject stale requests
    if (timestamp) {
      const requestTime = parseInt(timestamp, 10);
      if (!isNaN(requestTime)) {
        const age = Date.now() - requestTime;
        if (age > MAX_WEBHOOK_AGE_MS) {
          this.logger.warn(
            JSON.stringify({
              event: 'webhook_replay_rejected',
              age_ms: age,
              ip: request.ip,
              timestamp: new Date().toISOString(),
            }),
          );
          throw new UnauthorizedException('Webhook request too old');
        }
      }
    }

    const body =
      typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body);

    const payload = timestamp ? `${timestamp}.${body}` : body;

    const isValid = WebhookGuard.verifySignature(payload, signature, secret);

    if (!isValid) {
      this.logger.warn(
        JSON.stringify({
          event: 'webhook_signature_invalid',
          ip: request.ip,
          timestamp: new Date().toISOString(),
        }),
      );
      throw new UnauthorizedException('Invalid webhook signature');
    }

    this.logger.log(
      JSON.stringify({
        event: 'webhook_verified',
        ip: request.ip,
        timestamp: new Date().toISOString(),
      }),
    );

    return true;
  }

  /**
   * Verify an HMAC-SHA256 signature using timing-safe comparison.
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expected = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    try {
      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expected, 'hex');

      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }

      return timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }
}
