import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

const BUCKET = process.env.CERT_S3_BUCKET || 'korefield-academy-certificates';

export interface UploadResult {
  bucket: string;
  key: string;
  url: string;
}

/**
 * Upload a certificate PDF to S3 and return the object URL.
 */
export async function uploadCertificatePdf(
  certificateId: string,
  pdfBuffer: Buffer,
): Promise<UploadResult> {
  const key = `certificates/${certificateId}.pdf`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    }),
  );

  const url = `https://${BUCKET}.s3.amazonaws.com/${key}`;

  return { bucket: BUCKET, key, url };
}
