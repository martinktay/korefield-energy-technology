import { IsString, IsEmail, IsOptional } from 'class-validator';

export class ApplyDto {
  @IsString()
  job_opening_id: string;

  @IsString()
  applicant_name: string;

  @IsEmail()
  applicant_email: string;

  @IsOptional()
  @IsString()
  cover_note?: string;
}
