/**
 * @file issue-certificate.dto.ts
 * Validation DTO for issuing a certificate.
 * All 6 eligibility conditions must be met before issuance.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /certification/certificates/issue — creates CRT-* record with KFCERT-* code. */
export class IssueCertificateDto {
  @IsString()
  @IsNotEmpty()
  learner_id: string;

  @IsString()
  @IsNotEmpty()
  track_id: string;
}
