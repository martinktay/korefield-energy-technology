/**
 * @file check-eligibility.dto.ts
 * Validation DTO for running a composite certification eligibility check.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /certification/eligibility/check — evaluates all 6 certification conditions. */
export class CheckEligibilityDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;

  @IsString()
  @IsNotEmpty()
  track_id: string;
}
