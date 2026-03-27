/**
 * @file evaluate-gate.dto.ts
 * Validation DTO for evaluating a learner against a performance gate.
 */
import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';

/** DTO for POST /enrollment/gates/:gateId/evaluate — submits a score for performance gate assessment. */
export class EvaluateGateDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;
}
