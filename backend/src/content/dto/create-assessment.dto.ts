/**
 * @file create-assessment.dto.ts
 * Validation DTO for creating a new assessment within a module.
 */
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  module_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  type: string; // quiz | code_exercise | lab_submission | pod_deliverable | peer_review | capstone_defense | performance_gate

  @IsNumber()
  max_score: number;

  @IsObject()
  @IsOptional()
  rubric?: Record<string, unknown>;
}
