/**
 * @file coupon.service.ts
 * Service for managing promo coupons — create, list, validate, redeem, disable.
 * Only SuperAdmin can create/manage coupons. Learners validate at checkout.
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { generateId } from '@common/utils/generate-id';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** POST /payment/coupons — create a new promo coupon (SuperAdmin only). */
  async createCoupon(dto: CreateCouponDto, createdBy: string) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) {
      throw new BadRequestException(`Coupon code "${dto.code}" already exists`);
    }

    if (dto.discount_type === 'percentage' && (dto.discount_value < 0 || dto.discount_value > 100)) {
      throw new BadRequestException('Percentage discount must be between 0 and 100');
    }

    if (dto.discount_type === 'full_access') {
      dto.discount_value = 100; // full_access = 100% off
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        id: generateId('CPN'),
        code: dto.code.toUpperCase(),
        description: dto.description ?? null,
        discount_type: dto.discount_type,
        discount_value: dto.discount_value,
        track_ids: dto.track_ids ?? [],
        max_uses: dto.max_uses ?? 0,
        valid_from: new Date(dto.valid_from),
        valid_to: new Date(dto.valid_to),
        created_by: createdBy,
      },
    });

    this.logger.log(`Coupon ${coupon.code} created by ${createdBy} (${dto.discount_type}: ${dto.discount_value})`);
    return coupon;
  }

  /** GET /payment/coupons — list all coupons with usage stats. */
  async listCoupons() {
    return this.prisma.coupon.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { redemptions: true } } },
    });
  }

  /** POST /payment/coupons/validate — validate a coupon code for a specific track. */
  async validateCoupon(code: string, trackId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) {
      throw new NotFoundException('Invalid coupon code');
    }

    const now = new Date();

    if (coupon.status !== 'active') {
      throw new BadRequestException(`Coupon is ${coupon.status}`);
    }
    if (now < coupon.valid_from) {
      throw new BadRequestException('Coupon is not yet active');
    }
    if (now > coupon.valid_to) {
      throw new BadRequestException('Coupon has expired');
    }
    if (coupon.max_uses > 0 && coupon.times_used >= coupon.max_uses) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    if (coupon.track_ids.length > 0 && !coupon.track_ids.includes(trackId)) {
      throw new BadRequestException('Coupon is not valid for this track');
    }

    return {
      valid: true,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      description: coupon.description,
    };
  }

  /** Redeem a coupon — increment usage count and record the redemption. */
  async redeemCoupon(code: string, learnerId: string, trackId: string, discountAmount: number) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    // Record redemption
    await this.prisma.couponRedemption.create({
      data: {
        id: generateId('CRD'),
        coupon_id: coupon.id,
        learner_id: learnerId,
        track_id: trackId,
        discount: discountAmount,
      },
    });

    // Increment usage
    const newUsed = coupon.times_used + 1;
    const newStatus = coupon.max_uses > 0 && newUsed >= coupon.max_uses ? 'exhausted' : coupon.status;

    await this.prisma.coupon.update({
      where: { id: coupon.id },
      data: { times_used: newUsed, status: newStatus as any },
    });

    this.logger.log(`Coupon ${coupon.code} redeemed by ${learnerId} for track ${trackId} ($${discountAmount} off)`);
  }

  /** PATCH /payment/coupons/:id/disable — disable a coupon. */
  async disableCoupon(couponId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Coupon not found');

    const updated = await this.prisma.coupon.update({
      where: { id: couponId },
      data: { status: 'disabled' },
    });

    this.logger.log(`Coupon ${coupon.code} disabled`);
    return updated;
  }
}
