/** @file email-delivery.spec.ts — Property-based tests for the EmailWorker delivery pipeline. */

import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Mock setup — MUST be before EmailWorker import
// ---------------------------------------------------------------------------

const mockSesClientSend = jest.fn<Promise<string>, [string, string, string, string]>();
const mockRateLimiterAcquire = jest.fn<Promise<void>, []>();
const mockPrismaEmailLogCreate = jest.fn<Promise<void>, [any]>();
const mockPrismaEmailLogUpdate = jest.fn<Promise<void>, [any]>();
const mockPrismaEmailPreferenceFindUnique = jest.fn<Promise<any>, [any]>();
const mockSqsSend = jest.fn<Promise<any>, [any]>();

jest.mock('../services/template-engine', () => ({
  renderEmail: jest.fn(() => ({
    subject: 'Test Subject',
    html: '<p>Test HTML</p>',
    text: 'Test plain text',
  })),
  EMAIL_TYPES: [
    'email_verification',
    'welcome',
    'password_reset',
    'payment_confirmation',
    'enrollment_confirmation',
    'certificate_issued',
    'pod_assignment',
    'mfa_setup_confirmation',
    'account_status_change',
  ],
}));

jest.mock('../services/ses-client', () => ({
  createSesClient: () => ({ send: mockSesClientSend }),
  PermanentSesFailure: class PermanentSesFailure extends Error {
    public readonly code: string;
    constructor(message: string, code: string) {
      super(message);
      this.name = 'PermanentSesFailure';
      this.code = code;
    }
  },
}));

jest.mock('../services/rate-limiter', () => ({
  createRateLimiter: () => ({ acquire: mockRateLimiterAcquire }),
}));

jest.mock('../services/db', () => ({
  getPrisma: () => ({
    emailLog: {
      create: mockPrismaEmailLogCreate,
      update: mockPrismaEmailLogUpdate,
    },
    emailPreference: {
      findUnique: mockPrismaEmailPreferenceFindUnique,
    },
  }),
}));

jest.mock('@aws-sdk/client-sqs', () => ({
  SQSClient: jest.fn().mockImplementation(() => ({ send: mockSqsSend })),
  ReceiveMessageCommand: jest.fn(),
  DeleteMessageCommand: jest.fn().mockImplementation((input: any) => ({ input })),
  SendMessageCommand: jest.fn(),
}));

// Import AFTER mocks are set up
import { EmailWorker } from '../email-delivery';
import { PermanentSesFailure } from '../services/ses-client';

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

const VALID_EMAIL_TYPES = [
  'email_verification', 'welcome', 'password_reset',
  'payment_confirmation', 'enrollment_confirmation', 'certificate_issued',
  'pod_assignment', 'mfa_setup_confirmation', 'account_status_change',
] as const;

const safeChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const safeString = fc
  .string({ minLength: 1, maxLength: 20, unit: fc.constantFrom(...safeChars.split('')) })
  .filter((s) => s.trim().length > 0);

const emailTypeArb = fc.constantFrom(...VALID_EMAIL_TYPES);

const emailPayloadArb = fc.record({
  id: safeString.map((s) => `EML-${s.slice(0, 6)}`),
  to: safeString.map((s) => `${s}@example.com`),
  type: emailTypeArb,
  data: fc.constant({ verificationUrl: 'https://example.com/verify' } as Record<string, unknown>),
  userId: fc.option(safeString.map((s) => `USR-${s.slice(0, 6)}`), { nil: undefined }),
});

