/**
 * @file update-assessment.dto.ts
 * Validation DTO for updating an existing assessment.
 */
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateAssessmentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsNumber()
  @IsOptional()
  max_score?: number;

  @IsObject()
  @IsOptional()
  rubric?: Record<string, unknown>;
}
