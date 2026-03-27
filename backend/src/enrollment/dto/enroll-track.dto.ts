/**
 * @file enroll-track.dto.ts
 * Validation DTO for enrolling a learner in a paid Track Pathway.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /enrollment/tracks/:trackId/enroll — enrolls in a full pathway (Beginner→Advanced). */
export class EnrollTrackDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;
}
