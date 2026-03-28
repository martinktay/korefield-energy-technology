/**
 * @file create-coupon.dto.ts
 * DTO for creating a new promo coupon. Used by POST /payment/coupons.
 */
import { IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  discount_type: string; // percentage | fixed_amount | full_access

  @IsNumber()
  @Min(0)
  discount_value: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  track_ids?: string[]; // empty = all tracks

  @IsInt()
  @Min(0)
  @IsOptional()
  max_uses?: number; // 0 = unlimited

  @IsDateString()
  valid_from: string;

  @IsDateString()
  valid_to: string;
}
