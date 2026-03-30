/**
 * @file update-learner.dto.ts
 * Validation DTO for updating learner profile fields after initial onboarding.
 * Used by PATCH /enrollment/learners/:id to update optional fields like project_interest.
 */
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** DTO for PATCH /enrollment/learners/:id — updates mutable learner profile fields. */
export class UpdateLearnerDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  project_interest?: string;
}
