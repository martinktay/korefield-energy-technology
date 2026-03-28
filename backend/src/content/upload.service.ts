/**
 * @file upload.service.ts
 * Service for generating presigned S3 upload URLs for content files.
 * Files are uploaded directly from the frontend to S3 using the presigned URL.
 */
import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateId } from '@common/utils/generate-id';

const UPLOAD_BUCKET = process.env.S3_UPLOADS_BUCKET || 'korefield-academy-dev-uploads';
const PRESIGN_EXPIRY_SECONDS = 600; // 10 minutes

const ALLOWED_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3: S3Client;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.AWS_REGION || 'eu-west-1',
    });
  }

  /**
   * Generate a presigned PUT URL for uploading a file to S3.
   * Returns the presigned URL and the final S3 key where the file will be stored.
   */
  async generatePresignedUrl(
    filename: string,
    contentType: string,
  ): Promise<{ upload_url: string; file_url: string; s3_key: string }> {
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      throw new Error(
        `Content type "${contentType}" not allowed. Allowed: ${ALLOWED_CONTENT_TYPES.join(', ')}`,
      );
    }

    const fileId = generateId('FIL');
    const ext = filename.split('.').pop() || 'bin';
    const s3Key = `content/${fileId}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: UPLOAD_BUCKET,
      Key: s3Key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });

    const fileUrl = `https://${UPLOAD_BUCKET}.s3.amazonaws.com/${s3Key}`;

    this.logger.log(`Presigned URL generated for ${filename} → ${s3Key}`);

    return { upload_url: uploadUrl, file_url: fileUrl, s3_key: s3Key };
  }
}
