/**
 * @file pricing-query.dto.ts
 * Validation DTO for querying region-aware pricing for a track.
 */
import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

/** DTO for GET /payment/pricing/:trackId — computes final payable amount based on country and plan. */
export class PricingQueryDto {
  @IsString()
  @IsNotEmpty()
  country_code: string;

  @IsOptional()
  @IsString()
  @IsIn(['full', 'two_pay', 'three_pay'])
  plan_type?: string;

  @IsOptional()
  @IsString()
  learner_id?: string;
}
