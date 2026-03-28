/**
 * @file onboard-learner.dto.ts
 * Validation DTO for completing learner onboarding.
 * Onboarding collects profile data, auto-enrolls in AI Foundation School,
 * and generates track recommendations based on goals/background.
 */
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** DTO for POST /enrollment/onboard — finalizes onboarding and triggers AI Foundation School enrollment. */
export class OnboardLearnerDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  professional_background?: string;

  @IsString()
  @IsOptional()
  learning_goals?: string;
}
