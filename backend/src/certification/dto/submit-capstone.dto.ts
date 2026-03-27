/**
 * @file submit-capstone.dto.ts
 * Validation DTO for submitting a capstone project.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /certification/capstone/:id/submit — learner submits capstone content. */
export class SubmitCapstoneDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
