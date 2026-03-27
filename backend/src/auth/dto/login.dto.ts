/**
 * @file login.dto.ts
 * Validation DTO for user login requests.
 */
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/** DTO for POST /auth/login — authenticates with email and password. */
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
