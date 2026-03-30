/**
 * @file ses-client.ts — AWS SES v2 wrapper with exponential backoff retry,
 * permanent failure detection, and Secrets Manager credential loading.
 * Used by the EmailWorker to dispatch emails through Amazon SES.
 */

import {
  SESv2Client,
  SendEmailCommand,
  type SendEmailCommandOutput,
} from '@aws-sdk/client-sesv2';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/**
 * Thrown when SES returns a permanent failure that should NOT be retried.
 * Covers bounces, complaints, and invalid recipient addresses.
 */
export class PermanentSesFailure extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'PermanentSesFailure';
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Error codes from SES that indicate a transient throttle — eligible for retry. */
const THROTTLE_ERROR_CODES = new Set([
  'ThrottlingException',
  'TooManyRequestsException',
]);

/** Error codes from SES that indicate a permanent failure — no retry. */
const PERMANENT_ERROR_CODES = new Set([
  'MessageRejected',
  'MailFromDomainNotVerifiedException',
  'AccountSendingPausedException',
]);

/** Retry delays in milliseconds: 1 s → 2 s → 4 s. */
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000] as const;

/** Default TTL for cached Secrets Manager credentials (5 minutes). */
const DEFAULT_CREDENTIALS_TTL_MS = 5 * 60 * 1_000;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export interface SesClientConfig {
  /** Verified sender email address (e.g. noreply@korefield.com). */
  senderEmail: string;
  /** AWS region for SES (e.g. eu-west-1). */
  region: string;
  /** Secrets Manager secret name for SES credentials (optional). */
  secretName?: string;
  /** TTL for cached credentials in milliseconds. Defaults to 5 minutes. */
  credentialsTtlMs?: number;
}

// ---------------------------------------------------------------------------
// SesClient
// ---------------------------------------------------------------------------

export class SesClient {
  private sesClient: SESv2Client;
  private readonly senderEmail: string;
  private readonly region: string;
  private readonly secretName: string | undefined;
  private readonly credentialsTtlMs: number;

  /** Cached credentials from Secrets Manager. */
  private cachedCredentials: Record<string, string> | null = null;
  private credentialsCachedAt = 0;

  constructor(config: SesClientConfig) {
    this.senderEmail = config.senderEmail;
    this.region = config.region;
    this.secretName = config.secretName;
    this.credentialsTtlMs = config.credentialsTtlMs ?? DEFAULT_CREDENTIALS_TTL_MS;

    this.sesClient = new SESv2Client({ region: this.region });
  }

