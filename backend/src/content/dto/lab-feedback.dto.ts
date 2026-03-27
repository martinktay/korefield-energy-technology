/**
 * @file lab-feedback.dto.ts
 * Validation DTO for instructor feedback on lab submissions.
 */
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/** DTO for POST /content/labs/:labId/feedback — instructor review within 7-day window. */
export class LabFeedbackDto {
  @IsString()
  @IsNotEmpty()
  submission_id: string;

  @IsString()
  @IsNotEmpty()
  feedback: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  score?: number;
}
