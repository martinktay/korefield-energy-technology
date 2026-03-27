/**
 * @file join-waitlist.dto.ts
 * Validation DTO for adding a learner to a track waitlist.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /enrollment/waitlist/:trackId — joins the waitlist for a not-yet-available track. */
export class JoinWaitlistDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;
}
