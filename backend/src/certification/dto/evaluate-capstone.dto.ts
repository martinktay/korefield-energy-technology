/**
 * @file evaluate-capstone.dto.ts
 * Validation DTO for evaluating a capstone via panel defense.
 * Requires at least 2 assessors on the defense panel.
 */
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayMinSize,
  IsIn,
  IsDateString,
} from 'class-validator';

/** DTO for POST /certification/capstone/:id/evaluate — schedules defense and records result. */
export class EvaluateCapstoneDto {
  @IsArray()
  @ArrayMinSize(2, { message: 'Defense panel must have at least 2 assessors' })
  @IsString({ each: true })
  panel_assessor_ids: string[];

  @IsDateString()
  @IsNotEmpty()
  scheduled_at: string;

  @IsString()
  @IsIn(['pass', 'fail'])
  result: 'pass' | 'fail';

  @IsString()
  @IsNotEmpty()
  feedback: string;
}
