/**
 * @file revoke-certificate.dto.ts
 * Validation DTO for revoking an issued certificate. Admin-only operation.
 */
import { IsString, IsNotEmpty } from 'class-validator';

/** DTO for POST /certification/certificates/:id/revoke — records revocation reason. */
export class RevokeCertificateDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
