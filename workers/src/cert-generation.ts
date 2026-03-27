/**
 * @file cert-generation.ts
 * Certificate PDF generation worker.
 * Consumes messages from the cert-generation SQS queue, generates PDF certificates,
 * uploads them to S3, and updates the certificate record with the PDF URL.
 * Runs as a standalone process on ECS Fargate.
 */
import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';
import { generateCertificatePdf } from './services/pdf-generator';
import { uploadCertificatePdf } from './services/s3-client';
import { updateCertificatePdfUrl } from './services/db';

export interface CertGenerationPayload {
  certificateId: string;
  learnerId: string;
  trackId: string;
  learnerName: string;
  trackName: string;
  completionDate: string;
  verificationCode: string;
}

export class CertGenerationWorker extends SqsConsumer<CertGenerationPayload> {
  protected async processMessage(message: ParsedMessage<CertGenerationPayload>): Promise<void> {
    const {
      certificateId,
      learnerId,
      learnerName,
      trackName,
      completionDate,
      verificationCode,
    } = message.body;

    this.log('info', `Generating certificate ${certificateId} for learner ${learnerId} [${verificationCode}]`);

    // 1. Generate PDF
    const pdfBuffer = generateCertificatePdf({
      certificateId,
      learnerName,
      trackName,
      completionDate,
      verificationCode,
    });

    // 2. Upload to S3
    const { url } = await uploadCertificatePdf(certificateId, pdfBuffer);
    this.log('info', `Uploaded certificate PDF to ${url}`);

    // 3. Update certificate record with S3 URL
    await updateCertificatePdfUrl(certificateId, url);
    this.log('info', `Updated certificate ${certificateId} with PDF URL`);
  }
}

// Only start when run directly (not during tests)
if (require.main === module) {
  const worker = new CertGenerationWorker({
    queueName: 'cert-generation',
    queueUrl: process.env.CERT_GENERATION_QUEUE_URL ?? '',
    dlqUrl: process.env.CERT_GENERATION_DLQ_URL ?? '',
  });

  worker.start();
}
