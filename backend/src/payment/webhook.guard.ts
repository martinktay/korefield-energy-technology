/**
 * @file webhook.guard.ts
 * NestJS guard for verifying Paystack HMAC-SHA512 webhook signatures.
 * Validates the `x-paystack-signature` header against the computed hash
 * of the raw request body using the PAYSTACK_SECRET_KEY environment variable.
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

/** Paystack sends the signature in this header. */
const PAYSTACK_SIGNATURE_HEADER = 'x-paystack-signature';

/**
 * Guard that verifies Paystack HMAC-SHA512 signatures on webhook callbacks.
 *
 * Paystack signs webhook payloads with HMAC-SHA512 using the merchant's
 * secret key. This guard rejects any request with a missing or invalid
 * signature with HTTP 401.
 */
@Injectable()
export class WebhookGuard implements CanActivate {
  private readonly logger = new Logger(WebhookGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers[PAYSTACK_SIGNATURE_HEADER] as
      | string
      | undefined;
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      this.logger.error(
        JSON.stringify({
          event: 'webhook_secret_missing',
          message: 'PAYSTACK_SECRET_KEY env var is not configured',
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

    const body =
      typeof request.body === 'string'
        ? request.body
        : JSON.stringify(request.body);

    const isValid = WebhookGuard.verifySignature(body, signature, secret);

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
   * Verify a Paystack HMAC-SHA512 signature using timing-safe comparison.
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expected = createHmac('sha512', secret)
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
