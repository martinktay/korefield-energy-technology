/**
 * @file update-module.dto.ts
 * Validation DTO for updating an existing curriculum module.
 * Triggers content versioning if the module is already published.
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
}
