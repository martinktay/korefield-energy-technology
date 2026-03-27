/**
 * @file execute-code.dto.ts
 * Validation DTO for executing learner code against a coding exercise.
 */
import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

/** DTO for POST /content/exercises/:exerciseId/execute — runs code in sandboxed backend. */
export class ExecuteCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsIn(['python', 'javascript', 'sql'])
  @IsOptional()
  language?: string;
}
