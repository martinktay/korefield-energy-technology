/**
 * @file create-lesson.dto.ts
 * Validation DTO for creating a new lesson within a module.
 */
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @IsNotEmpty()
  module_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content_type: string; // text | video | interactive_code | quiz | downloadable

  @IsInt()
  @Min(1)
  sequence: number;

  @IsString()
  @IsOptional()
  content_body?: string;

  @IsString()
  @IsOptional()
  video_url?: string;

  @IsString()
  @IsOptional()
  file_url?: string;

  @IsString()
  @IsOptional()
  file_name?: string;
}
