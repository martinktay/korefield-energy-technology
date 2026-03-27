/**
 * @file checkout.dto.ts
 * Validation DTO for creating a payment plan during checkout.
 */
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

/** DTO for POST /payment/checkout — creates a payment plan with installment schedule. */
export class CheckoutDto {
  @IsString()
  @IsNotEmpty()
  enrollment_id: string;

  @IsString()
  @IsIn(['full', 'two_pay', 'three_pay'])
  plan_type: 'full' | 'two_pay' | 'three_pay';

  @IsString()
  @IsNotEmpty()
  country_code: string;
}
