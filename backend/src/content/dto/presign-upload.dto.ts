/**
 * @file presign-upload.dto.ts
 * DTO for requesting a presigned S3 upload URL.
 */
import { IsNotEmpty, IsString } from 'class-validator';

export class PresignUploadDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  content_type: string; // MIME type e.g. application/pdf
}
