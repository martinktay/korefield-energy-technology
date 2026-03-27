export interface CertificateData {
  certificateId: string;
  learnerName: string;
  trackName: string;
  completionDate: string;
  verificationCode: string;
}

/**
 * Generate a text-based PDF representation for a certificate.
 * This is a stub — swap in pdfkit or similar for real PDF output.
 */
export function generateCertificatePdf(data: CertificateData): Buffer {
  const content = [
    '========================================',
    '       KOREFIELD ACADEMY CERTIFICATE',
    '========================================',
    '',
    `  Certificate ID : ${data.certificateId}`,
    `  Learner        : ${data.learnerName}`,
    `  Track          : ${data.trackName}`,
    `  Completed      : ${data.completionDate}`,
    `  Verification   : ${data.verificationCode}`,
    '',
    '  This certificate verifies that the above',
    '  learner has successfully completed all',
    '  requirements for the specified track.',
    '',
    '========================================',
  ].join('\n');

  return Buffer.from(content, 'utf-8');
}
