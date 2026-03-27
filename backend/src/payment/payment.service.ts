/**
 * @file payment.service.ts
 * Core payment service implementing the Pricing Intelligence Engine.
 * Handles region-aware pricing computation, price locking during checkout,
 * installment plan creation (full/2-pay/3-pay), pause/resume lifecycle,
 * and payment status tracking with grace period enforcement.
 */
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';
import { generateId } from '@common/utils/generate-id';
import {
  getCurrencyForCountry,
  convertFromUsd,
} from './exchange-rates';

/** Default grace period in days before access is paused. */
const GRACE_PERIOD_DAYS = 14;

/** Default account lock threshold in days after grace period. */
const ACCOUNT_LOCK_THRESHOLD_DAYS = 7;

/** Cache TTL for computed pricing (seconds). */
const PRICING_CACHE_TTL = 300; // 5 minutes

/** Price lock TTL during checkout (seconds). */
const PRICE_LOCK_TTL = 1800; // 30 minutes

export interface InstallmentItem {
  sequence: number;
  percentage: number;
  amount: number;
  label: string;
}

export interface PricingResult {
  track_id: string;
  country_code: string;
  currency: string;
  base_price_usd: number;
  multiplier: number;
  adjusted_price_usd: number;
  campaign_discount_usd: number;
  scholarship_deduction_usd: number;
  final_amount_usd: number;
  final_amount_local: number;
  floor_price_usd: number;
  ceiling_price_usd: number;
  plan_type: string;
  installments: InstallmentItem[];
  grace_period_days: number;
  account_lock_threshold_days: number;
}

