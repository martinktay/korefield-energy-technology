/**
 * @file email.service.spec.ts — Property-based tests for EmailService payload
 * structure invariant using fast-check.
 *
 * Feature: transactional-email-system, Property 1: Email payload structure invariant
 */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as fc from 'fast-check';
import { EmailService } from '../email.service';
import type {
  EmailType,
  PaymentEmailData,
  EnrollmentEmailData,
  CertificateEmailData,
  PodAssignmentEmailData,
  AccountStatusEmailData,
} from '../email.types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let capturedMessageBody: string | undefined;

jest.mock('@aws-sdk/client-sqs', () => {
  return {
    SQSClient: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockImplementation((cmd: unknown) => {
        capturedMessageBody = (cmd as { input: { MessageBody: string } }).input
          .MessageBody;
        return Promise.resolve({});
      }),
    })),
    SendMessageCommand: jest.fn().mockImplementation((input: unknown) => ({
      input,
    })),
  };
});

jest.mock('@common/utils/generate-id', () => ({
  generateId: jest
    .fn()
    .mockImplementation((prefix: string) => `${prefix}-abc123`),
}));

// ---------------------------------------------------------------------------
// Helpers — fast-check arbitraries (fast-check v4 compatible)
// ---------------------------------------------------------------------------

const ALPHA_NUM = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const HEX = 'abcdef0123456789';

/** Arbitrary that produces a valid email address. */
const arbEmail: fc.Arbitrary<string> = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 12, unit: fc.constantFrom(...ALPHA_NUM.split('')) }),
    fc.string({ minLength: 2, maxLength: 8, unit: fc.constantFrom(...ALPHA.split('')) }),
    fc.constantFrom('com', 'org', 'net', 'io', 'co.uk'),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** Arbitrary that produces a non-empty alphanumeric token string. */
const arbToken: fc.Arbitrary<string> = fc.string({
  minLength: 6,
  maxLength: 32,
  unit: fc.constantFrom(...ALPHA_NUM.split('')),
});

/** Arbitrary that produces a user ID in USR-xxx format. */
const arbUserId: fc.Arbitrary<string> = fc
  .string({ minLength: 6, maxLength: 6, unit: fc.constantFrom(...HEX.split('')) })
  .map((s: string) => `USR-${s}`);

/** Arbitrary for PaymentEmailData. */
const arbPaymentData: fc.Arbitrary<PaymentEmailData> = fc.record({
  amount: fc.double({ min: 0.01, max: 99999, noNaN: true }),
  currency: fc.constantFrom('USD', 'GBP', 'NGN', 'EUR', 'KES'),
  trackName: fc.string({ minLength: 1, maxLength: 50 }),
  paymentPlanType: fc.constantFrom('full', '2-pay', '3-pay'),
  installmentSequence: fc.integer({ min: 1, max: 10 }),
  paymentDate: fc.date().map((d: Date) => d.toISOString()),
});

/** Arbitrary for EnrollmentEmailData. */
const arbEnrollmentData: fc.Arbitrary<EnrollmentEmailData> = fc.record({
  trackName: fc.string({ minLength: 1, maxLength: 50 }),
  enrollmentDate: fc.date().map((d: Date) => d.toISOString()),
  trackDashboardUrl: fc.constant('https://app.korefield.com/learner'),
});

/** Arbitrary for CertificateEmailData. */
const arbCertificateData: fc.Arbitrary<CertificateEmailData> = fc.record({
  trackName: fc.string({ minLength: 1, maxLength: 50 }),
  verificationCode: fc.string({ minLength: 8, maxLength: 16 }),
  certificateUrl: fc.constant(
    'https://app.korefield.com/certificates/download',
  ),
  issueDate: fc.date().map((d: Date) => d.toISOString()),
});

/** Arbitrary for PodAssignmentEmailData. */
const arbPodAssignmentData: fc.Arbitrary<PodAssignmentEmailData> = fc.record({
  podId: fc
    .string({ minLength: 6, maxLength: 6, unit: fc.constantFrom(...HEX.split('')) })
    .map((s: string) => `POD-${s}`),
  assignedRole: fc.constantFrom(
    'PM',
    'Data Scientist',
    'AI Engineer',
    'Security',
    'QA',
  ),
  trackName: fc.string({ minLength: 1, maxLength: 50 }),
  podPageUrl: fc.constant('https://app.korefield.com/learner/pods'),
});

