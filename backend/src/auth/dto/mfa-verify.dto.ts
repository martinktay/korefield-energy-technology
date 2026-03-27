/**
 * @file mfa-verify.dto.ts
 * Validation DTO for MFA verification requests during login.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /auth/mfa/verify — validates a TOTP code to complete MFA-gated login. */
export class MfaVerifyDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
