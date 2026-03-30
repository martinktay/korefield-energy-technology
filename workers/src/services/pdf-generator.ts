/** @file pdf-generator.ts — Generates real PDF certificates using PDFKit. */

import PDFDocument from 'pdfkit';

export interface CertificateData {
  certificateId: string;
  learnerName: string;
  trackName: string;
  completionDate: string;
  verificationCode: string;
}

const BRAND_COLOR = '#1b5ef5';
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89; // A4

/**
 * Generate a PDF certificate for a completed track.
 * Returns a Buffer containing the full PDF document.
 */
export function generateCertificatePdf(data: CertificateData): Buffer {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    info: {
      Title: `KoreField Academy Certificate — ${data.trackName}`,
      Author: 'KoreField Academy',
      Subject: `Certificate of Completion for ${data.learnerName}`,
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // --- Header ---
  doc
    .rect(0, 0, PAGE_WIDTH, 90)
    .fill(BRAND_COLOR);

  doc
    .font('Helvetica-Bold')
    .fontSize(22)
    .fillColor('#ffffff')
    .text('KoreField Academy', 0, 32, { align: 'center', width: PAGE_WIDTH });

  // --- Title ---
  doc
    .moveDown(4)
    .font('Helvetica-Bold')
    .fontSize(28)
    .fillColor(BRAND_COLOR)
    .text('Certificate of Completion', { align: 'center' });

  // --- Decorative line ---
  const lineY = doc.y + 16;
  doc
    .moveTo(PAGE_WIDTH / 2 - 100, lineY)
    .lineTo(PAGE_WIDTH / 2 + 100, lineY)
    .lineWidth(2)
    .strokeColor(BRAND_COLOR)
    .stroke();

  // --- Body ---
  doc
    .moveDown(3)
    .font('Helvetica')
    .fontSize(14)
    .fillColor('#333333')
    .text('This is to certify that', { align: 'center' });

  doc
    .moveDown(1)
    .font('Helvetica-Bold')
    .fontSize(24)
    .fillColor('#111111')
    .text(data.learnerName, { align: 'center' });

  doc
    .moveDown(1)
    .font('Helvetica')
    .fontSize(14)
    .fillColor('#333333')
    .text('has successfully completed all requirements for', { align: 'center' });

  doc
    .moveDown(1)
    .font('Helvetica-Bold')
    .fontSize(18)
    .fillColor(BRAND_COLOR)
    .text(data.trackName, { align: 'center' });

  doc
    .moveDown(1.5)
    .font('Helvetica')
    .fontSize(13)
    .fillColor('#555555')
    .text(`Completion Date: ${data.completionDate}`, { align: 'center' });

  doc
    .moveDown(1.5)
    .font('Courier')
    .fontSize(12)
    .fillColor('#333333')
    .text(`Verification Code: ${data.verificationCode}`, { align: 'center' });

  // --- Footer ---
  doc
    .rect(0, PAGE_HEIGHT - 50, PAGE_WIDTH, 50)
    .fill(BRAND_COLOR);

  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#ffffff')
    .text(
      `This certificate is verifiable at korefield.com/verify/${data.verificationCode}`,
      0,
      PAGE_HEIGHT - 34,
      { align: 'center', width: PAGE_WIDTH },
    );

  doc.end();

  return Buffer.concat(chunks);
}
