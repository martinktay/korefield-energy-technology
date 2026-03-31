/**
 * @file payment-security.spec.ts
 * Tests for payment security components: Paystack webhook signature
 * verification (HMAC-SHA512), payment state machine transitions,
 * fraud monitoring, and gateway PCI DSS compliance.
 * Includes Property 14 (Paystack Webhook Signature Verification)
 * property-based tests using fast-check.
 */
import { createHmac } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import * as fc from 'fast-check';
import { WebhookGuard } from './webhook.guard';
import { PaymentStateMachine } from './payment-state-machine';
import { FraudMonitorService } from './fraud-monitor.service';
import { PaymentGatewayService } from './payment-gateway.service';

// ── WebhookGuard Tests (Paystack HMAC-SHA512) ───────────────────

describe('WebhookGuard', () => {
  let guard: WebhookGuard;
  const TEST_SECRET = 'test-paystack-secret-key';

  beforeEach(() => {
    guard = new WebhookGuard();
    process.env.PAYSTACK_SECRET_KEY = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  function createMockContext(
    headers: Record<string, string>,
    body: unknown,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers, body, ip: '127.0.0.1' }),
      }),
    } as unknown as ExecutionContext;
  }

  function signPayload(payload: string, secret: string): string {
    return createHmac('sha512', secret).update(payload).digest('hex');
  }

  it('should accept a valid Paystack HMAC-SHA512 signature', () => {
    const body = { event: 'charge.success', data: { reference: 'ref_123' } };
    const bodyStr = JSON.stringify(body);
    const signature = signPayload(bodyStr, TEST_SECRET);
    const ctx = createMockContext({ 'x-paystack-signature': signature }, body);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject an invalid signature', () => {
    const body = { event: 'charge.success' };
    const ctx = createMockContext(
      { 'x-paystack-signature': 'deadbeef'.repeat(16) },
      body,
    );
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject when signature header is missing', () => {
    const body = { event: 'charge.success' };
    const ctx = createMockContext({}, body);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject when Paystack secret key is not configured', () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const body = { event: 'charge.success' };
    const ctx = createMockContext({ 'x-paystack-signature': 'abc123' }, body);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});

// ── PaymentStateMachine Tests ───────────────────────────────────

describe('PaymentStateMachine', () => {
  let machine: PaymentStateMachine;

  beforeEach(() => {
    machine = new PaymentStateMachine();
  });

  it('should allow transition from pending to paid', () => {
    expect(machine.canTransition('pending', 'paid')).toBe(true);
  });

  it('should allow transition from pending to overdue', () => {
    expect(machine.canTransition('pending', 'overdue')).toBe(true);
  });

  it('should allow transition from pending to paused', () => {
    expect(machine.canTransition('pending', 'paused')).toBe(true);
  });

  it('should allow transition from overdue to paid', () => {
    expect(machine.canTransition('overdue', 'paid')).toBe(true);
  });

  it('should allow transition from paused to pending', () => {
    expect(machine.canTransition('paused', 'pending')).toBe(true);
  });

  it('should reject transition from paid to pending', () => {
    expect(machine.canTransition('paid', 'pending')).toBe(false);
  });

  it('should record transition and return audit record', () => {
    const record = machine.transition('pending', 'paid', {
      installment_id: 'IST-abc123',
      reason: 'Payment received',
    });
    expect(record.from).toBe('pending');
    expect(record.to).toBe('paid');
    expect(record.timestamp).toBeInstanceOf(Date);
  });

  it('should throw on invalid transition', () => {
    expect(() => machine.transition('paid', 'pending')).toThrow();
  });
});

// ── FraudMonitorService Tests ───────────────────────────────────

describe('FraudMonitorService', () => {
  let service: FraudMonitorService;

  beforeEach(() => {
    service = new FraudMonitorService();
  });

  it('should flag unusual volume after exceeding threshold', () => {
    for (let i = 0; i < 6; i++) {
      service.recordAttempt('USR-abc123', true);
    }
    const alert = service.checkUnusualVolume('USR-abc123');
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe('unusual_volume');
  });

  it('should flag mismatched billing country', () => {
    const alert = service.checkBillingMismatch('USR-abc123', 'US', 'NG');
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe('billing_mismatch');
  });

  it('should return null for matching billing country', () => {
    const alert = service.checkBillingMismatch('USR-abc123', 'NG', 'NG');
    expect(alert).toBeNull();
  });

  it('should return no alerts for normal volume', () => {
    service.recordAttempt('USR-abc123', true);
    const alert = service.checkUnusualVolume('USR-abc123');
    expect(alert).toBeNull();
  });
});

