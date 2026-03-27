/**
 * @file register.dto.ts
 * Validation DTO for user registration requests.
 */
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

/** DTO for POST /auth/register — creates a new user account. */
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole = UserRole.Learner;
}
