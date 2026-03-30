/**
 * @file payment.module.ts
 * NestJS module for the payment domain.
 * Provides pricing intelligence, installment management, gateway integration,
 * payment state machine, and fraud monitoring services.
 */
import { Module } from '@nestjs/common';
import { EmailModule } from '@email/email.module';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentStateMachine } from './payment-state-machine';
import { FraudMonitorService } from './fraud-monitor.service';
import { CouponService } from './coupon.service';

@Module({
  imports: [EmailModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentGatewayService,
    PaymentStateMachine,
    FraudMonitorService,
    CouponService,
  ],
  exports: [PaymentService, PaymentGatewayService, PaymentStateMachine, FraudMonitorService, CouponService],
})
export class PaymentModule {}