/** Arbitrary for AccountStatusEmailData. */
const arbAccountStatusData: fc.Arbitrary<AccountStatusEmailData> = fc.record({
  newStatus: fc.constantFrom('Suspended', 'Active'),
  reason: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: undefined,
  }),
});


// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('EmailService — Property 1: Email payload structure invariant', () => {
  let service: EmailService;

  beforeEach(async () => {
    capturedMessageBody = undefined;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  /**
   * Helper: parse the captured SQS message body and run common assertions.
   * **Validates: Requirements 1.1**
   */
  function assertBasePayload(expectedType: EmailType, expectedTo: string) {
    expect(capturedMessageBody).toBeDefined();
    const payload = JSON.parse(capturedMessageBody!);

    // Non-empty correlation ID matching EML-* pattern
    expect(payload.id).toBeDefined();
    expect(typeof payload.id).toBe('string');
    expect(payload.id.length).toBeGreaterThan(0);
    expect(payload.id).toMatch(/^EML-.+$/);

    // Correct recipient email
    expect(payload.to).toBe(expectedTo);

    // Correct email type string
    expect(payload.type).toBe(expectedType);

    // Data object exists
    expect(payload.data).toBeDefined();
    expect(typeof payload.data).toBe('object');

    return payload;
  }

  // -----------------------------------------------------------------------
  // Property test: email_verification
  // -----------------------------------------------------------------------
  it('email_verification payloads contain verificationUrl and email — Validates: Requirements 1.1, 5.1', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbEmail,
        arbToken,
        async (email: string, token: string) => {
          capturedMessageBody = undefined;
          await service.sendVerificationEmail(email, token);
          const payload = assertBasePayload('email_verification', email);
          expect(payload.data.verificationUrl).toBeDefined();
          expect(typeof payload.data.verificationUrl).toBe('string');
          expect(
            (payload.data.verificationUrl as string).length,
          ).toBeGreaterThan(0);
          expect(payload.data.email).toBe(email);
        },
      ),
      { numRuns: 20 },
    );
  });

  // -----------------------------------------------------------------------
  // Property test: welcome
  // -----------------------------------------------------------------------
  it('welcome payloads contain dashboardUrl and foundationUrl — Validates: Requirements 1.1, 6.1', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbEmail,
        arbUserId,
        async (email: string, userId: string) => {
          capturedMessageBody = undefined;
          await service.sendWelcomeEmail(email, userId);
          const payload = assertBasePayload('welcome', email);
          expect(payload.data.dashboardUrl).toBeDefined();
          expect(typeof payload.data.dashboardUrl).toBe('string');
          expect(payload.data.foundationUrl).toBeDefined();
          expect(typeof payload.data.foundationUrl).toBe('string');
          expect(payload.userId).toBe(userId);
        },
      ),
      { numRuns: 20 },
    );
  });

  // -----------------------------------------------------------------------
  // Property test: password_reset
  // -----------------------------------------------------------------------
  it('password_reset payloads contain resetUrl and resetToken — Validates: Requirements 1.1, 7.1', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbEmail,
        arbUserId,
        async (email: string, userId: string) => {
          capturedMessageBody = undefined;
          await service.sendPasswordResetEmail(email, userId);
          const payload = assertBasePayload('password_reset', email);
          expect(payload.data.resetUrl).toBeDefined();
          expect(typeof payload.data.resetUrl).toBe('string');
          expect(payload.data.resetToken).toBeDefined();
          expect(typeof payload.data.resetToken).toBe('string');
          expect(payload.userId).toBe(userId);
        },
      ),
      { numRuns: 20 },
    );
  });


  // -----------------------------------------------------------------------
  // Property test: payment_confirmation
  // -----------------------------------------------------------------------
  it('payment_confirmation payloads contain all payment fields — Validates: Requirements 1.1, 8.1', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbEmail,
        arbPaymentData,
        arbUserId,
        async (
          email: string,
          data: PaymentEmailData,
          userId: string,
        ) => {
          capturedMessageBody = undefined;
          await service.sendPaymentConfirmationEmail(email, data, userId);
          const payload = assertBasePayload('payment_confirmation', email);
          expect(payload.data.amount).toBe(data.amount);
          expect(payload.data.currency).toBe(data.currency);
          expect(payload.data.trackName).toBe(data.trackName);
          expect(payload.data.paymentPlanType).toBe(data.paymentPlanType);
          expect(payload.data.installmentSequence).toBe(
            data.installmentSequence,
          );
          expect(payload.data.paymentDate).toBe(data.paymentDate);
          expect(payload.data.paymentHistoryUrl).toBeDefined();
          expect(payload.userId).toBe(userId);
        },
      ),
      { numRuns: 20 },
    );
  });

  // -----------------------------------------------------------------------
  // Property test: enrollment_confirmation
  // -----------------------------------------------------------------------
  it('enrollment_confirmation payloads contain enrollment fields — Validates: Requirements 1.1, 9.1', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbEmail,
        arbEnrollmentData,
        arbUserId,
        async (
          email: string,
          data: EnrollmentEmailData,
          userId: string,
        ) => {
          capturedMessageBody = undefined;
          await service.sendEnrollmentConfirmationEmail(email, data, userId);
          const payload = assertBasePayload('enrollment_confirmation', email);
          expect(payload.data.trackName).toBe(data.trackName);
          expect(payload.data.enrollmentDate).toBe(data.enrollmentDate);
          expect(payload.data.trackDashboardUrl).toBe(data.trackDashboardUrl);
          expect(payload.userId).toBe(userId);
        },
      ),
      { numRuns: 20 },
    );
  });

  // -----------------------------------------------------------------------
  // Property test: certificate_issued
  // -----------------------------------------------------------------------
  it('certificate_issued payloads contain certificate fields — Validates: Requirements 1.1, 10.1', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbEmail,
        arbCertificateData,
        arbUserId,
        async (
          email: string,
          data: CertificateEmailData,
          userId: string,
        ) => {
          capturedMessageBody = undefined;
          await service.sendCertificateIssuedEmail(email, data, userId);
          const payload = assertBasePayload('certificate_issued', email);
          expect(payload.data.trackName).toBe(data.trackName);
          expect(payload.data.verificationCode).toBe(data.verificationCode);
          expect(payload.data.certificateUrl).toBe(data.certificateUrl);
          expect(payload.data.issueDate).toBe(data.issueDate);
          expect(payload.userId).toBe(userId);
        },
      ),
      { numRuns: 20 },
    );
  });

  // -----------------------------------------------------------------------
  // Property test: pod_assignment
  // -----------------------------------------------------------------------
  it('pod_assignment payloads contain pod fields — Validates: Requirements 1.1, 11.1', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbEmail,
        arbPodAssignmentData,
        arbUserId,
        async (
          email: string,
          data: PodAssignmentEmailData,
          userId: string,
        ) => {
          capturedMessageBody = undefined;
          await service.sendPodAssignmentEmail(email, data, userId);
          const payload = assertBasePayload('pod_assignment', email);
          expect(payload.data.podId).toBe(data.podId);
          expect(payload.data.assignedRole).toBe(data.assignedRole);
          expect(payload.data.trackName).toBe(data.trackName);
          expect(payload.data.podPageUrl).toBe(data.podPageUrl);
          expect(payload.userId).toBe(userId);
        },
      ),
      { numRuns: 20 },
    );
  });

  // -----------------------------------------------------------------------
  // Property test: mfa_setup_confirmation
  // -----------------------------------------------------------------------
  it('mfa_setup_confirmation payloads contain activatedAt — Validates: Requirements 1.1, 12.1', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbEmail,
        arbUserId,
        async (email: string, userId: string) => {
          capturedMessageBody = undefined;
          await service.sendMfaSetupConfirmationEmail(email, userId);
          const payload = assertBasePayload('mfa_setup_confirmation', email);
          expect(payload.data.activatedAt).toBeDefined();
          expect(typeof payload.data.activatedAt).toBe('string');
          expect(
            (payload.data.activatedAt as string).length,
          ).toBeGreaterThan(0);
          expect(payload.userId).toBe(userId);
        },
      ),
      { numRuns: 20 },
    );
  });

  // -----------------------------------------------------------------------
  // Property test: account_status_change
  // -----------------------------------------------------------------------
  it('account_status_change payloads contain status fields — Validates: Requirements 1.1, 13.1, 13.2', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbEmail,
        arbAccountStatusData,
        arbUserId,
        async (
          email: string,
          data: AccountStatusEmailData,
          userId: string,
        ) => {
          capturedMessageBody = undefined;
          await service.sendAccountStatusChangeEmail(email, data, userId);
          const payload = assertBasePayload('account_status_change', email);
          expect(payload.data.newStatus).toBe(data.newStatus);
          if (data.reason !== undefined) {
            expect(payload.data.reason).toBe(data.reason);
          }
          expect(payload.data.loginUrl).toBeDefined();
          expect(payload.data.supportContactUrl).toBeDefined();
          expect(payload.userId).toBe(userId);
        },
      ),
      { numRuns: 20 },
    );
  });
});


