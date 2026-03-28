/**
 * @file validate-coupon.dto.ts
 * DTO for validating a coupon code at checkout. Used by POST /payment/coupons/validate.
 */
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  track_id: string;
}
