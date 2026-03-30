/**
 * @file payment-gateway.service.ts
 * Paystack payment gateway integration for PCI DSS-compliant transaction
 * initialization, webhook signature verification, and refund processing.
 * Only `authorization_code` and `last4` are stored — raw card numbers
 * never touch Academy servers.
 */
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { createHmac } from 'crypto';
import axios, { AxiosError } from 'axios';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/** Result of a successful transaction initialization. */
export interface InitializeTransactionResult {
  authorization_url: string;
  reference: string;
}

/** Result of a refund request. */
export interface RefundResult {
  refund_id: string;
  status: string;
  amount?: number;
}

/** Sanitized card data — only safe-to-store fields (PCI DSS). */
export interface SafeCardData {
  authorization_code: string;
  last4: string;
}

@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);

  /**
   * Initialize a Paystack transaction.
   * POSTs to Paystack's transaction/initialize endpoint and returns
   * the authorization URL for the learner to complete payment.
   *
   * @param params.email - Learner email address
   * @param params.amount - Amount in kobo/cents (smallest currency unit)
   * @param params.currency - Currency code (e.g. 'NGN', 'GHS', 'ZAR')
   * @param params.channels - Optional payment channels (e.g. ['card', 'mobile_money'])
   * @param params.mobile_money_provider - Optional mobile money provider
   */
  async initializeTransaction(params: {
    email: string;
    amount: number;
    currency: string;
    channels?: string[];
    mobile_money_provider?: string;
  }): Promise<InitializeTransactionResult> {
    const secretKey = this.getSecretKey();

    const payload: Record<string, unknown> = {
      email: params.email,
      amount: params.amount,
      currency: params.currency,
    };

    if (params.channels) {
      payload.channels = params.channels;
    }
    if (params.mobile_money_provider) {
      payload.metadata = {
        custom_fields: [
          { display_name: 'Mobile Money Provider', variable_name: 'mobile_money_provider', value: params.mobile_money_provider },
        ],
      };
    }

    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data?.data;

      this.logger.log(
        JSON.stringify({
          event: 'transaction_initialized',
          reference: data?.reference,
          currency: params.currency,
          timestamp: new Date().toISOString(),
        }),
      );

      return {
        authorization_url: data.authorization_url,
        reference: data.reference,
      };
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const paystackMessage =
        axiosErr.response?.data?.message ?? 'Paystack API error';

      this.logger.error(
        JSON.stringify({
          event: 'transaction_init_failed',
          error: paystackMessage,
          status: axiosErr.response?.status,
          timestamp: new Date().toISOString(),
        }),
      );

      throw new HttpException(
        paystackMessage,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Verify a Paystack webhook signature using HMAC-SHA512.
   * Compares the provided signature header against the computed hash
   * of the raw request body using the Paystack secret key.
   *
   * @param signature - The `x-paystack-signature` header value
   * @param body - The raw request body string
   * @returns true if the signature is valid
   */
  verifyWebhook(signature: string, body: string): boolean {
    const secretKey = this.getSecretKey();
    const hash = createHmac('sha512', secretKey)
      .update(body)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Create a refund for a previously charged transaction.
   * POSTs to Paystack's refund endpoint.
   *
   * @param transactionReference - The Paystack transaction reference
   * @param amount - Optional partial refund amount in kobo/cents
   */
  async refundCharge(
    transactionReference: string,
    amount?: number,
  ): Promise<RefundResult> {
    const secretKey = this.getSecretKey();

    const payload: Record<string, unknown> = {
      transaction: transactionReference,
    };
    if (amount !== undefined) {
      payload.amount = amount;
    }

    try {
      const response = await axios.post(
        `${PAYSTACK_BASE_URL}/refund`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data?.data;

      this.logger.log(
        JSON.stringify({
          event: 'refund_processed',
          refund_id: data?.id,
          transaction: transactionReference,
          amount: amount ?? 'full',
          timestamp: new Date().toISOString(),
        }),
      );

      return {
        refund_id: String(data.id),
        status: data.status,
        amount: data.amount,
      };
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const paystackMessage =
        axiosErr.response?.data?.message ?? 'Paystack refund error';

      this.logger.error(
        JSON.stringify({
          event: 'refund_failed',
          transaction: transactionReference,
          error: paystackMessage,
          timestamp: new Date().toISOString(),
        }),
      );

      throw new HttpException(paystackMessage, HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Extract safe-to-store card data from a Paystack authorization object.
   * Only `authorization_code` and `last4` are retained — never raw card
   * numbers, CVV, or full expiry (PCI DSS compliance).
   */
  extractSafeCardData(authorization: Record<string, unknown>): SafeCardData {
    return {
      authorization_code: String(authorization.authorization_code ?? ''),
      last4: String(authorization.last4 ?? ''),
    };
  }

  /**
   * Retrieve the Paystack secret key from environment variables.
   * @throws HttpException 503 if the key is not configured
   */
  private getSecretKey(): string {
    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
      throw new HttpException(
        'Payment gateway not configured',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return key;
  }
}