  /**
   * Sends an email via SES with exponential backoff retry on throttle errors.
   * Throws `PermanentSesFailure` for bounces, complaints, and invalid addresses.
   *
   * @returns The SES message ID on success.
   */
  async send(to: string, subject: string, html: string, text: string): Promise<string> {
    const command = new SendEmailCommand({
      FromEmailAddress: this.senderEmail,
      Destination: { ToAddresses: [to] },
      Content: {
        Simple: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: html, Charset: 'UTF-8' },
            Text: { Data: text, Charset: 'UTF-8' },
          },
        },
      },
    });

    let lastError: unknown;

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        const result: SendEmailCommandOutput = await this.sesClient.send(command);
        return result.MessageId ?? '';
      } catch (err: unknown) {
        const errorCode = this.extractErrorCode(err);

        // Permanent failure — do not retry
        if (this.isPermanentFailure(errorCode, err)) {
          const message = err instanceof Error ? err.message : String(err);
          throw new PermanentSesFailure(message, errorCode);
        }

        // Throttle — retry with backoff if attempts remain
        if (THROTTLE_ERROR_CODES.has(errorCode) && attempt < RETRY_DELAYS_MS.length) {
          lastError = err;
          await this.delay(RETRY_DELAYS_MS[attempt]);
          continue;
        }

        // Non-throttle transient error or exhausted retries — rethrow
        throw err;
      }
    }

    // Should not reach here, but satisfy TypeScript
    throw lastError;
  }

  /**
   * Loads SES credentials from AWS Secrets Manager and caches them.
   * Should be called once on worker startup. Credentials are refreshed
   * automatically when the TTL expires.
   *
   * The secret is expected to contain JSON with optional `accessKeyId` and
   * `secretAccessKey` fields. If present, the SES client is re-initialised
   * with explicit credentials; otherwise the default credential chain is used.
   */
  async loadCredentials(): Promise<void> {
    if (!this.secretName) {
      return;
    }

    const now = Date.now();
    if (this.cachedCredentials && now - this.credentialsCachedAt < this.credentialsTtlMs) {
      return; // Cache still valid
    }

    const smClient = new SecretsManagerClient({ region: this.region });
    const response = await smClient.send(
      new GetSecretValueCommand({ SecretId: this.secretName }),
    );

    if (!response.SecretString) {
      throw new Error(`Secret "${this.secretName}" has no string value`);
    }

    const secret: Record<string, string> = JSON.parse(response.SecretString);
    this.cachedCredentials = secret;
    this.credentialsCachedAt = now;

    // Re-initialise SES client with explicit credentials if provided
    if (secret.accessKeyId && secret.secretAccessKey) {
      this.sesClient = new SESv2Client({
        region: this.region,
        credentials: {
          accessKeyId: secret.accessKeyId,
          secretAccessKey: secret.secretAccessKey,
        },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Extracts the AWS error code from an SDK error object.
   */
  private extractErrorCode(err: unknown): string {
    if (err && typeof err === 'object') {
      // AWS SDK v3 errors expose `name` as the error code
      if ('name' in err && typeof (err as Record<string, unknown>).name === 'string') {
        return (err as Record<string, unknown>).name as string;
      }
      if ('code' in err && typeof (err as Record<string, unknown>).code === 'string') {
        return (err as Record<string, unknown>).code as string;
      }
    }
    return '';
  }

  /**
   * Determines whether an SES error represents a permanent failure.
   * Permanent failures include bounces, complaints, and invalid addresses.
   */
  private isPermanentFailure(errorCode: string, err: unknown): boolean {
    if (PERMANENT_ERROR_CODES.has(errorCode)) {
      return true;
    }

    // Check error message for bounce/complaint indicators
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();
      if (
        msg.includes('bounce') ||
        msg.includes('complaint') ||
        msg.includes('invalid') ||
        msg.includes('does not exist') ||
        msg.includes('not verified')
      ) {
        return true;
      }
    }

    return false;
  }

  /** Async delay helper. */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ---------------------------------------------------------------------------
// Factory — reads config from environment
// ---------------------------------------------------------------------------

/**
 * Creates a SesClient configured from environment variables.
 *
 * Environment variables:
 * - `SES_SENDER_EMAIL` — Verified sender address (required)
 * - `SES_AWS_REGION` — AWS region for SES (required)
 * - `SES_SECRET_NAME` — Secrets Manager secret name (optional)
 * - `SES_CREDENTIALS_TTL_MS` — Credential cache TTL in ms (optional, default 300000)
 */
export function createSesClient(): SesClient {
  const senderEmail = process.env.SES_SENDER_EMAIL ?? '';
  const region = process.env.SES_AWS_REGION ?? '';

  if (!senderEmail) {
    throw new Error('SES_SENDER_EMAIL environment variable is required');
  }
  if (!region) {
    throw new Error('SES_AWS_REGION environment variable is required');
  }

  const secretName = process.env.SES_SECRET_NAME || undefined;
  const ttlRaw = process.env.SES_CREDENTIALS_TTL_MS;
  const credentialsTtlMs = ttlRaw ? parseInt(ttlRaw, 10) : undefined;

  return new SesClient({
    senderEmail,
    region,
    secretName,
    credentialsTtlMs: credentialsTtlMs && !isNaN(credentialsTtlMs) ? credentialsTtlMs : undefined,
  });
}
