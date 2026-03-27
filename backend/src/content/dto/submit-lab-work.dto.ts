/**
 * @file submit-lab-work.dto.ts
 * Validation DTO for learner lab work submissions.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /content/labs/:labId/submit — async lab work submission. */
export class SubmitLabWorkDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
