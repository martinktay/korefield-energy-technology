import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ContentService } from './content.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';

const mockPrisma = {
  track: { findMany: jest.fn(), findUnique: jest.fn() },
  module: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  level: { findUnique: jest.fn() },
  labSession: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  submission: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  user: { findUnique: jest.fn() },
  learner: { findUnique: jest.fn() },
  lesson: { findUnique: jest.fn() },
  contentVersion: { create: jest.fn() },
};

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('ContentService — Lab Session Management', () => {
  let service: ContentService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
  });

  // ── POST /content/labs — schedule lab session ──────────────────

  describe('scheduleLabSession', () => {
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    it('should create a lab session with LAB-* ID', async () => {
      mockPrisma.module.findUnique.mockResolvedValue({ id: 'MOD-001', title: 'Python for AI' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'USR-inst1', role: 'Instructor' });
      mockPrisma.labSession.create.mockResolvedValue({
        id: 'LAB-abc123',
        module_id: 'MOD-001',
        instructor_id: 'USR-inst1',
        scheduled_at: new Date(futureDate),
        status: 'scheduled',
      });

      const result = await service.scheduleLabSession({
        instructor_id: 'USR-inst1',
        module_id: 'MOD-001',
        scheduled_at: futureDate,
      });

      expect(result.id).toMatch(/^LAB-/);
      expect(result.status).toBe('scheduled');
      expect(mockPrisma.labSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.stringMatching(/^LAB-/),
          module_id: 'MOD-001',
          instructor_id: 'USR-inst1',
        }),
      });
    });

    it('should throw NotFoundException when module does not exist', async () => {
      mockPrisma.module.findUnique.mockResolvedValue(null);

      await expect(
        service.scheduleLabSession({
          instructor_id: 'USR-inst1',
          module_id: 'MOD-missing',
          scheduled_at: futureDate,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when instructor does not exist', async () => {
      mockPrisma.module.findUnique.mockResolvedValue({ id: 'MOD-001' });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.scheduleLabSession({
          instructor_id: 'USR-missing',
          module_id: 'MOD-001',
          scheduled_at: futureDate,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when scheduled_at is in the past', async () => {
      mockPrisma.module.findUnique.mockResolvedValue({ id: 'MOD-001' });
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'USR-inst1' });

      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      await expect(
        service.scheduleLabSession({
          instructor_id: 'USR-inst1',
          module_id: 'MOD-001',
          scheduled_at: pastDate,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── GET /content/labs/:labId — get lab session details ─────────

  describe('getLabSession', () => {
    it('should return lab session with module and submissions', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue({
        id: 'LAB-abc123',
        module_id: 'MOD-001',
        instructor_id: 'USR-inst1',
        scheduled_at: new Date(),
        recording_url: null,
        status: 'scheduled',
        module: { id: 'MOD-001', title: 'Python for AI' },
        submissions: [],
      });

      const result = await service.getLabSession('LAB-abc123');

      expect(result.id).toBe('LAB-abc123');
      expect(result.module.title).toBe('Python for AI');
      expect(result.submissions).toEqual([]);
    });

    it('should throw NotFoundException when lab session does not exist', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue(null);

      await expect(service.getLabSession('LAB-missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── PUT /content/labs/:labId/recording — add recording URL ─────

  describe('updateLabRecording', () => {
    it('should update recording URL and set status to completed', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue({
        id: 'LAB-abc123',
        scheduled_at: new Date(),
        status: 'scheduled',
      });
      mockPrisma.labSession.update.mockResolvedValue({
        id: 'LAB-abc123',
        recording_url: 'https://stream.example.com/recording-1',
        status: 'completed',
      });

      const result = await service.updateLabRecording('LAB-abc123', {
        recording_url: 'https://stream.example.com/recording-1',
      });

      expect(result.recording_url).toBe('https://stream.example.com/recording-1');
      expect(result.status).toBe('completed');
      expect(mockPrisma.labSession.update).toHaveBeenCalledWith({
        where: { id: 'LAB-abc123' },
        data: { recording_url: 'https://stream.example.com/recording-1', status: 'completed' },
      });
    });

    it('should throw NotFoundException when lab session does not exist', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLabRecording('LAB-missing', {
          recording_url: 'https://stream.example.com/recording-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── POST /content/labs/:labId/submit — async lab work submission ─

  describe('submitLabWork', () => {
    it('should create a submission with SUB-* ID linked to lab session', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue({
        id: 'LAB-abc123',
        status: 'completed',
      });
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-001' });
      mockPrisma.submission.create.mockResolvedValue({
        id: 'SUB-xyz789',
        learner_id: 'LRN-001',
        lab_session_id: 'LAB-abc123',
        content: 'My lab work solution',
        status: 'submitted',
        submitted_at: new Date(),
      });

      const result = await service.submitLabWork('LAB-abc123', {
        learner_id: 'LRN-001',
        content: 'My lab work solution',
      });

      expect(result.id).toMatch(/^SUB-/);
      expect(result.lab_session_id).toBe('LAB-abc123');
      expect(result.status).toBe('submitted');
      expect(mockPrisma.submission.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.stringMatching(/^SUB-/),
          learner_id: 'LRN-001',
          lab_session_id: 'LAB-abc123',
          content: 'My lab work solution',
          status: 'submitted',
        }),
      });
    });

    it('should throw NotFoundException when lab session does not exist', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue(null);

      await expect(
        service.submitLabWork('LAB-missing', {
          learner_id: 'LRN-001',
          content: 'My work',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when learner does not exist', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue({ id: 'LAB-abc123' });
      mockPrisma.learner.findUnique.mockResolvedValue(null);

      await expect(
        service.submitLabWork('LAB-abc123', {
          learner_id: 'LRN-missing',
          content: 'My work',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── POST /content/labs/:labId/feedback — instructor feedback ───

  describe('provideLabFeedback', () => {
    const recentSubmission = {
      id: 'SUB-xyz789',
      lab_session_id: 'LAB-abc123',
      learner_id: 'LRN-001',
      submitted_at: new Date(), // just submitted — within 7-day window
      status: 'submitted',
    };

    it('should update submission with feedback and set status to graded', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue({ id: 'LAB-abc123' });
      mockPrisma.submission.findUnique.mockResolvedValue(recentSubmission);
      mockPrisma.submission.update.mockResolvedValue({
        ...recentSubmission,
        feedback: 'Great work on the data pipeline implementation.',
        feedback_at: new Date(),
        score: 85,
        status: 'graded',
      });

      const result = await service.provideLabFeedback('LAB-abc123', {
        submission_id: 'SUB-xyz789',
        feedback: 'Great work on the data pipeline implementation.',
        score: 85,
      });

      expect(result.feedback).toBe('Great work on the data pipeline implementation.');
      expect(result.status).toBe('graded');
      expect(result.score).toBe(85);
      expect(mockPrisma.submission.update).toHaveBeenCalledWith({
        where: { id: 'SUB-xyz789' },
        data: expect.objectContaining({
          feedback: 'Great work on the data pipeline implementation.',
          status: 'graded',
          score: 85,
        }),
      });
    });

    it('should allow feedback without a score', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue({ id: 'LAB-abc123' });
      mockPrisma.submission.findUnique.mockResolvedValue(recentSubmission);
      mockPrisma.submission.update.mockResolvedValue({
        ...recentSubmission,
        feedback: 'Needs improvement.',
        feedback_at: new Date(),
        status: 'graded',
      });

      const result = await service.provideLabFeedback('LAB-abc123', {
        submission_id: 'SUB-xyz789',
        feedback: 'Needs improvement.',
      });

      expect(result.feedback).toBe('Needs improvement.');
      expect(result.status).toBe('graded');
    });

    it('should throw BadRequestException when 7-day review window has expired', async () => {
      const expiredSubmission = {
        ...recentSubmission,
        submitted_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      };
      mockPrisma.labSession.findUnique.mockResolvedValue({ id: 'LAB-abc123' });
      mockPrisma.submission.findUnique.mockResolvedValue(expiredSubmission);

      await expect(
        service.provideLabFeedback('LAB-abc123', {
          submission_id: 'SUB-xyz789',
          feedback: 'Late feedback',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when submission does not belong to lab session', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue({ id: 'LAB-abc123' });
      mockPrisma.submission.findUnique.mockResolvedValue({
        ...recentSubmission,
        lab_session_id: 'LAB-other',
      });

      await expect(
        service.provideLabFeedback('LAB-abc123', {
          submission_id: 'SUB-xyz789',
          feedback: 'Feedback',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when lab session does not exist', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue(null);

      await expect(
        service.provideLabFeedback('LAB-missing', {
          submission_id: 'SUB-xyz789',
          feedback: 'Feedback',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when submission does not exist', async () => {
      mockPrisma.labSession.findUnique.mockResolvedValue({ id: 'LAB-abc123' });
      mockPrisma.submission.findUnique.mockResolvedValue(null);

      await expect(
        service.provideLabFeedback('LAB-abc123', {
          submission_id: 'SUB-missing',
          feedback: 'Feedback',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
