/**
 * @file verify-email.dto.ts
 * Validation DTO for email verification requests.
 */
import { IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /auth/verify-email — confirms email ownership via JWT token. */
export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
