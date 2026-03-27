/**
 * @file create-coding-exercise.dto.ts
 * Validation DTOs for creating in-browser coding exercises.
 * Exercises support Python, JavaScript, and SQL with configurable
 * time/memory limits and instructor-defined test cases.
 */
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsArray,
  IsIn,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Individual test case with input, expected output, and description. */
export class TestCaseDto {
  @IsString()
  @IsNotEmpty()
  input: string;

  @IsString()
  @IsNotEmpty()
  expected_output: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}

/** DTO for POST /content/exercises — creates a coding exercise linked to a lesson or assessment. */
export class CreateCodingExerciseDto {
  @IsString()
  @IsOptional()
  lesson_id?: string;

  @IsString()
  @IsOptional()
  assessment_id?: string;

  @IsString()
  @IsNotEmpty()
  starter_code: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseDto)
  test_cases: TestCaseDto[];

  @IsString()
  @IsIn(['python', 'javascript', 'sql'])
  language: string;

  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  time_limit?: number;

  @IsInt()
  @Min(32)
  @Max(1024)
  @IsOptional()
  memory_limit?: number;
}
