/**
 * @file create-diagnostic-result.dto.ts
 * Validation DTO for storing advisory diagnostic onboarding outputs.
 */
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDiagnosticResultDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  country?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  learner_role?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  prior_coding_background?: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  prior_ai_background?: string;

  @IsArray()
  @IsOptional()
  learning_goals?: string[];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  project_interest?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  preferred_pace?: string;

  @IsArray()
  @IsOptional()
  diagnostic_answers?: Array<Record<string, unknown>>;

  @IsString()
  @IsNotEmpty()
  starting_level: string;

  @IsString()
  @IsNotEmpty()
  recommended_track: string;

  @IsString()
  @IsNotEmpty()
  recommended_path: string;

  @IsArray()
  @IsOptional()
  weak_area_tags?: string[];

  @IsString()
  @IsNotEmpty()
  rationale: string;

  @IsArray()
  @IsOptional()
  focus_areas?: string[];

  @IsString()
  @IsIn(['high', 'medium', 'low'])
  confidence: string;

  @IsString()
  @IsIn(['ai', 'fallback'])
  source: string;

  @IsObject()
  @IsOptional()
  telemetry?: Record<string, unknown>;
}
