/**
 * @file update-lesson.dto.ts
 * Validation DTO for updating an existing lesson.
 * Includes `version` field for optimistic locking — the client must send
 * the current version to prevent silent overwrites of concurrent edits.
 */
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateLessonDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content_type?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  sequence?: number;

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

  /** Current version for optimistic locking. If provided and mismatched, returns HTTP 409. */
  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;
}
