/**
 * @file payment-gateway.service.ts
 * Stub payment gateway service simulating PCI DSS-compliant card tokenization
 * and charge operations. Only tokenized references are stored — no raw card data
 * ever touches Academy servers. Real gateway (Stripe/Paystack) integration is
 * deferred to production setup.
 */
import { Injectable, Logger } from '@nestjs/common';
import { generateId } from '@common/utils/generate-id';

/**
 * Tokenized payment reference — no raw card data stored.
 * Only the gateway token is persisted on Academy servers (PCI DSS compliant).
 */
export interface PaymentToken {
  token: string;
  last_four: string;
  card_brand: string;
  expiry_month: number;
  expiry_year: number;
  created_at: Date;
}

export interface ChargeResult {
  charge_id: string;
  status: 'succeeded' | 'failed' | 'pending';
  amount: number;
  currency: string;
  token: string;
  failure_reason?: string;
  created_at: Date;
}

/**
 * Payment gateway service stub.
 *
 * Simulates a PCI DSS-compliant payment gateway that handles
 * tokenized card storage and charge operations. Real gateway
 * integration (Stripe/Paystack) is deferred to production setup.
 *
 * Requirement 31.12: PCI DSS-compliant payment gateway
 * Requirement 31.13: Tokenized storage only, no raw card data
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  /**
   * Tokenize card details via the payment gateway.
   * Returns a token reference — raw card data is never stored.
   */
  async tokenizeCard(cardDetails: {
    card_number: string;
    expiry_month: number;
    expiry_year: number;
    cvv: string;
  }): Promise<PaymentToken> {
    const lastFour = cardDetails.card_number.slice(-4);
    const brand = this.detectCardBrand(cardDetails.card_number);

    const token: PaymentToken = {
      token: `tok_${generateId('PAY').replace('PAY-', '')}`,
      last_four: lastFour,
      card_brand: brand,
      expiry_month: cardDetails.expiry_month,
      expiry_year: cardDetails.expiry_year,
      created_at: new Date(),
    };

    this.logger.log(
      JSON.stringify({
        event: 'card_tokenized',
        last_four: lastFour,
        brand,
        timestamp: new Date().toISOString(),
      }),
    );

    return token;
  }

  /**
   * Charge a tokenized card.
   * Returns a charge result with status.
   */
  async chargeToken(
    token: string,
    amount: number,
    currency: string,
  ): Promise<ChargeResult> {
    const chargeId = `ch_${generateId('PAY').replace('PAY-', '')}`;

    const result: ChargeResult = {
      charge_id: chargeId,
      status: 'succeeded',
      amount,
      currency,
      token,
      created_at: new Date(),
    };

    this.logger.log(
      JSON.stringify({
        event: 'charge_completed',
        charge_id: chargeId,
        amount,
        currency,
        status: 'succeeded',
        timestamp: new Date().toISOString(),
      }),
    );

    return result;
  }

  /**
   * Refund a previous charge.
   */
  async refundCharge(
    chargeId: string,
    amount: number,
  ): Promise<{ refund_id: string; status: string }> {
    const refundId = `ref_${generateId('PAY').replace('PAY-', '')}`;

    this.logger.log(
      JSON.stringify({
        event: 'refund_processed',
        charge_id: chargeId,
        refund_id: refundId,
        amount,
        timestamp: new Date().toISOString(),
      }),
    );

    return { refund_id: refundId, status: 'succeeded' };
  }

  private detectCardBrand(cardNumber: string): string {
    const firstDigit = cardNumber[0];
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5') return 'mastercard';
    if (firstDigit === '3') return 'amex';
    return 'unknown';
  }
}
