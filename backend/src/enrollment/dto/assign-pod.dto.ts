/**
 * @file assign-pod.dto.ts
 * Validation DTO for assigning a learner to a multidisciplinary pod.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /enrollment/pods/assign — assigns a learner to a pod based on their track role. */
export class AssignPodDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;

  @IsString()
  @IsNotEmpty()
  track_id: string;
}