const payloadWithUserArb = fc.record({
  id: safeString.map((s) => `EML-${s.slice(0, 6)}`),
  to: safeString.map((s) => `${s}@example.com`),
  type: emailTypeArb,
  data: fc.constant({ verificationUrl: 'https://example.com/v' } as Record<string, unknown>),
  userId: safeString.map((s) => `USR-${s.slice(0, 6)}`),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createParsedMessage(payload: any) {
  return {
    body: payload,
    raw: {
      MessageId: 'msg-test-123',
      ReceiptHandle: 'receipt-handle-test',
      Body: JSON.stringify(payload),
    },
  };
}

function createWorker(nodeEnv: string = 'production'): EmailWorker {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  process.env.SES_SENDER_EMAIL = 'noreply@korefield.com';
  process.env.SES_AWS_REGION = 'eu-west-1';
  const worker = new EmailWorker({
    queueName: 'email-delivery-test',
    queueUrl: 'https://sqs.test/email',
    dlqUrl: 'https://sqs.test/email-dlq',
  });
  process.env.NODE_ENV = originalEnv;
  return worker;
}

function resetMocks(): void {
  jest.clearAllMocks();
  mockRateLimiterAcquire.mockResolvedValue(undefined);
  mockPrismaEmailLogCreate.mockResolvedValue(undefined);
  mockPrismaEmailLogUpdate.mockResolvedValue(undefined);
  mockPrismaEmailPreferenceFindUnique.mockResolvedValue(null);
  mockSqsSend.mockResolvedValue({});
}

// ---------------------------------------------------------------------------
// Property 5: Email log lifecycle consistency
// ---------------------------------------------------------------------------

describe('Property 5: Email log lifecycle consistency', () => {
  /**
   * **Validates: Requirements 3.3, 14.1, 14.2, 14.3**
   *
   * For any email delivery attempt, the Email Worker must:
   * 1. Create an email_log record with status "pending" before delivery
   * 2. Update the record to "sent" (with ses_message_id) on success
   *    OR "failed" (with error_message and attempt_number) on failure
   */

  beforeEach(() => resetMocks());

  it('should create pending log then update to sent on SES success', async () => {
    const worker = createWorker('production');

    await fc.assert(
      fc.asyncProperty(emailPayloadArb, async (payload) => {
        resetMocks();
        mockSesClientSend.mockResolvedValue('ses-msg-id-abc');

        const message = createParsedMessage(payload);
        await (worker as any).processMessage(message);

        // 1. email_log created with status: pending
        expect(mockPrismaEmailLogCreate).toHaveBeenCalledTimes(1);
        const createCall = mockPrismaEmailLogCreate.mock.calls[0][0];
        expect(createCall.data.status).toBe('pending');
        expect(createCall.data.email_type).toBe(payload.type);
        expect(createCall.data.recipient).toBe(payload.to);
        expect(createCall.data.correlation_id).toBe(payload.id);
        expect(createCall.data.attempt_number).toBe(1);

        // 2. email_log updated to sent with ses_message_id
        expect(mockPrismaEmailLogUpdate).toHaveBeenCalled();
        const updateCalls = mockPrismaEmailLogUpdate.mock.calls;
        const lastUpdate = updateCalls[updateCalls.length - 1][0];
        expect(lastUpdate.data.status).toBe('sent');
        expect(lastUpdate.data.ses_message_id).toBe('ses-msg-id-abc');
      }),
      { numRuns: 20 },
    );
  });

  it('should create pending log then update to failed on SES transient error', async () => {
    const worker = createWorker('production');

    await fc.assert(
      fc.asyncProperty(emailPayloadArb, async (payload) => {
        resetMocks();
        mockSesClientSend.mockRejectedValue(new Error('Service unavailable'));

        const message = createParsedMessage(payload);
        await expect((worker as any).processMessage(message)).rejects.toThrow(
          'Service unavailable',
        );

        // 1. email_log created with status: pending
        expect(mockPrismaEmailLogCreate).toHaveBeenCalledTimes(1);
        const createCall = mockPrismaEmailLogCreate.mock.calls[0][0];
        expect(createCall.data.status).toBe('pending');

        // 2. email_log updated to failed with error_message
        expect(mockPrismaEmailLogUpdate).toHaveBeenCalled();
        const updateCalls = mockPrismaEmailLogUpdate.mock.calls;
        const lastUpdate = updateCalls[updateCalls.length - 1][0];
        expect(lastUpdate.data.status).toBe('failed');
        expect(lastUpdate.data.error_message).toContain('Service unavailable');
      }),
      { numRuns: 20 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 6: Permanent SES failures are not retried
// ---------------------------------------------------------------------------

describe('Property 6: Permanent SES failures are not retried', () => {
  /**
   * **Validates: Requirements 2.5**
   *
   * For any payload where SES returns a permanent failure (bounce, complaint,
   * invalid address), the Email Worker must:
   * 1. Update the email log to "failed"
   * 2. Delete the message from the queue (no retry)
   */

  beforeEach(() => resetMocks());

  it('should update log to failed and delete message on permanent SES failure', async () => {
    const worker = createWorker('production');

    const permanentErrorArb = fc.record({
      code: fc.constantFrom(
        'MessageRejected',
        'MailFromDomainNotVerifiedException',
        'AccountSendingPausedException',
      ),
      message: fc.constantFrom(
        'Email address is on the suppression list',
        'Bounce: address does not exist',
        'Account sending paused',
      ),
    });

    await fc.assert(
      fc.asyncProperty(emailPayloadArb, permanentErrorArb, async (payload, errorInfo) => {
        resetMocks();
        const permError = new PermanentSesFailure(errorInfo.message, errorInfo.code);
        mockSesClientSend.mockRejectedValue(permError);

        const message = createParsedMessage(payload);
        // Should NOT throw — permanent failures are handled gracefully
        await (worker as any).processMessage(message);

        // 1. email_log updated to failed
        expect(mockPrismaEmailLogUpdate).toHaveBeenCalled();
        const updateCalls = mockPrismaEmailLogUpdate.mock.calls;
        const lastUpdate = updateCalls[updateCalls.length - 1][0];
        expect(lastUpdate.data.status).toBe('failed');
        expect(lastUpdate.data.error_message).toBeTruthy();

        // 2. Message deleted from queue (via SQS DeleteMessageCommand)
        expect(mockSqsSend).toHaveBeenCalled();
      }),
      { numRuns: 20 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Environment-based delivery routing
// ---------------------------------------------------------------------------

describe('Property 7: Environment-based delivery routing', () => {
  /**
   * **Validates: Requirements 15.1, 15.2**
   *
   * For any email message:
   * - In development: SES send is NOT called (console logging only)
   * - In staging/production: SES send IS called
   */

  beforeEach(() => resetMocks());

  it('should NOT call SES send in development environment', async () => {
    const devWorker = createWorker('development');

    await fc.assert(
      fc.asyncProperty(emailPayloadArb, async (payload) => {
        resetMocks();
        mockSesClientSend.mockResolvedValue('ses-msg-id-env');

        const message = createParsedMessage(payload);
        await (devWorker as any).processMessage(message);

        // SES send must NOT be called in development
        expect(mockSesClientSend).not.toHaveBeenCalled();
        // Rate limiter must NOT be called in development
        expect(mockRateLimiterAcquire).not.toHaveBeenCalled();

        // But email_log should still be updated to sent
        expect(mockPrismaEmailLogUpdate).toHaveBeenCalled();
        const updateCalls = mockPrismaEmailLogUpdate.mock.calls;
        const lastUpdate = updateCalls[updateCalls.length - 1][0];
        expect(lastUpdate.data.status).toBe('sent');
      }),
      { numRuns: 20 },
    );
  });

  it('should call SES send in staging and production environments', async () => {
    const envArb = fc.constantFrom('staging', 'production');

    await fc.assert(
      fc.asyncProperty(emailPayloadArb, envArb, async (payload, env) => {
        resetMocks();
        mockSesClientSend.mockResolvedValue('ses-msg-id-env');

        const worker = createWorker(env);
        const message = createParsedMessage(payload);
        await (worker as any).processMessage(message);

        // SES send MUST be called in staging/production
        expect(mockSesClientSend).toHaveBeenCalledTimes(1);
        expect(mockSesClientSend).toHaveBeenCalledWith(
          payload.to,
          'Test Subject',
          '<p>Test HTML</p>',
          'Test plain text',
        );

        // Rate limiter must be called before SES
        expect(mockRateLimiterAcquire).toHaveBeenCalledTimes(1);
      }),
      { numRuns: 20 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11: Email category filtering respects preferences
// ---------------------------------------------------------------------------

describe('Property 11: Email category filtering respects preferences', () => {
  /**
   * **Validates: Requirements 18.3, 18.4**
   *
   * - All 9 current email types are transactional
   * - For any transactional email, delivery proceeds regardless of
   *   marketing_opted_out preference
   */

  beforeEach(() => resetMocks());

  it('should deliver transactional emails even when user has marketing_opted_out=true', async () => {
    const worker = createWorker('production');

    await fc.assert(
      fc.asyncProperty(payloadWithUserArb, async (payload) => {
        resetMocks();
        mockSesClientSend.mockResolvedValue('ses-msg-id-cat');

        // User has opted out of marketing
        mockPrismaEmailPreferenceFindUnique.mockResolvedValue({
          id: 'EPR-test',
          user_id: payload.userId,
          marketing_opted_out: true,
          marketing_opted_out_at: new Date(),
        });

        const message = createParsedMessage(payload);
        await (worker as any).processMessage(message);

        // All 9 types are transactional — delivery should proceed
        expect(mockSesClientSend).toHaveBeenCalledTimes(1);

        // email_log should be updated to sent, NOT skipped
        const updateCalls = mockPrismaEmailLogUpdate.mock.calls;
        const lastUpdate = updateCalls[updateCalls.length - 1][0];
        expect(lastUpdate.data.status).toBe('sent');
        expect(lastUpdate.data.status).not.toBe('skipped');
      }),
      { numRuns: 20 },
    );
  });

  it('should deliver transactional emails when user has no preferences set', async () => {
    const worker = createWorker('production');

    await fc.assert(
      fc.asyncProperty(payloadWithUserArb, async (payload) => {
        resetMocks();
        mockSesClientSend.mockResolvedValue('ses-msg-id-cat');

        // No preference record exists
        mockPrismaEmailPreferenceFindUnique.mockResolvedValue(null);

        const message = createParsedMessage(payload);
        await (worker as any).processMessage(message);

        // Delivery should proceed
        expect(mockSesClientSend).toHaveBeenCalledTimes(1);

        const updateCalls = mockPrismaEmailLogUpdate.mock.calls;
        const lastUpdate = updateCalls[updateCalls.length - 1][0];
        expect(lastUpdate.data.status).toBe('sent');
      }),
      { numRuns: 20 },
    );
  });
});
