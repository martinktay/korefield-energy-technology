import { IsString, IsIn, IsOptional } from 'class-validator';

const VALID_STATUSES = [
  'new_application',
  'in_review',
  'shortlisted',
  'interview',
  'offer',
  'hired',
  'rejected',
] as const;

export class UpdateApplicationStatusDto {
  @IsString()
  @IsIn(VALID_STATUSES)
  status: (typeof VALID_STATUSES)[number];

  @IsOptional()
  @IsString()
  reviewer_notes?: string;
}
