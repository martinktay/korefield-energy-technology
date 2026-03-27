/**
 * @file complete-foundation-module.dto.ts
 * Validation DTO for marking a Foundation School module as completed.
 * Module name must be one of the 5 mandatory Foundation modules.
 */
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

/** The 5 mandatory Foundation School modules every learner must complete */
const VALID_MODULES = [
  'AI Literacy',
  'AI Fluency',
  'Systems Awareness',
  'Governance',
  'Professional Discipline',
] as const;

/** DTO for POST /enrollment/foundation/complete-module — marks a single Foundation module as done. */
export class CompleteFoundationModuleDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(VALID_MODULES, {
    message: `module_name must be one of: ${VALID_MODULES.join(', ')}`,
  })
  module_name: string;
}
