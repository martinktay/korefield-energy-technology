/**
 * @file schedule-lab-session.dto.ts
 * Validation DTO for scheduling a live lab session.
 */
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /content/labs — schedules a lab with 48-hour advance notification. */
export class ScheduleLabSessionDto {
  @IsString()
  @IsNotEmpty()
  instructor_id: string;

  @IsString()
  @IsNotEmpty()
  module_id: string;

  @IsDateString()
  @IsNotEmpty()
  scheduled_at: string;
}