// ── PaymentGatewayService Tests (PCI DSS) ───────────────────────

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService;

  beforeEach(() => {
    service = new PaymentGatewayService();
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_abc123';
  });

  afterEach(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  it('should extract only safe card data (authorization_code + last4)', () => {
    const authorization = {
      authorization_code: 'AUTH_abc123',
      last4: '1234',
      card_type: 'visa',
      bin: '411111',
      exp_month: '12',
      exp_year: '2028',
    };
    const safe = service.extractSafeCardData(authorization);
    expect(safe.authorization_code).toBe('AUTH_abc123');
    expect(safe.last4).toBe('1234');
    expect(Object.keys(safe)).toEqual(['authorization_code', 'last4']);
  });

  it('should verify a valid Paystack webhook signature', () => {
    const body = '{"event":"charge.success"}';
    const signature = createHmac('sha512', 'sk_test_abc123')
      .update(body)
      .digest('hex');
    expect(service.verifyWebhook(signature, body)).toBe(true);
  });

  it('should reject an invalid webhook signature', () => {
    const body = '{"event":"charge.success"}';
    expect(service.verifyWebhook('invalid_signature', body)).toBe(false);
  });
});


// ── Generators ──────────────────────────────────────────────────

/** Arbitrary non-empty secret key (Paystack keys are printable ASCII). */
const secretKeyArb = fc.string({ minLength: 8, maxLength: 64 }).filter((s) => s.trim().length > 0);

/** Arbitrary webhook JSON body as a stringified object. */
const webhookBodyArb = fc
  .record({
    event: fc.constantFrom('charge.success', 'charge.failed', 'transfer.success', 'refund.processed'),
    data: fc.record({
      reference: fc.string({ minLength: 3, maxLength: 30 }),
      amount: fc.integer({ min: 100, max: 100_000_000 }),
      currency: fc.constantFrom('NGN', 'GHS', 'ZAR', 'USD'),
    }),
  })
  .map((obj) => JSON.stringify(obj));

// ── Property 14: Paystack Webhook Signature Verification ────────

/**
 * **Validates: Requirements 7.2**
 *
 * For any request body and secret key, HMAC-SHA512 of body with secret
 * should produce the expected signature; invalid signatures should be
 * rejected with 401.
 */
