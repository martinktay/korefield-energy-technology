/**
 * @file update-module.dto.ts
 * Validation DTO for updating an existing curriculum module.
 * Triggers content versioning if the module is already published.
 * Includes `version` field for optimistic locking — the client must send
 * the current version to prevent silent overwrites of concurrent edits.
 */
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

/** DTO for PUT /content/modules/:moduleId — partial update with automatic version snapshotting. */
export class UpdateModuleDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  sequence?: number;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  /** Current version for optimistic locking. If provided and mismatched, returns HTTP 409. */
  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;
}
