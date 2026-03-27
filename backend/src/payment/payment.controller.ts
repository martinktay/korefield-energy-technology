/**
 * @file payment.controller.ts
 * REST controller for the payment domain.
 * Exposes endpoints for pricing computation, price locking, checkout,
 * installment pause/resume, payment status, and webhook processing.
 * Integrates fraud monitoring on webhook callbacks.
 */
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Logger,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { PricingQueryDto } from './dto/pricing-query.dto';
import { PriceLockDto } from './dto/price-lock.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { PauseInstallmentDto } from './dto/pause-installment.dto';
import { ResumeInstallmentDto } from './dto/resume-installment.dto';
import { WebhookGuard } from './webhook.guard';
import { FraudMonitorService } from './fraud-monitor.service';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly fraudMonitorService: FraudMonitorService,
  ) {}

  /**
   * GET /payment/pricing/:trackId
   * Compute final payable amount for a track.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('pricing/:trackId')
  async getPricing(
    @Param('trackId') trackId: string,
    @Query() query: PricingQueryDto,
  ) {
    return this.paymentService.computePricing(
      trackId,
      query.country_code,
      query.plan_type ?? 'full',
      query.learner_id,
    );
  }

  /**
   * POST /payment/pricing/lock
   * Lock the displayed price for 30 minutes during checkout.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('pricing/lock')
  async lockPrice(@Body() dto: PriceLockDto & { plan_type?: string; learner_id?: string }) {
    return this.paymentService.lockPrice(
      dto.track_id,
      dto.country_code,
      dto.plan_type ?? 'full',
      dto.learner_id,
    );
  }

  /**
   * POST /payment/checkout
   * Create a PaymentPlan (full/2-pay/3-pay) and generate installment schedule.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  async checkout(@Body() dto: CheckoutDto) {
    return this.paymentService.checkout(
      dto.enrollment_id,
      dto.plan_type,
      dto.country_code,
    );
  }

  /**
   * POST /payment/installments/:installmentId/pause
   * Suspend future charges voluntarily.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('installments/:installmentId/pause')
  async pauseInstallment(
    @Param('installmentId') installmentId: string,
    @Body() _dto: PauseInstallmentDto,
  ) {
    return this.paymentService.pauseInstallment(installmentId);
  }

  /**
   * POST /payment/installments/:installmentId/resume
   * Recalculate remaining schedule and resume charges.
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('installments/:installmentId/resume')
  async resumeInstallment(
    @Param('installmentId') installmentId: string,
    @Body() _dto: ResumeInstallmentDto,
  ) {
    return this.paymentService.resumeInstallment(installmentId);
  }

  /**
   * GET /payment/status
   * Return payment plan status, outstanding balances, upcoming installments.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('status')
  async getPaymentStatus(@Query('enrollment_id') enrollmentId: string) {
    return this.paymentService.getPaymentStatus(enrollmentId);
  }

  /**
   * POST /payment/webhook
   * Payment provider webhook callback endpoint.
   * Protected by HMAC-SHA256 signature verification via WebhookGuard.
   */
  @UseGuards(WebhookGuard)
  @Post('webhook')
  async handleWebhook(@Body() body: Record<string, unknown>, @Req() req: Request) {
    const eventType = body.event_type as string;
    const installmentId = body.installment_id as string | undefined;
    const userId = body.user_id as string | undefined;

    this.logger.log(
      JSON.stringify({
        event: 'webhook_received',
        event_type: eventType,
        installment_id: installmentId,
        ip: req.ip,
        timestamp: new Date().toISOString(),
      }),
    );

    // Run fraud checks if user context is available
    if (userId) {
      const paymentCountry = body.payment_country as string | undefined;
      const registeredCountry = body.registered_country as string | undefined;
      const success = body.status === 'succeeded';

      this.fraudMonitorService.recordAttempt(userId, success);

      const alerts = this.fraudMonitorService.runAllChecks({
        userId,
        paymentCountry,
        registeredCountry,
      });

      if (alerts.length > 0) {
        this.logger.warn(
          JSON.stringify({
            event: 'webhook_fraud_alerts',
            user_id: userId,
            alert_count: alerts.length,
            alert_types: alerts.map((a) => a.type),
            timestamp: new Date().toISOString(),
          }),
        );
      }
    }

    // Process payment events
    if (eventType === 'payment.succeeded' && installmentId) {
      await this.paymentService.markInstallmentPaid(installmentId);
    }

    return { received: true };
  }
}
