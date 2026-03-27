/**
 * @file activate-pod.dto.ts
 * Validation DTO for activating a pod with an assigned assessor.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /enrollment/pods/:podId/activate — activates a pod once all standard roles are filled. */
export class ActivatePodDto {
  @IsString()
  @IsNotEmpty()
  assessor_id: string;
}
