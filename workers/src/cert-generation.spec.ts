import { CertGenerationWorker, CertGenerationPayload } from './cert-generation';
import { ParsedMessage } from './base/sqs-consumer';
import * as pdfGenerator from './services/pdf-generator';
import * as s3Client from './services/s3-client';
import * as db from './services/db';

// Mock SQSClient (required by base class)
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-sqs', () => {
  const actual = jest.requireActual('@aws-sdk/client-sqs');
  return {
    ...actual,
    SQSClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  };
});

jest.mock('./services/pdf-generator');
jest.mock('./services/s3-client');
jest.mock('./services/db');

const mockGeneratePdf = pdfGenerator.generateCertificatePdf as jest.MockedFunction<
  typeof pdfGenerator.generateCertificatePdf
>;
const mockUpload = s3Client.uploadCertificatePdf as jest.MockedFunction<
  typeof s3Client.uploadCertificatePdf
>;
const mockUpdateDb = db.updateCertificatePdfUrl as jest.MockedFunction<
  typeof db.updateCertificatePdfUrl
>;

function createWorker(): CertGenerationWorker {
  return new CertGenerationWorker({
    queueName: 'cert-generation',
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123/cert-generation',
    dlqUrl: 'https://sqs.us-east-1.amazonaws.com/123/cert-generation-dlq',
  });
}

function createMessage(
  overrides?: Partial<CertGenerationPayload>,
): ParsedMessage<CertGenerationPayload> {
  return {
    body: {
      certificateId: 'CRT-9x4k7m',
      learnerId: 'LRN-7f3a2b',
      trackId: 'TRK-ai-eng-001',
      learnerName: 'Ada Okafor',
      trackName: 'AI Engineering and Intelligent Systems',
      completionDate: '2026-03-15',
      verificationCode: 'KFCERT-2026-A7X9K2M4',
      ...overrides,
    },
    raw: {
      MessageId: 'msg-001',
      ReceiptHandle: 'receipt-001',
      Body: '{}',
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGeneratePdf.mockReturnValue(Buffer.from('fake-pdf'));
  mockUpload.mockResolvedValue({
    bucket: 'korefield-academy-certificates',
    key: 'certificates/CRT-9x4k7m.pdf',
    url: 'https://korefield-academy-certificates.s3.amazonaws.com/certificates/CRT-9x4k7m.pdf',
  });
  mockUpdateDb.mockResolvedValue(undefined);
});

describe('CertGenerationWorker', () => {
  it('should generate PDF with correct certificate data', async () => {
    const worker = createWorker();
    const message = createMessage();

    await (worker as any).processMessage(message);

    expect(mockGeneratePdf).toHaveBeenCalledWith({
      certificateId: 'CRT-9x4k7m',
      learnerName: 'Ada Okafor',
      trackName: 'AI Engineering and Intelligent Systems',
      completionDate: '2026-03-15',
      verificationCode: 'KFCERT-2026-A7X9K2M4',
    });
  });

  it('should upload generated PDF to S3', async () => {
    const worker = createWorker();
    const message = createMessage();
    const pdfBuffer = Buffer.from('fake-pdf');
    mockGeneratePdf.mockReturnValue(pdfBuffer);

    await (worker as any).processMessage(message);

    expect(mockUpload).toHaveBeenCalledWith('CRT-9x4k7m', pdfBuffer);
  });

  it('should update certificate record with S3 URL', async () => {
    const worker = createWorker();
    const message = createMessage();

    await (worker as any).processMessage(message);

    expect(mockUpdateDb).toHaveBeenCalledWith(
      'CRT-9x4k7m',
      'https://korefield-academy-certificates.s3.amazonaws.com/certificates/CRT-9x4k7m.pdf',
    );
  });

  it('should execute steps in order: generate → upload → update DB', async () => {
    const callOrder: string[] = [];
    mockGeneratePdf.mockImplementation(() => {
      callOrder.push('generate');
      return Buffer.from('pdf');
    });
    mockUpload.mockImplementation(async () => {
      callOrder.push('upload');
      return { bucket: 'b', key: 'k', url: 'https://example.com/cert.pdf' };
    });
    mockUpdateDb.mockImplementation(async () => {
      callOrder.push('updateDb');
    });

    const worker = createWorker();
    await (worker as any).processMessage(createMessage());

    expect(callOrder).toEqual(['generate', 'upload', 'updateDb']);
  });

  it('should propagate S3 upload errors for retry handling', async () => {
    mockUpload.mockRejectedValue(new Error('S3 upload failed'));

    const worker = createWorker();

    await expect(
      (worker as any).processMessage(createMessage()),
    ).rejects.toThrow('S3 upload failed');

    // DB should not be updated if upload fails
    expect(mockUpdateDb).not.toHaveBeenCalled();
  });

  it('should propagate DB update errors for retry handling', async () => {
    mockUpdateDb.mockRejectedValue(new Error('DB connection lost'));

    const worker = createWorker();

    await expect(
      (worker as any).processMessage(createMessage()),
    ).rejects.toThrow('DB connection lost');
  });
});
