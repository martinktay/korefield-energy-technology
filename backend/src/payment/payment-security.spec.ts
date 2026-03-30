/**
 * @file payment-security.spec.ts
 * Tests for payment security components: Paystack webhook signature
 * verification (HMAC-SHA512), payment state machine transitions,
 * fraud monitoring, and gateway PCI DSS compliance.
 */
import { createHmac } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
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
