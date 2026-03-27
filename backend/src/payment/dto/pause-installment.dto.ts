/**
 * @file pause-installment.dto.ts
 * Validation DTO for pausing an installment.
 */
import { IsOptional, IsString } from 'class-validator';

/** DTO for POST /payment/installments/:id/pause — suspends future charges. */
export class PauseInstallmentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
