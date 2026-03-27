/**
 * @file mfa-setup.dto.ts
 * Validation DTO for MFA setup confirmation requests.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /auth/mfa/setup/confirm — verifies a TOTP code to finalize MFA enrollment. */
export class MfaSetupConfirmDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
