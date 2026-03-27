import { createHmac } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { WebhookGuard } from './webhook.guard';
import { PaymentStateMachine } from './payment-state-machine';
import { FraudMonitorService } from './fraud-monitor.service';
import { PaymentGatewayService } from './payment-gateway.service';

// ── WebhookGuard Tests ──────────────────────────────────────────

describe('WebhookGuard', () => {
  let guard: WebhookGuard;
  const TEST_SECRET = 'test-webhook-secret-key';

  beforeEach(() => {
    guard = new WebhookGuard();
    process.env.PAYMENT_WEBHOOK_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.PAYMENT_WEBHOOK_SECRET;
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
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  it('should accept a valid HMAC-SHA256 signature', () => {
    const body = { event_type: 'payment.succeeded', amount: 100 };
    const bodyStr = JSON.stringify(body);
    const signature = signPayload(bodyStr, TEST_SECRET);
    const ctx = createMockContext({ 'x-webhook-signature': signature }, body);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should reject an invalid signature', () => {
    const body = { event_type: 'payment.succeeded' };
    const ctx = createMockContext(
      { 'x-webhook-signature': 'deadbeef'.repeat(8) },
      body,
    );
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });


  it('should reject when signature header is missing', () => {
    const body = { event_type: 'payment.succeeded' };
    const ctx = createMockContext({}, body);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should reject when webhook secret is not configured', () => {
    delete process.env.PAYMENT_WEBHOOK_SECRET;
    const body = { event_type: 'payment.succeeded' };
    const ctx = createMockContext({ 'x-webhook-signature': 'abc123' }, body);
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('should include timestamp in signature verification when present', () => {
    const body = { event_type: 'payment.succeeded' };
    const bodyStr = JSON.stringify(body);
    const timestamp = Date.now().toString();
    const payload = `${timestamp}.${bodyStr}`;
    const signature = signPayload(payload, TEST_SECRET);
    const ctx = createMockContext(
      { 'x-webhook-signature': signature, 'x-webhook-timestamp': timestamp },
      body,
    );
    expect(guard.canActivate(ctx)).toBe(true);
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
    // Record 6 attempts in quick succession
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

// ── PaymentGatewayService Tests ─────────────────────────────────

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService;

  beforeEach(() => {
    service = new PaymentGatewayService();
  });

  it('should tokenize card data and return a token (not raw card)', async () => {
    const result = await service.tokenizeCard({
      card_number: '4111111111111111',
      expiry_month: 12,
      expiry_year: 2028,
      cvv: '123',
    });
    expect(result.token).toBeDefined();
    expect(result.token).not.toContain('4111');
    expect(result.last_four).toBe('1111');
    expect(result.card_brand).toBe('visa');
  });

  it('should charge a tokenized card', async () => {
    const tokenResult = await service.tokenizeCard({
      card_number: '4111111111111111',
      expiry_month: 12,
      expiry_year: 2028,
      cvv: '123',
    });
    const chargeResult = await service.chargeToken(tokenResult.token, 600, 'USD');
    expect(chargeResult.status).toBe('succeeded');
    expect(chargeResult.charge_id).toBeDefined();
    expect(chargeResult.amount).toBe(600);
  });
});
