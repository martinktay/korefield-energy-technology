import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class JoinLaunchWaitlistDto {
  @IsEmail()
  @MaxLength(320)
  @Transform(({ value }) => String(value).trim().toLowerCase())
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => String(value).trim())
  full_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Transform(({ value }) => String(value).trim())
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => String(value).trim())
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => String(value).trim())
  area_of_interest?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => String(value).trim())
  source?: string;

  /** Honeypot field for basic bot suppression. Real users never see it. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  website?: string;
}