// ---------------------------------------------------------------------------
// Property 8: Queue publishing is environment-independent
// ---------------------------------------------------------------------------

describe('EmailService — Property 8: Queue publishing is environment-independent', () => {
  let service: EmailService;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(async () => {
    capturedMessageBody = undefined;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  /**
   * Arbitrary for NODE_ENV values including the standard environments
   * and arbitrary strings to prove environment independence.
   */
  const arbNodeEnv: fc.Arbitrary<string> = fc.oneof(
    fc.constantFrom('development', 'staging', 'production', 'test'),
    fc.string({ minLength: 1, maxLength: 20 }),
  );

  it('always publishes to SQS regardless of NODE_ENV — Validates: Requirements 15.3', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbNodeEnv,
        arbEmail,
        arbToken,
        async (nodeEnv: string, email: string, token: string) => {
          process.env.NODE_ENV = nodeEnv;
          capturedMessageBody = undefined;

          await service.sendVerificationEmail(email, token);

          // SQS message must always be published
          expect(capturedMessageBody).toBeDefined();
          const payload = JSON.parse(capturedMessageBody!);
          expect(payload.to).toBe(email);
          expect(payload.type).toBe('email_verification');
          expect(payload.id).toMatch(/^EML-.+$/);
        },
      ),
      { numRuns: 20 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: Password reset token structure
// ---------------------------------------------------------------------------

describe('EmailService — Property 12: Password reset token structure', () => {
  let service: EmailService;
  let jwtSignSpy: jest.Mock;

  beforeEach(async () => {
    capturedMessageBody = undefined;

    /**
     * We capture the arguments passed to JwtService.sign so we can verify
     * the purpose claim and expiresIn option without needing a real secret.
     */
    jwtSignSpy = jest.fn().mockReturnValue('mock-reset-jwt');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: JwtService,
          useValue: { sign: jwtSignSpy },
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('generates a JWT with purpose "password-reset" and 1h expiry for any user ID — Validates: Requirements 7.3', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbEmail,
        arbUserId,
        async (email: string, userId: string) => {
          capturedMessageBody = undefined;
          jwtSignSpy.mockClear();

          await service.sendPasswordResetEmail(email, userId);

          // JwtService.sign must have been called exactly once
          expect(jwtSignSpy).toHaveBeenCalledTimes(1);

          const [tokenPayload, tokenOptions] = jwtSignSpy.mock.calls[0];

          // Token payload must contain the user ID as sub and purpose claim
          expect(tokenPayload.sub).toBe(userId);
          expect(tokenPayload.purpose).toBe('password-reset');

          // Token options must specify 1-hour expiration
          expect(tokenOptions.expiresIn).toBe('1h');
        },
      ),
      { numRuns: 20 },
    );
  });
});
