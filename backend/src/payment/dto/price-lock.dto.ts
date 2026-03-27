/**
 * @file price-lock.dto.ts
 * Validation DTO for locking a displayed price during checkout.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /payment/pricing/lock — locks the computed price for 30 minutes. */
export class PriceLockDto {
  @IsString()
  @IsNotEmpty()
  track_id: string;

  @IsString()
  @IsNotEmpty()
  country_code: string;
}
