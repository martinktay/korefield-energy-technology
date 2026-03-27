/**
 * @file create-module.dto.ts
 * Validation DTO for creating a new curriculum module within a level.
 */
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/** DTO for POST /content/modules — creates a module in the curriculum hierarchy. */
export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  level_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsInt()
  @Min(1)
  sequence: number;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
