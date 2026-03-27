/**
 * @file resume-installment.dto.ts
 * Validation DTO for resuming a paused installment.
 */
import { IsOptional, IsString } from 'class-validator';

/** DTO for POST /payment/installments/:id/resume — recalculates schedule and resumes charges. */
export class ResumeInstallmentDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
