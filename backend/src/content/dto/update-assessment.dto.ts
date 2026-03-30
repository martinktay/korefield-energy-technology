/**
 * @file update-assessment.dto.ts
 * Validation DTO for updating an existing assessment.
 * Includes `version` field for optimistic locking — the client must send
 * the current version to prevent silent overwrites of concurrent edits.
 */
import { IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

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

  /** Current version for optimistic locking. If provided and mismatched, returns HTTP 409. */
  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;
}
