/**
 * @file update-lab-recording.dto.ts
 * Validation DTO for adding a recording URL to a completed lab session.
 * Recordings are hosted on Cloudflare Stream — never proxied through AWS.
 */
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

/** DTO for PUT /content/labs/:labId/recording — attaches recording URL post-session. */
export class UpdateLabRecordingDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  recording_url: string;
}