describe('Property 14: Paystack Webhook Signature Verification', () => {
  let guard: WebhookGuard;

  beforeEach(() => {
    guard = new WebhookGuard();
  });

  afterEach(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  function createMockContext(
    headers: Record<string, string>,
    body: unknown,
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers, body, ip: '127.0.0.1' }),
      }),
    } as unknown as ExecutionContext;
  }

  it('valid HMAC-SHA512 signature is accepted for any body and secret', () => {
    fc.assert(
      fc.property(webhookBodyArb, secretKeyArb, (bodyStr, secret) => {
        process.env.PAYSTACK_SECRET_KEY = secret;

        const expectedSig = createHmac('sha512', secret)
          .update(bodyStr)
          .digest('hex');

        // Static method should confirm validity
        expect(WebhookGuard.verifySignature(bodyStr, expectedSig, secret)).toBe(true);

        // Guard should allow the request through
        const body = JSON.parse(bodyStr);
        const ctx = createMockContext({ 'x-paystack-signature': expectedSig }, body);
        expect(guard.canActivate(ctx)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('tampered signature is rejected with UnauthorizedException for any body and secret', () => {
    fc.assert(
      fc.property(webhookBodyArb, secretKeyArb, (bodyStr, secret) => {
        process.env.PAYSTACK_SECRET_KEY = secret;

        // Compute the correct signature then flip a character to tamper it
        const correctSig = createHmac('sha512', secret)
          .update(bodyStr)
          .digest('hex');

        // Create a tampered signature by replacing the first hex char
        const firstChar = correctSig[0];
        const replacement = firstChar === 'a' ? 'b' : 'a';
        const tamperedSig = replacement + correctSig.slice(1);

        // Static method should reject
        expect(WebhookGuard.verifySignature(bodyStr, tamperedSig, secret)).toBe(false);

        // Guard should throw UnauthorizedException (HTTP 401)
        const body = JSON.parse(bodyStr);
        const ctx = createMockContext({ 'x-paystack-signature': tamperedSig }, body);
        expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
      }),
      { numRuns: 100 },
    );
  });

  it('signature computed with wrong secret is rejected for any body', () => {
    fc.assert(
      fc.property(
        webhookBodyArb,
        secretKeyArb,
        secretKeyArb,
        (bodyStr, correctSecret, wrongSecret) => {
          // Skip when both secrets happen to be identical
          fc.pre(correctSecret !== wrongSecret);

          process.env.PAYSTACK_SECRET_KEY = correctSecret;

          const wrongSig = createHmac('sha512', wrongSecret)
            .update(bodyStr)
            .digest('hex');

          // Static method should reject
          expect(
            WebhookGuard.verifySignature(bodyStr, wrongSig, correctSecret),
          ).toBe(false);

          // Guard should throw UnauthorizedException (HTTP 401)
          const body = JSON.parse(bodyStr);
          const ctx = createMockContext({ 'x-paystack-signature': wrongSig }, body);
          expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('missing signature header is rejected with UnauthorizedException for any body and secret', () => {
    fc.assert(
      fc.property(webhookBodyArb, secretKeyArb, (bodyStr, secret) => {
        process.env.PAYSTACK_SECRET_KEY = secret;

        const body = JSON.parse(bodyStr);
        const ctx = createMockContext({}, body);
        expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Property 15: No Raw Card Data Storage ───────────────────────

/**
 * **Validates: Requirements 7.7**
 *
 * For any payment operation, stored data and log output should contain
 * only authorization code and last four digits — never a full card
 * number, CVV, or expiry.
 */
describe('Property 15: No Raw Card Data Storage', () => {
  let service: PaymentGatewayService;

  beforeEach(() => {
    service = new PaymentGatewayService();
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_prop15';
  });

  afterEach(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  /** Arbitrary 16-digit card number (string of exactly 16 digits). */
  const fullCardNumberArb = fc
    .array(fc.integer({ min: 0, max: 9 }), { minLength: 16, maxLength: 16 })
    .map((digits) => digits.join(''));

  /** Arbitrary CVV: 3 or 4 digit string. */
  const cvvArb = fc
    .integer({ min: 3, max: 4 })
    .chain((len) =>
      fc
        .array(fc.integer({ min: 0, max: 9 }), { minLength: len, maxLength: len })
        .map((digits) => digits.join('')),
    );

  /** Arbitrary expiry month (01-12) and year (2024-2040). */
  const expiryArb = fc.record({
    exp_month: fc.integer({ min: 1, max: 12 }).map((m) => String(m).padStart(2, '0')),
    exp_year: fc.integer({ min: 2024, max: 2040 }).map(String),
  });

  /** Arbitrary authorization code (Paystack format). */
  const authCodeArb = fc
    .string({ minLength: 5, maxLength: 30 })
    .filter((s) => s.trim().length > 0)
    .map((s) => `AUTH_${s}`);

  it('extractSafeCardData never contains full card number, CVV, or expiry', () => {
    fc.assert(
      fc.property(
        fullCardNumberArb,
        cvvArb,
        expiryArb,
        authCodeArb,
        (cardNumber, cvv, expiry, authCode) => {
          const last4 = cardNumber.slice(-4);

          const authorization: Record<string, unknown> = {
            authorization_code: authCode,
            last4,
            card_type: 'visa',
            bin: cardNumber.slice(0, 6),
            exp_month: expiry.exp_month,
            exp_year: expiry.exp_year,
            cvv,
            card_number: cardNumber,
          };

          const safe = service.extractSafeCardData(authorization);

          // Safe data must only have authorization_code and last4
          expect(Object.keys(safe).sort()).toEqual(['authorization_code', 'last4']);
          expect(safe.authorization_code).toBe(authCode);
          expect(safe.last4).toBe(last4);

          // Serialize safe data to check nothing sensitive leaked
          const safeStr = JSON.stringify(safe);

          // Full card number must never appear in safe data
          expect(safeStr).not.toContain(cardNumber);

          // CVV must never appear as a value in safe data
          expect(safe).not.toHaveProperty('cvv');
          expect(Object.values(safe)).not.toContain(cvv);

          // Expiry must never appear in safe data
          expect(safe).not.toHaveProperty('exp_month');
          expect(safe).not.toHaveProperty('exp_year');
          expect(Object.values(safe)).not.toContain(expiry.exp_month);
          expect(Object.values(safe)).not.toContain(expiry.exp_year);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('extractSafeCardData strips sensitive fields even when authorization object has extra properties', () => {
    fc.assert(
      fc.property(
        fullCardNumberArb,
        cvvArb,
        expiryArb,
        authCodeArb,
        fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }).filter(
            (k) => !['authorization_code', 'last4', '__proto__', 'constructor', 'prototype'].includes(k),
          ),
          fc.string({ minLength: 1, maxLength: 20 }),
        ),
        (cardNumber, cvv, expiry, authCode, extraFields) => {
          const last4 = cardNumber.slice(-4);

          const authorization: Record<string, unknown> = {
            ...extraFields,
            authorization_code: authCode,
            last4,
            card_number: cardNumber,
            cvv,
            exp_month: expiry.exp_month,
            exp_year: expiry.exp_year,
          };

          const safe = service.extractSafeCardData(authorization);

          // Only two keys allowed
          const keys = Object.keys(safe);
          expect(keys).toHaveLength(2);
          expect(keys).toContain('authorization_code');
          expect(keys).toContain('last4');

          // No extra fields leaked through
          for (const key of Object.keys(extraFields)) {
            expect(safe).not.toHaveProperty(key);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('safe card data never contains raw card number in any serialized form', () => {
    fc.assert(
      fc.property(
        fullCardNumberArb,
        authCodeArb,
        (cardNumber, authCode) => {
          const last4 = cardNumber.slice(-4);

          const authorization: Record<string, unknown> = {
            authorization_code: authCode,
            last4,
            card_number: cardNumber,
            bin: cardNumber.slice(0, 6),
          };

          const safe = service.extractSafeCardData(authorization);
          const serialized = JSON.stringify(safe);

          // The full 16-digit card number must never appear
          expect(serialized).not.toContain(cardNumber);

          // The BIN (first 6 digits) must not appear in safe data
          expect(safe).not.toHaveProperty('bin');
          expect(safe).not.toHaveProperty('card_number');
        },
      ),
      { numRuns: 100 },
    );
  });
});
