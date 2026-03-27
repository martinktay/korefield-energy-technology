/**
 * @file unlock-capstone.dto.ts
 * Validation DTO for unlocking a capstone project.
 * Requires assessor validation that the learner has passed all Advanced gates.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /certification/capstone/unlock — assessor-gated capstone unlock. */
export class UnlockCapstoneDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;

  @IsString()
  @IsNotEmpty()
  track_id: string;

  @IsString()
  @IsNotEmpty()
  assessor_id: string;
}
