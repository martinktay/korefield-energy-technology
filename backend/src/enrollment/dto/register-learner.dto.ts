/**
 * @file register-learner.dto.ts
 * Validation DTO for creating a Learner profile linked to an existing User account.
 */
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** DTO for POST /enrollment/register — creates a Learner profile with optional demographic data. */
export class RegisterLearnerDto {
  @IsString()
  @IsNotEmpty()
  user_id: string;

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
