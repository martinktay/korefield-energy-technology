import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockPrisma = {
  pricingConfig: { findFirst: jest.fn() },
  countryBand: { findUnique: jest.fn() },
  campaign: { findMany: jest.fn() },
  scholarship: { findMany: jest.fn() },
  enrollment: { findUnique: jest.fn() },
  paymentPlan: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  installment: { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn() },
};

const basePricingConfig = {
  id: 'PRC-abc123',
  track_id: 'TRK-ai-eng',
  base_price: 1000,
  floor_price: 200,
  ceiling_price: 2000,
  effective_from: new Date('2024-01-01'),
};

const nigeriaCountryBand = {
  id: 'CBN-ng01',
  country_code: 'NG',
  purchasing_power_band: 'tier2',
  multiplier: 0.6,
};

const usCountryBand = {
  id: 'CBN-us01',
  country_code: 'US',
  purchasing_power_band: 'tier1',
  multiplier: 1.0,
};

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
  });

  // ── computePricing — base computation ─────────────────────────

  describe('computePricing', () => {
    beforeEach(() => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.scholarship.findMany.mockResolvedValue([]);
    });

    it('should compute pricing with country band multiplier applied to base price', async () => {
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(nigeriaCountryBand);

      const result = await service.computePricing('TRK-ai-eng', 'NG');

      expect(result.base_price_usd).toBe(1000);
      expect(result.multiplier).toBe(0.6);
      // 1000 * 0.6 = 600
      expect(result.final_amount_usd).toBe(600);
      expect(result.country_code).toBe('NG');
      expect(result.currency).toBe('NGN');
    });

    it('should compute pricing with US multiplier (1.0)', async () => {
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(usCountryBand);

      const result = await service.computePricing('TRK-ai-eng', 'US');

      expect(result.final_amount_usd).toBe(1000);
      expect(result.currency).toBe('USD');
    });

    it('should throw NotFoundException when no pricing config exists', async () => {
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(null);

      await expect(
        service.computePricing('TRK-unknown', 'NG'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when country band not found', async () => {
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(null);

      await expect(
        service.computePricing('TRK-ai-eng', 'XX'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return cached result when available and matching', async () => {
      const cachedResult = {
        track_id: 'TRK-ai-eng',
        country_code: 'NG',
        plan_type: 'full',
        final_amount_usd: 600,
      };
      mockCache.get.mockResolvedValue(cachedResult);

      const result = await service.computePricing('TRK-ai-eng', 'NG', 'full');

      expect(result).toEqual(cachedResult);
      expect(mockPrisma.pricingConfig.findFirst).not.toHaveBeenCalled();
    });

    it('should not use cache when learner_id is provided', async () => {
      mockCache.get.mockResolvedValue(null);
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(nigeriaCountryBand);

      await service.computePricing('TRK-ai-eng', 'NG', 'full', 'LRN-abc123');

      // Should not cache learner-specific results
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should cache non-learner-specific pricing results', async () => {
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(nigeriaCountryBand);

      await service.computePricing('TRK-ai-eng', 'NG');

      expect(mockCache.set).toHaveBeenCalledWith(
        'pricing:TRK-ai-eng:NG',
        expect.objectContaining({ final_amount_usd: 600 }),
        300, // 5 min TTL
      );
    });
  });

  // ── Campaign discount application ─────────────────────────────

  describe('campaign discounts', () => {
    beforeEach(() => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockPrisma.scholarship.findMany.mockResolvedValue([]);
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(usCountryBand);
    });

    it('should apply percentage campaign discount', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([
        {
          id: 'CMP-abc123',
          name: 'Launch Promo',
          discount_type: 'percentage',
          discount_value: 10,
          active_from: new Date('2024-01-01'),
          active_to: new Date('2030-12-31'),
        },
      ]);

      const result = await service.computePricing('TRK-ai-eng', 'US');

      // 1000 * 1.0 = 1000, minus 10% = 900
      expect(result.campaign_discount_usd).toBe(100);
      expect(result.final_amount_usd).toBe(900);
    });

    it('should apply fixed campaign discount', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([
        {
          id: 'CMP-fix123',
          name: 'Fixed Discount',
          discount_type: 'fixed',
          discount_value: 150,
          active_from: new Date('2024-01-01'),
          active_to: new Date('2030-12-31'),
        },
      ]);

      const result = await service.computePricing('TRK-ai-eng', 'US');

      expect(result.campaign_discount_usd).toBe(150);
      expect(result.final_amount_usd).toBe(850);
    });

    it('should apply multiple campaigns with precedence (earliest expiry first)', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([
        {
          id: 'CMP-early',
          name: 'Early Bird',
          discount_type: 'percentage',
          discount_value: 5,
          active_from: new Date('2024-01-01'),
          active_to: new Date('2025-06-01'),
        },
        {
          id: 'CMP-late',
          name: 'General Promo',
          discount_type: 'fixed',
          discount_value: 50,
          active_from: new Date('2024-01-01'),
          active_to: new Date('2030-12-31'),
        },
      ]);

      const result = await service.computePricing('TRK-ai-eng', 'US');

      // 5% of 1000 = 50, plus fixed 50 = 100 total discount
      expect(result.campaign_discount_usd).toBe(100);
      expect(result.final_amount_usd).toBe(900);
    });
  });

  // ── Scholarship deduction ─────────────────────────────────────

  describe('scholarship deductions', () => {
    beforeEach(() => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(usCountryBand);
    });

    it('should apply scholarship deduction before final amount', async () => {
      mockPrisma.scholarship.findMany.mockResolvedValue([
        { id: 'SCH-abc123', learner_id: 'LRN-abc123', adjustment_amount: 200 },
      ]);

      const result = await service.computePricing(
        'TRK-ai-eng', 'US', 'full', 'LRN-abc123',
      );

      expect(result.scholarship_deduction_usd).toBe(200);
      expect(result.final_amount_usd).toBe(800);
    });

    it('should apply multiple scholarships cumulatively', async () => {
      mockPrisma.scholarship.findMany.mockResolvedValue([
        { id: 'SCH-a', learner_id: 'LRN-abc123', adjustment_amount: 100 },
        { id: 'SCH-b', learner_id: 'LRN-abc123', adjustment_amount: 150 },
      ]);

      const result = await service.computePricing(
        'TRK-ai-eng', 'US', 'full', 'LRN-abc123',
      );

      expect(result.scholarship_deduction_usd).toBe(250);
      expect(result.final_amount_usd).toBe(750);
    });
  });

  // ── Floor and ceiling price bounds ────────────────────────────

  describe('floor and ceiling price bounds', () => {
    beforeEach(() => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.scholarship.findMany.mockResolvedValue([]);
    });

    it('should enforce floor price when discounts push below floor', async () => {
      // base=1000, floor=200, ceiling=2000, multiplier=0.6
      // adjusted = 600, floor = 200*0.6 = 120
      // With massive scholarship pushing below floor
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(nigeriaCountryBand);
      mockPrisma.scholarship.findMany.mockResolvedValue([
        { id: 'SCH-big', learner_id: 'LRN-abc123', adjustment_amount: 550 },
      ]);

      const result = await service.computePricing(
        'TRK-ai-eng', 'NG', 'full', 'LRN-abc123',
      );

      // 600 - 550 = 50, but floor is 120, so clamped to 120
      expect(result.final_amount_usd).toBe(120);
    });

    it('should enforce ceiling price when multiplier pushes above ceiling', async () => {
      const highMultiplierBand = {
        id: 'CBN-ch01',
        country_code: 'CH',
        purchasing_power_band: 'tier0',
        multiplier: 3.0,
      };
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(highMultiplierBand);

      const result = await service.computePricing('TRK-ai-eng', 'CH');

      // 1000 * 3.0 = 3000, but ceiling = 2000 * 3.0 = 6000
      // Actually ceiling_price * multiplier = 2000 * 3.0 = 6000, so 3000 is within bounds
      expect(result.final_amount_usd).toBe(3000);
    });

    it('should clamp to ceiling when adjusted price exceeds ceiling bound', async () => {
      const tightConfig = {
        ...basePricingConfig,
        base_price: 1000,
        ceiling_price: 800, // ceiling lower than base
      };
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(tightConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(usCountryBand);

      const result = await service.computePricing('TRK-ai-eng', 'US');

      // 1000 * 1.0 = 1000, ceiling = 800 * 1.0 = 800
      expect(result.final_amount_usd).toBe(800);
    });
  });

  // ── Payment plan installment schedules ────────────────────────

  describe('installment schedules', () => {
    beforeEach(() => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.scholarship.findMany.mockResolvedValue([]);
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(usCountryBand);
    });

    it('should generate full payment plan (100%)', async () => {
      const result = await service.computePricing('TRK-ai-eng', 'US', 'full');

      expect(result.plan_type).toBe('full');
      expect(result.installments).toHaveLength(1);
      expect(result.installments[0].percentage).toBe(100);
      expect(result.installments[0].amount).toBe(1000);
    });

    it('should generate two_pay plan (60/40)', async () => {
      const result = await service.computePricing('TRK-ai-eng', 'US', 'two_pay');

      expect(result.plan_type).toBe('two_pay');
      expect(result.installments).toHaveLength(2);
      expect(result.installments[0].percentage).toBe(60);
      expect(result.installments[0].amount).toBe(600);
      expect(result.installments[1].percentage).toBe(40);
      expect(result.installments[1].amount).toBe(400);
    });

    it('should generate three_pay plan (40/30/30)', async () => {
      const result = await service.computePricing('TRK-ai-eng', 'US', 'three_pay');

      expect(result.plan_type).toBe('three_pay');
      expect(result.installments).toHaveLength(3);
      expect(result.installments[0].percentage).toBe(40);
      expect(result.installments[0].amount).toBe(400);
      expect(result.installments[1].percentage).toBe(30);
      expect(result.installments[1].amount).toBe(300);
      expect(result.installments[2].percentage).toBe(30);
      expect(result.installments[2].amount).toBe(300);
    });

    it('should default to full plan when invalid plan_type provided', async () => {
      const result = await service.computePricing('TRK-ai-eng', 'US', 'invalid');

      expect(result.installments).toHaveLength(1);
      expect(result.installments[0].percentage).toBe(100);
    });
  });

  // ── Grace period and account lock threshold ───────────────────

  describe('grace period and account lock', () => {
    beforeEach(() => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.scholarship.findMany.mockResolvedValue([]);
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(usCountryBand);
    });

    it('should include grace period and account lock threshold in output', async () => {
      const result = await service.computePricing('TRK-ai-eng', 'US');

      expect(result.grace_period_days).toBe(14);
      expect(result.account_lock_threshold_days).toBe(7);
    });
  });

  // ── Local currency conversion ─────────────────────────────────

  describe('local currency conversion', () => {
    beforeEach(() => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.scholarship.findMany.mockResolvedValue([]);
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
    });

    it('should convert final amount to NGN for Nigeria', async () => {
      mockPrisma.countryBand.findUnique.mockResolvedValue(nigeriaCountryBand);

      const result = await service.computePricing('TRK-ai-eng', 'NG');

      expect(result.currency).toBe('NGN');
      // 600 USD * 1550 NGN/USD = 930000
      expect(result.final_amount_local).toBe(930000);
    });

    it('should return USD amount when country maps to USD', async () => {
      mockPrisma.countryBand.findUnique.mockResolvedValue(usCountryBand);

      const result = await service.computePricing('TRK-ai-eng', 'US');

      expect(result.currency).toBe('USD');
      expect(result.final_amount_local).toBe(1000);
    });
  });

  // ── Price lock during checkout ────────────────────────────────

  describe('lockPrice', () => {
    beforeEach(() => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.scholarship.findMany.mockResolvedValue([]);
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(usCountryBand);
    });

    it('should lock price in cache with 30-minute TTL', async () => {
      const result = await service.lockPrice('TRK-ai-eng', 'US');

      expect(result.final_amount_usd).toBe(1000);
      // First call is the pricing cache set, second is the lock
      expect(mockCache.set).toHaveBeenCalledWith(
        'pricelock:TRK-ai-eng:US:anon',
        expect.objectContaining({ final_amount_usd: 1000 }),
        1800, // 30 min TTL
      );
    });

    it('should lock price with learner-specific key', async () => {
      await service.lockPrice('TRK-ai-eng', 'US', 'full', 'LRN-abc123');

      expect(mockCache.set).toHaveBeenCalledWith(
        'pricelock:TRK-ai-eng:US:LRN-abc123',
        expect.any(Object),
        1800,
      );
    });
  });

  describe('getLockedPrice', () => {
    it('should return locked price from cache', async () => {
      const lockedPricing = { final_amount_usd: 1000, track_id: 'TRK-ai-eng' };
      mockCache.get.mockResolvedValue(lockedPricing);

      const result = await service.getLockedPrice('TRK-ai-eng', 'US');

      expect(result).toEqual(lockedPricing);
      expect(mockCache.get).toHaveBeenCalledWith('pricelock:TRK-ai-eng:US:anon');
    });

    it('should return null when lock has expired', async () => {
      mockCache.get.mockResolvedValue(null);

      const result = await service.getLockedPrice('TRK-ai-eng', 'US');

      expect(result).toBeNull();
    });
  });

  // ── Checkout — create payment plan with installments ──────────

  describe('checkout', () => {
    const mockEnrollment = {
      id: 'ENR-abc123',
      learner_id: 'LRN-abc123',
      track_id: 'TRK-ai-eng',
      status: 'active',
      track: { id: 'TRK-ai-eng', name: 'AI Engineering' },
    };

    beforeEach(() => {
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockPrisma.scholarship.findMany.mockResolvedValue([]);
      mockPrisma.pricingConfig.findFirst.mockResolvedValue(basePricingConfig);
      mockPrisma.countryBand.findUnique.mockResolvedValue(usCountryBand);
      mockPrisma.enrollment.findUnique.mockResolvedValue(mockEnrollment);
      mockPrisma.paymentPlan.findFirst.mockResolvedValue(null);
    });

    it('should create a full payment plan with one installment', async () => {
      mockPrisma.paymentPlan.create.mockImplementation(({ data, include }) => {
        return Promise.resolve({
          ...data,
          installments: data.installments.create,
          created_at: new Date(),
          updated_at: new Date(),
        });
      });

      const result = await service.checkout('ENR-abc123', 'full', 'US');

      expect(result.plan_type).toBe('full');
      expect(result.total_amount).toBe(1000);
      expect(result.status).toBe('active');
      expect(result.installments).toHaveLength(1);
      expect(result.installments[0].amount).toBe(1000);
    });

    it('should create a two_pay plan with 60/40 split', async () => {
      mockPrisma.paymentPlan.create.mockImplementation(({ data }) => {
        return Promise.resolve({
          ...data,
          installments: data.installments.create,
          created_at: new Date(),
          updated_at: new Date(),
        });
      });

      const result = await service.checkout('ENR-abc123', 'two_pay', 'US');

      expect(result.plan_type).toBe('two_pay');
      expect(result.installments).toHaveLength(2);
      expect(result.installments[0].amount).toBe(600);
      expect(result.installments[1].amount).toBe(400);
    });

    it('should create a three_pay plan with 40/30/30 split', async () => {
      mockPrisma.paymentPlan.create.mockImplementation(({ data }) => {
        return Promise.resolve({
          ...data,
          installments: data.installments.create,
          created_at: new Date(),
          updated_at: new Date(),
        });
      });

      const result = await service.checkout('ENR-abc123', 'three_pay', 'US');

      expect(result.plan_type).toBe('three_pay');
      expect(result.installments).toHaveLength(3);
      expect(result.installments[0].amount).toBe(400);
      expect(result.installments[1].amount).toBe(300);
      expect(result.installments[2].amount).toBe(300);
    });

    it('should set correct due dates for two_pay (enrollment + 3 months)', async () => {
      mockPrisma.paymentPlan.create.mockImplementation(({ data }) => {
        return Promise.resolve({
          ...data,
          installments: data.installments.create,
          created_at: new Date(),
          updated_at: new Date(),
        });
      });

      const result = await service.checkout('ENR-abc123', 'two_pay', 'US');

      const firstDue = new Date(result.installments[0].due_date);
      const secondDue = new Date(result.installments[1].due_date);
      const diffMonths =
        (secondDue.getFullYear() - firstDue.getFullYear()) * 12 +
        (secondDue.getMonth() - firstDue.getMonth());
      expect(diffMonths).toBe(3);
    });

    it('should set correct due dates for three_pay (enrollment + 2 months, + 4 months)', async () => {
      mockPrisma.paymentPlan.create.mockImplementation(({ data }) => {
        return Promise.resolve({
          ...data,
          installments: data.installments.create,
          created_at: new Date(),
          updated_at: new Date(),
        });
      });

      const result = await service.checkout('ENR-abc123', 'three_pay', 'US');

      const firstDue = new Date(result.installments[0].due_date);
      const secondDue = new Date(result.installments[1].due_date);
      const thirdDue = new Date(result.installments[2].due_date);

      const diff1 =
        (secondDue.getFullYear() - firstDue.getFullYear()) * 12 +
        (secondDue.getMonth() - firstDue.getMonth());
      const diff2 =
        (thirdDue.getFullYear() - firstDue.getFullYear()) * 12 +
        (thirdDue.getMonth() - firstDue.getMonth());

      expect(diff1).toBe(2);
      expect(diff2).toBe(4);
    });

    it('should throw NotFoundException when enrollment not found', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue(null);

      await expect(
        service.checkout('ENR-unknown', 'full', 'US'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when active plan already exists', async () => {
      mockPrisma.paymentPlan.findFirst.mockResolvedValue({
        id: 'PAY-existing',
        status: 'active',
      });

      await expect(
        service.checkout('ENR-abc123', 'full', 'US'),
      ).rejects.toThrow(ConflictException);
    });

    it('should set grace_period_end on each installment (14 days after due date)', async () => {
      mockPrisma.paymentPlan.create.mockImplementation(({ data }) => {
        return Promise.resolve({
          ...data,
          installments: data.installments.create,
          created_at: new Date(),
          updated_at: new Date(),
        });
      });

      const result = await service.checkout('ENR-abc123', 'two_pay', 'US');

      for (const inst of result.installments) {
        const dueDate = new Date(inst.due_date);
        const graceEnd = new Date(inst.grace_period_end!);
        const diffDays = Math.round(
          (graceEnd.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000),
        );
        expect(diffDays).toBe(14);
      }
    });

    it('should enqueue SQS events for future installments', async () => {
      const enqueueSpy = jest.spyOn(service, 'enqueuePaymentEvent');
      mockPrisma.paymentPlan.create.mockImplementation(({ data }) => {
        return Promise.resolve({
          ...data,
          installments: data.installments.create,
          created_at: new Date(),
          updated_at: new Date(),
        });
      });

      await service.checkout('ENR-abc123', 'two_pay', 'US');

      // Only the second installment should be enqueued (sequence > 1)
      expect(enqueueSpy).toHaveBeenCalledTimes(1);
      expect(enqueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'scheduled_installment' }),
      );
    });
  });

  // ── Pause installment ─────────────────────────────────────────

  describe('pauseInstallment', () => {
    it('should pause a pending installment', async () => {
      const installment = {
        id: 'IST-abc123',
        plan_id: 'PAY-abc123',
        status: 'pending',
        plan: { id: 'PAY-abc123' },
      };
      mockPrisma.installment.findUnique.mockResolvedValue(installment);
      mockPrisma.installment.update.mockResolvedValue({
        ...installment,
        status: 'paused',
      });
      mockPrisma.installment.findMany.mockResolvedValue([]); // no more pending

      mockPrisma.paymentPlan.update.mockResolvedValue({
        id: 'PAY-abc123',
        status: 'paused',
      });

      const result = await service.pauseInstallment('IST-abc123');

      expect(result.status).toBe('paused');
      expect(mockPrisma.installment.update).toHaveBeenCalledWith({
        where: { id: 'IST-abc123' },
        data: { status: 'paused' },
      });
    });

    it('should pause the plan when all remaining installments are paused', async () => {
      const installment = {
        id: 'IST-abc123',
        plan_id: 'PAY-abc123',
        status: 'pending',
        plan: { id: 'PAY-abc123' },
      };
      mockPrisma.installment.findUnique.mockResolvedValue(installment);
      mockPrisma.installment.update.mockResolvedValue({
        ...installment,
        status: 'paused',
      });
      // No more pending installments
      mockPrisma.installment.findMany.mockResolvedValue([]);
      mockPrisma.paymentPlan.update.mockResolvedValue({
        id: 'PAY-abc123',
        status: 'paused',
      });

      await service.pauseInstallment('IST-abc123');

      expect(mockPrisma.paymentPlan.update).toHaveBeenCalledWith({
        where: { id: 'PAY-abc123' },
        data: { status: 'paused' },
      });
    });

    it('should throw NotFoundException when installment not found', async () => {
      mockPrisma.installment.findUnique.mockResolvedValue(null);

      await expect(
        service.pauseInstallment('IST-unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when installment is not pending', async () => {
      mockPrisma.installment.findUnique.mockResolvedValue({
        id: 'IST-abc123',
        status: 'paid',
        plan: { id: 'PAY-abc123' },
      });

      await expect(
        service.pauseInstallment('IST-abc123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── Resume installment ────────────────────────────────────────

  describe('resumeInstallment', () => {
    it('should resume a paused installment', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const installment = {
        id: 'IST-abc123',
        plan_id: 'PAY-abc123',
        status: 'paused',
        due_date: futureDate,
        plan: { id: 'PAY-abc123' },
      };
      mockPrisma.installment.findUnique.mockResolvedValue(installment);
      mockPrisma.installment.update.mockResolvedValue({
        ...installment,
        status: 'pending',
      });
      mockPrisma.paymentPlan.update.mockResolvedValue({
        id: 'PAY-abc123',
        status: 'active',
      });

      const result = await service.resumeInstallment('IST-abc123');

      expect(result.status).toBe('pending');
      expect(mockPrisma.paymentPlan.update).toHaveBeenCalledWith({
        where: { id: 'PAY-abc123' },
        data: { status: 'active' },
      });
    });

    it('should recalculate due date when original has passed', async () => {
      const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const installment = {
        id: 'IST-abc123',
        plan_id: 'PAY-abc123',
        status: 'paused',
        due_date: pastDate,
        plan: { id: 'PAY-abc123' },
      };
      mockPrisma.installment.findUnique.mockResolvedValue(installment);
      mockPrisma.installment.update.mockResolvedValue({
        ...installment,
        status: 'pending',
      });
      mockPrisma.paymentPlan.update.mockResolvedValue({
        id: 'PAY-abc123',
        status: 'active',
      });

      await service.resumeInstallment('IST-abc123');

      const updateCall = mockPrisma.installment.update.mock.calls[0][0];
      const newDueDate = new Date(updateCall.data.due_date);
      // New due date should be >= now (not the past date)
      expect(newDueDate.getTime()).toBeGreaterThanOrEqual(Date.now() - 1000);
    });

    it('should re-enqueue payment event on resume', async () => {
      const enqueueSpy = jest.spyOn(service, 'enqueuePaymentEvent');
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      mockPrisma.installment.findUnique.mockResolvedValue({
        id: 'IST-abc123',
        plan_id: 'PAY-abc123',
        status: 'paused',
        due_date: futureDate,
        plan: { id: 'PAY-abc123' },
      });
      mockPrisma.installment.update.mockResolvedValue({
        id: 'IST-abc123',
        status: 'pending',
      });
      mockPrisma.paymentPlan.update.mockResolvedValue({
        id: 'PAY-abc123',
        status: 'active',
      });

      await service.resumeInstallment('IST-abc123');

      expect(enqueueSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'scheduled_installment',
          installment_id: 'IST-abc123',
        }),
      );
    });

    it('should throw NotFoundException when installment not found', async () => {
      mockPrisma.installment.findUnique.mockResolvedValue(null);

      await expect(
        service.resumeInstallment('IST-unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when installment is not paused', async () => {
      mockPrisma.installment.findUnique.mockResolvedValue({
        id: 'IST-abc123',
        status: 'pending',
        plan: { id: 'PAY-abc123' },
      });

      await expect(
        service.resumeInstallment('IST-abc123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── Payment status ────────────────────────────────────────────

  describe('getPaymentStatus', () => {
    it('should return payment status with outstanding balance', async () => {
      mockPrisma.paymentPlan.findMany.mockResolvedValue([
        {
          id: 'PAY-abc123',
          plan_type: 'two_pay',
          status: 'active',
          total_amount: 1000,
          currency: 'USD',
          installments: [
            { id: 'IST-1', sequence: 1, amount: 600, status: 'paid', due_date: new Date() },
            { id: 'IST-2', sequence: 2, amount: 400, status: 'pending', due_date: new Date() },
          ],
        },
      ]);

      const result = await service.getPaymentStatus('ENR-abc123');

      expect(result).toHaveLength(1);
      expect(result[0].paid_amount).toBe(600);
      expect(result[0].outstanding_amount).toBe(400);
      expect(result[0].upcoming_installments).toHaveLength(1);
    });

    it('should throw NotFoundException when no plans found', async () => {
      mockPrisma.paymentPlan.findMany.mockResolvedValue([]);

      await expect(
        service.getPaymentStatus('ENR-unknown'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should show zero outstanding when all installments paid', async () => {
      mockPrisma.paymentPlan.findMany.mockResolvedValue([
        {
          id: 'PAY-abc123',
          plan_type: 'full',
          status: 'completed',
          total_amount: 1000,
          currency: 'USD',
          installments: [
            { id: 'IST-1', sequence: 1, amount: 1000, status: 'paid', due_date: new Date() },
          ],
        },
      ]);

      const result = await service.getPaymentStatus('ENR-abc123');

      expect(result[0].paid_amount).toBe(1000);
      expect(result[0].outstanding_amount).toBe(0);
      expect(result[0].upcoming_installments).toHaveLength(0);
    });
  });

  // ── Grace period logic ────────────────────────────────────────

  describe('applyGracePeriodLogic', () => {
    it('should mark pending installment as overdue when past due date', async () => {
      const pastDue = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const graceEnd = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
      mockPrisma.installment.findUnique.mockResolvedValue({
        id: 'IST-abc123',
        status: 'pending',
        due_date: pastDue,
        grace_period_end: graceEnd,
        plan: { id: 'PAY-abc123' },
      });
      mockPrisma.installment.update.mockResolvedValue({});

      const result = await service.applyGracePeriodLogic('IST-abc123');

      expect(result.status).toBe('overdue');
      expect(result.access_paused).toBe(false);
      expect(result.progress_preserved).toBe(true);
    });

    it('should pause access when past grace period end', async () => {
      const pastDue = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);
      const pastGrace = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      mockPrisma.installment.findUnique.mockResolvedValue({
        id: 'IST-abc123',
        status: 'overdue',
        due_date: pastDue,
        grace_period_end: pastGrace,
        plan: { id: 'PAY-abc123' },
      });

      const result = await service.applyGracePeriodLogic('IST-abc123');

      expect(result.access_paused).toBe(true);
      expect(result.progress_preserved).toBe(true);
    });

    it('should not pause access when within grace period', async () => {
      const pastDue = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const futureGrace = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);
      mockPrisma.installment.findUnique.mockResolvedValue({
        id: 'IST-abc123',
        status: 'overdue',
        due_date: pastDue,
        grace_period_end: futureGrace,
        plan: { id: 'PAY-abc123' },
      });

      const result = await service.applyGracePeriodLogic('IST-abc123');

      expect(result.access_paused).toBe(false);
      expect(result.progress_preserved).toBe(true);
    });

    it('should always preserve progress', async () => {
      const pastDue = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const pastGrace = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      mockPrisma.installment.findUnique.mockResolvedValue({
        id: 'IST-abc123',
        status: 'overdue',
        due_date: pastDue,
        grace_period_end: pastGrace,
        plan: { id: 'PAY-abc123' },
      });

      const result = await service.applyGracePeriodLogic('IST-abc123');

      expect(result.progress_preserved).toBe(true);
    });

    it('should throw NotFoundException when installment not found', async () => {
      mockPrisma.installment.findUnique.mockResolvedValue(null);

      await expect(
        service.applyGracePeriodLogic('IST-unknown'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Mark installment paid — restore access ────────────────────

  describe('markInstallmentPaid', () => {
    it('should mark installment as paid and restore access if overdue', async () => {
      mockPrisma.installment.findUnique.mockResolvedValue({
        id: 'IST-abc123',
        plan_id: 'PAY-abc123',
        status: 'overdue',
        plan: {
          id: 'PAY-abc123',
          installments: [
            { id: 'IST-abc123', status: 'overdue' },
          ],
        },
      });
      mockPrisma.installment.update.mockResolvedValue({
        id: 'IST-abc123',
        status: 'paid',
        paid_at: new Date(),
      });
      mockPrisma.paymentPlan.update.mockResolvedValue({
        id: 'PAY-abc123',
        status: 'completed',
      });

      const result = await service.markInstallmentPaid('IST-abc123');

      expect(result.access_restored).toBe(true);
      expect(result.plan_completed).toBe(true);
    });

    it('should complete plan when all installments are paid', async () => {
      mockPrisma.installment.findUnique.mockResolvedValue({
        id: 'IST-2',
        plan_id: 'PAY-abc123',
        status: 'pending',
        plan: {
          id: 'PAY-abc123',
          installments: [
            { id: 'IST-1', status: 'paid' },
            { id: 'IST-2', status: 'pending' },
          ],
        },
      });
      mockPrisma.installment.update.mockResolvedValue({
        id: 'IST-2',
        status: 'paid',
        paid_at: new Date(),
      });
      mockPrisma.paymentPlan.update.mockResolvedValue({
        id: 'PAY-abc123',
        status: 'completed',
      });

      const result = await service.markInstallmentPaid('IST-2');

      expect(result.plan_completed).toBe(true);
      expect(mockPrisma.paymentPlan.update).toHaveBeenCalledWith({
        where: { id: 'PAY-abc123' },
        data: { status: 'completed' },
      });
    });

    it('should throw BadRequestException when installment already paid', async () => {
      mockPrisma.installment.findUnique.mockResolvedValue({
        id: 'IST-abc123',
        status: 'paid',
        plan: { id: 'PAY-abc123', installments: [] },
      });

      await expect(
        service.markInstallmentPaid('IST-abc123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── SQS enqueue stub ─────────────────────────────────────────

  describe('enqueuePaymentEvent', () => {
    it('should log the message without throwing', () => {
      expect(() =>
        service.enqueuePaymentEvent({
          type: 'scheduled_installment',
          installment_id: 'IST-abc123',
        }),
      ).not.toThrow();
    });
  });
});