/** Payment plan split definitions. */
const PLAN_SPLITS: Record<string, { percentage: number; label: string }[]> = {
  full: [{ percentage: 100, label: 'Full payment at enrollment' }],
  two_pay: [
    { percentage: 60, label: 'At enrollment' },
    { percentage: 40, label: 'At midpoint' },
  ],
  three_pay: [
    { percentage: 40, label: 'At enrollment' },
    { percentage: 30, label: 'At one-third' },
    { percentage: 30, label: 'At two-thirds' },
  ],
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Compute the final pricing for a track given country, plan, and learner.
   *
   * Computation order:
   * 1. Look up base price for track (PricingConfig)
   * 2. Apply purchasing power multiplier from CountryBand
   * 3. Apply campaign discounts (most specific first)
   * 4. Apply scholarship/sponsorship deductions
   * 5. Enforce floor and ceiling price bounds
   * 6. Generate installment schedule based on payment plan type
   */
  async computePricing(
    trackId: string,
    countryCode: string,
    planType: string = 'full',
    learnerId?: string,
  ): Promise<PricingResult> {
    // Check cache first
    const cacheKey = `pricing:${trackId}:${countryCode.toUpperCase()}`;
    const cached = await this.cache.get<PricingResult>(cacheKey);
    if (cached && cached.plan_type === planType && !learnerId) {
      return cached;
    }

    // 1. Look up base price for track
    const pricingConfig = await this.prisma.pricingConfig.findFirst({
      where: {
        track_id: trackId,
        effective_from: { lte: new Date() },
      },
      orderBy: { effective_from: 'desc' },
    });

    if (!pricingConfig) {
      throw new NotFoundException(
        `No pricing configuration found for track ${trackId}`,
      );
    }

    // 2. Apply purchasing power multiplier from CountryBand
    const countryBand = await this.prisma.countryBand.findUnique({
      where: { country_code: countryCode.toUpperCase() },
    });

    if (!countryBand) {
      throw new NotFoundException(
        `No country band found for country code ${countryCode}`,
      );
    }

    const multiplier = countryBand.multiplier;
    let adjustedPrice = pricingConfig.base_price * multiplier;

    // 3. Apply campaign discounts (most specific first — by earliest active_to)
    const campaignDiscount = await this.computeCampaignDiscount(adjustedPrice);
    adjustedPrice -= campaignDiscount;

    // 4. Apply scholarship/sponsorship deductions
    let scholarshipDeduction = 0;
    if (learnerId) {
      scholarshipDeduction = await this.computeScholarshipDeduction(learnerId);
      adjustedPrice -= scholarshipDeduction;
    }

    // 5. Enforce floor and ceiling price bounds
    const floorPrice = pricingConfig.floor_price * multiplier;
    const ceilingPrice = pricingConfig.ceiling_price * multiplier;

    if (adjustedPrice < floorPrice) {
      adjustedPrice = floorPrice;
    }
    if (adjustedPrice > ceilingPrice) {
      adjustedPrice = ceilingPrice;
    }

    // Round to 2 decimal places
    adjustedPrice = Math.round(adjustedPrice * 100) / 100;

    // 6. Generate installment schedule
    const splits = PLAN_SPLITS[planType] ?? PLAN_SPLITS.full;
    const installments: InstallmentItem[] = splits.map((split, index) => ({
      sequence: index + 1,
      percentage: split.percentage,
      amount: Math.round((adjustedPrice * split.percentage) / 100 * 100) / 100,
      label: split.label,
    }));

    // Convert to local currency
    const currency = getCurrencyForCountry(countryCode);
    const finalAmountLocal = convertFromUsd(adjustedPrice, currency);

    const result: PricingResult = {
      track_id: trackId,
      country_code: countryCode.toUpperCase(),
      currency,
      base_price_usd: pricingConfig.base_price,
      multiplier,
      adjusted_price_usd: adjustedPrice,
      campaign_discount_usd: Math.round(campaignDiscount * 100) / 100,
      scholarship_deduction_usd: Math.round(scholarshipDeduction * 100) / 100,
      final_amount_usd: adjustedPrice,
      final_amount_local: finalAmountLocal,
      floor_price_usd: Math.round(floorPrice * 100) / 100,
      ceiling_price_usd: Math.round(ceilingPrice * 100) / 100,
      plan_type: planType,
      installments,
      grace_period_days: GRACE_PERIOD_DAYS,
      account_lock_threshold_days: ACCOUNT_LOCK_THRESHOLD_DAYS,
    };

    // Cache result (only for non-learner-specific queries)
    if (!learnerId) {
      await this.cache.set(cacheKey, result, PRICING_CACHE_TTL);
    }

    return result;
  }

  /**
   * Compute total campaign discount from all active campaigns.
   * Precedence: most specific (earliest expiry) first.
   */
  private async computeCampaignDiscount(
    priceBeforeDiscount: number,
  ): Promise<number> {
    const now = new Date();
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        active_from: { lte: now },
        active_to: { gte: now },
      },
      orderBy: { active_to: 'asc' }, // most specific first (earliest expiry)
    });

    let totalDiscount = 0;
    for (const campaign of campaigns) {
      if (campaign.discount_type === 'percentage') {
        totalDiscount += (priceBeforeDiscount * campaign.discount_value) / 100;
      } else if (campaign.discount_type === 'fixed') {
        totalDiscount += campaign.discount_value;
      }
    }

    return totalDiscount;
  }

  /**
   * Compute total scholarship/sponsorship deduction for a learner.
   */
  private async computeScholarshipDeduction(
    learnerId: string,
  ): Promise<number> {
    const scholarships = await this.prisma.scholarship.findMany({
      where: { learner_id: learnerId },
    });

    return scholarships.reduce(
      (total: number, sch: { adjustment_amount: number }) =>
        total + sch.adjustment_amount,
      0,
    );
  }

  /**
   * Lock the displayed price for 30 minutes during checkout.
   * Returns the locked pricing result.
   */
  async lockPrice(
    trackId: string,
    countryCode: string,
    planType: string = 'full',
    learnerId?: string,
  ): Promise<PricingResult> {
    const pricing = await this.computePricing(
      trackId,
      countryCode,
      planType,
      learnerId,
    );

    const lockKey = `pricelock:${trackId}:${countryCode.toUpperCase()}:${learnerId ?? 'anon'}`;
    await this.cache.set(lockKey, pricing, PRICE_LOCK_TTL);

    this.logger.log(
      `Price locked for ${lockKey} — ${pricing.final_amount_usd} USD`,
    );

    return pricing;
  }

  /**
   * Retrieve a previously locked price. Returns null if expired.
   */
  async getLockedPrice(
    trackId: string,
    countryCode: string,
    learnerId?: string,
  ): Promise<PricingResult | null> {
    const lockKey = `pricelock:${trackId}:${countryCode.toUpperCase()}:${learnerId ?? 'anon'}`;
    return this.cache.get<PricingResult>(lockKey);
  }

  // ─── Installment Payment Plans ──────────────────────────────

  /**
   * Create a PaymentPlan with installment schedule for an enrollment.
   *
   * - full: single payment at enrollment
   * - two_pay: 60% at enrollment, 40% at enrollment + 3 months
   * - three_pay: 40% at enrollment, 30% at enrollment + 2 months, 30% at enrollment + 4 months
   */
  async checkout(
    enrollmentId: string,
    planType: 'full' | 'two_pay' | 'three_pay',
    countryCode: string,
  ) {
    // Verify enrollment exists
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { track: true },
    });
    if (!enrollment) {
      throw new NotFoundException(`Enrollment ${enrollmentId} not found`);
    }

    // Check for existing active payment plan
    const existingPlan = await this.prisma.paymentPlan.findFirst({
      where: {
        enrollment_id: enrollmentId,
        status: { in: ['active', 'paused'] },
      },
    });
    if (existingPlan) {
      throw new ConflictException(
        `Enrollment ${enrollmentId} already has an active payment plan`,
      );
    }

    // Compute pricing
    const pricing = await this.computePricing(
      enrollment.track_id,
      countryCode,
      planType,
    );

    const totalAmount = pricing.final_amount_usd;
    const currency = pricing.currency;
    const now = new Date();

    // Build installment schedule with due dates
    const splits = PLAN_SPLITS[planType] ?? PLAN_SPLITS.full;
    const dueDates = this.computeDueDates(planType, now);

    const planId = generateId('PAY');
    const installmentRecords = splits.map((split, index) => ({
      id: generateId('IST'),
      plan_id: planId,
      sequence: index + 1,
      amount: Math.round((totalAmount * split.percentage) / 100 * 100) / 100,
      due_date: dueDates[index],
      status: index === 0 ? 'pending' as const : 'pending' as const,
      grace_period_end: new Date(
        dueDates[index].getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
      ),
    }));

    // Create payment plan with installments in a transaction
    const paymentPlan = await this.prisma.paymentPlan.create({
      data: {
        id: planId,
        enrollment_id: enrollmentId,
        plan_type: planType,
        total_amount: totalAmount,
        currency,
        status: 'active',
        installments: {
          create: installmentRecords,
        },
      },
      include: { installments: true },
    });

    // Enqueue scheduled installment processing for future installments
    for (const installment of paymentPlan.installments) {
      if (installment.sequence > 1) {
        this.enqueuePaymentEvent({
          type: 'scheduled_installment',
          installment_id: installment.id,
          plan_id: planId,
          due_date: installment.due_date.toISOString(),
        });
      }
    }

    this.logger.log(
      `Payment plan ${planId} created for enrollment ${enrollmentId} — ${planType}, ${totalAmount} ${currency}`,
    );

    return paymentPlan;
  }

  /**
   * Compute due dates for installments based on plan type.
   */
  private computeDueDates(
    planType: string,
    enrollmentDate: Date,
  ): Date[] {
    const base = new Date(enrollmentDate);

    switch (planType) {
      case 'two_pay':
        return [
          new Date(base),
          new Date(new Date(base).setMonth(base.getMonth() + 3)),
        ];
      case 'three_pay':
        return [
          new Date(base),
          new Date(new Date(base).setMonth(base.getMonth() + 2)),
          new Date(new Date(base).setMonth(base.getMonth() + 4)),
        ];
      case 'full':
      default:
        return [new Date(base)];
    }
  }

  /**
   * Pause an installment — suspend future charges voluntarily.
   * Only pending installments can be paused.
   */
  async pauseInstallment(installmentId: string) {
    const installment = await this.prisma.installment.findUnique({
      where: { id: installmentId },
      include: { plan: true },
    });

    if (!installment) {
      throw new NotFoundException(`Installment ${installmentId} not found`);
    }

    if (installment.status !== 'pending') {
      throw new BadRequestException(
        `Cannot pause installment with status '${installment.status}'. Only pending installments can be paused.`,
      );
    }

    // Update installment status to paused
    const updated = await this.prisma.installment.update({
      where: { id: installmentId },
      data: { status: 'paused' },
    });

    // If all remaining installments are paused, pause the plan
    const pendingInstallments = await this.prisma.installment.findMany({
      where: {
        plan_id: installment.plan_id,
        status: 'pending',
      },
    });

    if (pendingInstallments.length === 0) {
      await this.prisma.paymentPlan.update({
        where: { id: installment.plan_id },
        data: { status: 'paused' },
      });
    }

    this.logger.log(`Installment ${installmentId} paused`);

    return updated;
  }

  /**
   * Resume a paused installment — recalculate remaining schedule and resume charges.
   */
  async resumeInstallment(installmentId: string) {
    const installment = await this.prisma.installment.findUnique({
      where: { id: installmentId },
      include: { plan: true },
    });

    if (!installment) {
      throw new NotFoundException(`Installment ${installmentId} not found`);
    }

    if (installment.status !== 'paused') {
      throw new BadRequestException(
        `Cannot resume installment with status '${installment.status}'. Only paused installments can be resumed.`,
      );
    }

    const now = new Date();

    // Recalculate due date: if original due date has passed, set to now + original interval
    let newDueDate = installment.due_date;
    if (installment.due_date < now) {
      newDueDate = now;
    }

    const newGracePeriodEnd = new Date(
      newDueDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
    );

    const updated = await this.prisma.installment.update({
      where: { id: installmentId },
      data: {
        status: 'pending',
        due_date: newDueDate,
        grace_period_end: newGracePeriodEnd,
      },
    });

    // Ensure the plan is active
    await this.prisma.paymentPlan.update({
      where: { id: installment.plan_id },
      data: { status: 'active' },
    });

    // Re-enqueue for processing
    this.enqueuePaymentEvent({
      type: 'scheduled_installment',
      installment_id: installmentId,
      plan_id: installment.plan_id,
      due_date: newDueDate.toISOString(),
    });

    this.logger.log(`Installment ${installmentId} resumed, new due date: ${newDueDate.toISOString()}`);

    return updated;
  }

  /**
   * Get payment status for an enrollment — plan status, outstanding balances, upcoming installments.
   */
  async getPaymentStatus(enrollmentId: string) {
    const plans = await this.prisma.paymentPlan.findMany({
      where: { enrollment_id: enrollmentId },
      include: {
        installments: { orderBy: { sequence: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });

    if (plans.length === 0) {
      throw new NotFoundException(
        `No payment plans found for enrollment ${enrollmentId}`,
      );
    }

    return plans.map((plan) => {
      const paidAmount = plan.installments
        .filter((i) => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);

      const outstandingAmount = plan.total_amount - paidAmount;

      const upcomingInstallments = plan.installments.filter(
        (i) => i.status === 'pending' || i.status === 'overdue',
      );

      return {
        plan_id: plan.id,
        plan_type: plan.plan_type,
        status: plan.status,
        total_amount: plan.total_amount,
        currency: plan.currency,
        paid_amount: Math.round(paidAmount * 100) / 100,
        outstanding_amount: Math.round(outstandingAmount * 100) / 100,
        installments: plan.installments,
        upcoming_installments: upcomingInstallments,
      };
    });
  }

  /**
   * Apply grace period logic for overdue installments.
   *
   * - If installment is past due date but within grace period: mark as overdue
   * - If installment is past grace period end: pause access (return access_paused flag)
   * - Progress is always preserved
   * - On payment: restore access
   */
  async applyGracePeriodLogic(installmentId: string): Promise<{
    installment_id: string;
    status: string;
    access_paused: boolean;
    grace_period_end: Date | null;
    progress_preserved: boolean;
  }> {
    const installment = await this.prisma.installment.findUnique({
      where: { id: installmentId },
      include: { plan: true },
    });

    if (!installment) {
      throw new NotFoundException(`Installment ${installmentId} not found`);
    }

    const now = new Date();
    let accessPaused = false;
    let newStatus = installment.status;

    if (
      installment.status === 'pending' &&
      installment.due_date < now
    ) {
      // Past due date — mark as overdue
      newStatus = 'overdue';
      await this.prisma.installment.update({
        where: { id: installmentId },
        data: { status: 'overdue' },
      });
    }

    if (
      (installment.status === 'overdue' || newStatus === 'overdue') &&
      installment.grace_period_end &&
      installment.grace_period_end < now
    ) {
      // Past grace period — pause access
      accessPaused = true;
    }

    return {
      installment_id: installmentId,
      status: newStatus,
      access_paused: accessPaused,
      grace_period_end: installment.grace_period_end,
      progress_preserved: true, // Progress is always preserved
    };
  }

  /**
   * Mark an installment as paid and restore access if previously paused.
   */
  async markInstallmentPaid(installmentId: string) {
    const installment = await this.prisma.installment.findUnique({
      where: { id: installmentId },
      include: { plan: { include: { installments: true } } },
    });

    if (!installment) {
      throw new NotFoundException(`Installment ${installmentId} not found`);
    }

    if (installment.status === 'paid') {
      throw new BadRequestException(`Installment ${installmentId} is already paid`);
    }

    const updated = await this.prisma.installment.update({
      where: { id: installmentId },
      data: {
        status: 'paid',
        paid_at: new Date(),
      },
    });

    // Check if all installments are paid — complete the plan
    const allInstallments = installment.plan.installments;
    const allPaidAfterThis = allInstallments.every(
      (i) => i.id === installmentId || i.status === 'paid',
    );

    if (allPaidAfterThis) {
      await this.prisma.paymentPlan.update({
        where: { id: installment.plan_id },
        data: { status: 'completed' },
      });
    }

    this.logger.log(`Installment ${installmentId} marked as paid`);

    return {
      ...updated,
      access_restored: installment.status === 'overdue',
      plan_completed: allPaidAfterThis,
    };
  }

  /**
   * Stub: Enqueue a payment event to the payment-events SQS queue.
   * Real SQS integration comes with workers.
   */
  enqueuePaymentEvent(message: Record<string, unknown>): void {
    this.logger.log(
      `[SQS STUB] Enqueuing to payment-events: ${JSON.stringify(message)}`,
    );
  }
}
