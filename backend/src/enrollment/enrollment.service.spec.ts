import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';
import { EmailService } from '@email/email.service';

// Minimal mock for CacheService
const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

// Minimal mock for EmailService
const mockEmailService = {
  sendEnrollmentConfirmationEmail: jest.fn().mockResolvedValue(undefined),
  sendPodAssignmentEmail: jest.fn().mockResolvedValue(undefined),
};

// Minimal mock for PrismaService
const mockPrisma = {
  user: { findUnique: jest.fn() },
  learner: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  foundationProgress: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
  track: { findMany: jest.fn(), findUnique: jest.fn() },
  enrollment: { findFirst: jest.fn(), create: jest.fn(), findMany: jest.fn() },
  waitlistEntry: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    aggregate: jest.fn(),
  },
  pod: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  podMember: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  performanceGate: {
    findUnique: jest.fn(),
  },
  gateAttempt: {
    count: jest.fn(),
    create: jest.fn(),
  },
};

describe('EnrollmentService', () => {
  let service: EnrollmentService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnrollmentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CacheService, useValue: mockCache },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<EnrollmentService>(EnrollmentService);
  });

  // ── POST /enrollment/register ──────────────────────────────────

  describe('registerLearner', () => {
    it('should create a Learner with LRN-* ID linked to an existing User', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'USR-abc123',
        email: 'test@example.com',
      });
      mockPrisma.learner.findUnique.mockResolvedValue(null);
      mockPrisma.learner.create.mockImplementation(({ data }) => ({
        ...data,
        onboarding_complete: false,
      }));

      const result = await service.registerLearner({
        user_id: 'USR-abc123',
        country: 'Nigeria',
        professional_background: 'Software Engineer',
        learning_goals: 'AI Engineering',
      });

      expect(result.id).toMatch(/^LRN-[a-f0-9]{6}$/);
      expect(result.user_id).toBe('USR-abc123');
      expect(result.country).toBe('Nigeria');
      expect(result.professional_background).toBe('Software Engineer');
      expect(result.learning_goals).toBe('AI Engineering');
      expect(result.onboarding_complete).toBe(false);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.registerLearner({ user_id: 'USR-missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when learner profile already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'USR-abc123' });
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-exists' });

      await expect(
        service.registerLearner({ user_id: 'USR-abc123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── POST /enrollment/onboard ───────────────────────────────────

  describe('onboardLearner', () => {
    const baseLearner = {
      id: 'LRN-abc123',
      user_id: 'USR-abc123',
      country: null,
      professional_background: null,
      learning_goals: null,
      onboarding_complete: false,
    };

    it('should mark onboarding complete and auto-create FoundationProgress with 5 not_started modules', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(baseLearner);
      mockPrisma.learner.update.mockImplementation(({ data }) => ({
        ...baseLearner,
        ...data,
      }));
      mockPrisma.foundationProgress.create.mockImplementation(({ data }) => data);

      const result = await service.onboardLearner({
        learner_id: 'LRN-abc123',
        country: 'Kenya',
        professional_background: 'Data analyst',
        learning_goals: 'data science and analytics',
      });

      expect(result.onboarding_complete).toBe(true);
      expect(result.foundation_progress_id).toMatch(/^FND-[a-f0-9]{6}$/);

      // Verify FoundationProgress was created with correct module statuses
      const fpCall = mockPrisma.foundationProgress.create.mock.calls[0][0];
      const statuses = fpCall.data.module_statuses;
      expect(statuses).toHaveLength(5);
      expect(statuses.map((m: any) => m.name)).toEqual([
        'AI Literacy',
        'AI Fluency',
        'Systems Awareness',
        'Governance',
        'Professional Discipline',
      ]);
      statuses.forEach((m: any) => {
        expect(m.status).toBe('not_started');
      });
    });

    it('should recommend tracks based on learning_goals keywords', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(baseLearner);
      mockPrisma.learner.update.mockImplementation(({ data }) => ({
        ...baseLearner,
        ...data,
      }));
      mockPrisma.foundationProgress.create.mockImplementation(({ data }) => data);

      const result = await service.onboardLearner({
        learner_id: 'LRN-abc123',
        learning_goals: 'I want to learn cybersecurity',
      });

      expect(result.recommended_tracks).toContain(
        'Cybersecurity and AI Security',
      );
    });

    it('should recommend all tracks when no keywords match', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(baseLearner);
      mockPrisma.learner.update.mockImplementation(({ data }) => ({
        ...baseLearner,
        ...data,
      }));
      mockPrisma.foundationProgress.create.mockImplementation(({ data }) => data);

      const result = await service.onboardLearner({
        learner_id: 'LRN-abc123',
        learning_goals: 'general interest',
      });

      expect(result.recommended_tracks).toHaveLength(4);
    });

    it('should throw NotFoundException when learner does not exist', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(null);

      await expect(
        service.onboardLearner({ learner_id: 'LRN-missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when onboarding already completed', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({
        ...baseLearner,
        onboarding_complete: true,
      });

      await expect(
        service.onboardLearner({ learner_id: 'LRN-abc123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── PATCH /enrollment/learners/:id ──────────────────────────────

  describe('updateLearner', () => {
    const baseLearner = {
      id: 'LRN-abc123',
      user_id: 'USR-abc123',
      project_interest: null,
    };

    it('should update project_interest and return the updated learner', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(baseLearner);
      mockPrisma.learner.update.mockResolvedValue({
        ...baseLearner,
        project_interest: 'A fraud detection system for mobile payments',
      });

      const result = await service.updateLearner('LRN-abc123', {
        project_interest: 'A fraud detection system for mobile payments',
      });

      expect(result.id).toBe('LRN-abc123');
      expect(result.project_interest).toBe('A fraud detection system for mobile payments');
      expect(mockPrisma.learner.update).toHaveBeenCalledWith({
        where: { id: 'LRN-abc123' },
        data: { project_interest: 'A fraud detection system for mobile payments' },
      });
    });

    it('should allow clearing project_interest by passing empty string', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({
        ...baseLearner,
        project_interest: 'Old interest',
      });
      mockPrisma.learner.update.mockResolvedValue({
        ...baseLearner,
        project_interest: '',
      });

      const result = await service.updateLearner('LRN-abc123', {
        project_interest: '',
      });

      expect(result.project_interest).toBe('');
    });

    it('should throw NotFoundException when learner does not exist', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLearner('LRN-missing', { project_interest: 'test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should not update when project_interest is undefined (no-op body)', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(baseLearner);
      mockPrisma.learner.update.mockResolvedValue(baseLearner);

      const result = await service.updateLearner('LRN-abc123', {});

      expect(result.id).toBe('LRN-abc123');
      expect(mockPrisma.learner.update).toHaveBeenCalledWith({
        where: { id: 'LRN-abc123' },
        data: {},
      });
    });
  });

  // ── recommendTracks (unit) ─────────────────────────────────────

  describe('recommendTracks', () => {
    it('should match "machine learning" to AI Engineering track', () => {
      const result = service.recommendTracks('machine learning', null);
      expect(result).toContain('AI Engineering and Intelligent Systems');
    });

    it('should match "data analysis" to Data Science track', () => {
      const result = service.recommendTracks(null, 'data analysis background');
      expect(result).toContain('Data Science and Decision Intelligence');
    });

    it('should match "leadership" to AI Product track', () => {
      const result = service.recommendTracks('leadership skills', null);
      expect(result).toContain('AI Product and Project Leadership');
    });

    it('should deduplicate when multiple keywords match the same track', () => {
      const result = service.recommendTracks(
        'data science and analytics',
        null,
      );
      const dsCount = result.filter(
        (t) => t === 'Data Science and Decision Intelligence',
      ).length;
      expect(dsCount).toBe(1);
    });

    it('should return all 4 tracks when no keywords match', () => {
      const result = service.recommendTracks('cooking', 'chef');
      expect(result).toHaveLength(4);
    });
  });

  // ── GET /enrollment/foundation/progress ────────────────────────

  describe('getFoundationProgress', () => {
    const baseProgress = {
      id: 'FND-abc123',
      learner_id: 'LRN-abc123',
      module_statuses: [
        { name: 'AI Literacy', status: 'not_started' },
        { name: 'AI Fluency', status: 'not_started' },
        { name: 'Systems Awareness', status: 'not_started' },
        { name: 'Governance', status: 'not_started' },
        { name: 'Professional Discipline', status: 'not_started' },
      ],
      completed: false,
      completed_at: null,
    };

    it('should return foundation progress with 5 module statuses', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue(baseProgress);

      const result = await service.getFoundationProgress('LRN-abc123');

      expect(result.id).toBe('FND-abc123');
      expect(result.learner_id).toBe('LRN-abc123');
      expect(result.module_statuses).toHaveLength(5);
      expect(result.completed).toBe(false);
      expect(result.completed_at).toBeNull();
    });

    it('should throw NotFoundException when no foundation progress exists', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue(null);

      await expect(
        service.getFoundationProgress('LRN-missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── POST /enrollment/foundation/complete-module ────────────────

  describe('completeFoundationModule', () => {
    const makeProgress = (overrides: Record<string, string> = {}) => ({
      id: 'FND-abc123',
      learner_id: 'LRN-abc123',
      module_statuses: [
        { name: 'AI Literacy', status: overrides['AI Literacy'] ?? 'not_started' },
        { name: 'AI Fluency', status: overrides['AI Fluency'] ?? 'not_started' },
        { name: 'Systems Awareness', status: overrides['Systems Awareness'] ?? 'not_started' },
        { name: 'Governance', status: overrides['Governance'] ?? 'not_started' },
        { name: 'Professional Discipline', status: overrides['Professional Discipline'] ?? 'not_started' },
      ],
      completed: false,
      completed_at: null,
    });

    it('should mark a module as completed', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue(makeProgress());
      mockPrisma.foundationProgress.update.mockImplementation(({ data }) => ({
        id: 'FND-abc123',
        learner_id: 'LRN-abc123',
        ...data,
      }));

      const result = await service.completeFoundationModule({
        learner_id: 'LRN-abc123',
        module_name: 'AI Literacy',
      });

      const statuses = result.module_statuses as Array<{ name: string; status: string }>;
      const aiLiteracy = statuses.find((m) => m.name === 'AI Literacy');
      expect(aiLiteracy?.status).toBe('completed');
      expect(result.completed).toBe(false);
    });

    it('should set completed=true and completed_at when all 5 modules are completed', async () => {
      // 4 already completed, completing the last one
      const progress = makeProgress({
        'AI Literacy': 'completed',
        'AI Fluency': 'completed',
        'Systems Awareness': 'completed',
        'Governance': 'completed',
      });
      mockPrisma.foundationProgress.findUnique.mockResolvedValue(progress);
      mockPrisma.foundationProgress.update.mockImplementation(({ data }) => ({
        id: 'FND-abc123',
        learner_id: 'LRN-abc123',
        ...data,
      }));

      const result = await service.completeFoundationModule({
        learner_id: 'LRN-abc123',
        module_name: 'Professional Discipline',
      });

      expect(result.completed).toBe(true);
      expect(result.completed_at).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when foundation progress not found', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue(null);

      await expect(
        service.completeFoundationModule({
          learner_id: 'LRN-missing',
          module_name: 'AI Literacy',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when Foundation already completed', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        ...makeProgress(),
        completed: true,
        completed_at: new Date(),
      });

      await expect(
        service.completeFoundationModule({
          learner_id: 'LRN-abc123',
          module_name: 'AI Literacy',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when module is already completed', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue(
        makeProgress({ 'AI Literacy': 'completed' }),
      );

      await expect(
        service.completeFoundationModule({
          learner_id: 'LRN-abc123',
          module_name: 'AI Literacy',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── GET /enrollment/foundation/status ──────────────────────────

  describe('getFoundationStatus', () => {
    it('should return foundation_complete=false without available_tracks when incomplete', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        id: 'FND-abc123',
        learner_id: 'LRN-abc123',
        completed: false,
        completed_at: null,
      });

      const result = await service.getFoundationStatus('LRN-abc123');

      expect(result.foundation_complete).toBe(false);
      expect(result.available_tracks).toBeUndefined();
    });

    it('should return foundation_complete=true with available tracks when complete', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        id: 'FND-abc123',
        learner_id: 'LRN-abc123',
        completed: true,
        completed_at: new Date(),
      });
      mockPrisma.track.findMany.mockResolvedValue([
        { id: 'TRK-001', name: 'AI Engineering', description: 'AI track', status: 'available', estimated_duration: '6 months' },
        { id: 'TRK-002', name: 'Data Science', description: 'DS track', status: 'available', estimated_duration: '6 months' },
      ]);

      const result = await service.getFoundationStatus('LRN-abc123');

      expect(result.foundation_complete).toBe(true);
      expect(result.available_tracks).toHaveLength(2);
      expect(result.available_tracks![0].name).toBe('AI Engineering');
    });

    it('should throw NotFoundException when no foundation progress exists', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue(null);

      await expect(
        service.getFoundationStatus('LRN-missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── assertFoundationComplete (prerequisite check) ──────────────

  describe('assertFoundationComplete', () => {
    it('should resolve when Foundation is complete', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        learner_id: 'LRN-abc123',
        completed: true,
      });

      await expect(
        service.assertFoundationComplete('LRN-abc123'),
      ).resolves.toBeUndefined();
    });

    it('should throw ForbiddenException when Foundation is not complete', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        learner_id: 'LRN-abc123',
        completed: false,
      });

      await expect(
        service.assertFoundationComplete('LRN-abc123'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when no foundation progress exists', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue(null);

      await expect(
        service.assertFoundationComplete('LRN-missing'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── POST /enrollment/tracks/:trackId/enroll ────────────────────

  describe('enrollInTrack', () => {
    const mockTrack = {
      id: 'TRK-abc123',
      name: 'AI Engineering and Intelligent Systems',
      description: 'AI track',
      status: 'available',
      estimated_duration: '6 months',
      levels: [
        {
          id: 'LVL-beg001',
          tier: 'Beginner',
          sequence: 1,
          modules: [{ id: 'MOD-first1', title: 'Python for AI', sequence: 1 }],
        },
        {
          id: 'LVL-int001',
          tier: 'Intermediate',
          sequence: 2,
          modules: [{ id: 'MOD-mid01', title: 'RAG Pipelines', sequence: 1 }],
        },
        {
          id: 'LVL-adv001',
          tier: 'Advanced',
          sequence: 3,
          modules: [{ id: 'MOD-adv01', title: 'Multi-Agent Systems', sequence: 1 }],
        },
      ],
    };

    it('should enroll learner in full pathway and assign to first Beginner module', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        learner_id: 'LRN-abc123',
        completed: true,
      });
      mockPrisma.track.findUnique.mockResolvedValue(mockTrack);
      mockPrisma.enrollment.findFirst.mockResolvedValue(null);
      mockPrisma.enrollment.create.mockImplementation(({ data }) => ({
        ...data,
        enrolled_at: new Date(),
      }));

      const result = await service.enrollInTrack('TRK-abc123', {
        learner_id: 'LRN-abc123',
      });

      expect(result.id).toMatch(/^ENR-[a-f0-9]{6}$/);
      expect(result.learner_id).toBe('LRN-abc123');
      expect(result.track_id).toBe('TRK-abc123');
      expect(result.track_name).toBe('AI Engineering and Intelligent Systems');
      expect(result.status).toBe('active');
      expect(result.current_level).toEqual({ id: 'LVL-beg001', tier: 'Beginner' });
      expect(result.current_module).toEqual({ id: 'MOD-first1', title: 'Python for AI' });
    });

    it('should throw ForbiddenException when Foundation is not complete', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        learner_id: 'LRN-abc123',
        completed: false,
      });

      await expect(
        service.enrollInTrack('TRK-abc123', { learner_id: 'LRN-abc123' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when track does not exist', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        learner_id: 'LRN-abc123',
        completed: true,
      });
      mockPrisma.track.findUnique.mockResolvedValue(null);

      await expect(
        service.enrollInTrack('TRK-missing', { learner_id: 'LRN-abc123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when track is waitlisted', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        learner_id: 'LRN-abc123',
        completed: true,
      });
      mockPrisma.track.findUnique.mockResolvedValue({
        ...mockTrack,
        status: 'waitlisted',
      });

      await expect(
        service.enrollInTrack('TRK-abc123', { learner_id: 'LRN-abc123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException when learner is already enrolled', async () => {
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        learner_id: 'LRN-abc123',
        completed: true,
      });
      mockPrisma.track.findUnique.mockResolvedValue(mockTrack);
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'ENR-exists' });

      await expect(
        service.enrollInTrack('TRK-abc123', { learner_id: 'LRN-abc123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── POST /enrollment/waitlist/:trackId ─────────────────────────

  describe('joinWaitlist', () => {
    it('should add learner to waitlist with correct position', async () => {
      mockPrisma.track.findUnique.mockResolvedValue({
        id: 'TRK-wait01',
        name: 'Cybersecurity and AI Security',
        status: 'waitlisted',
      });
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue(null);
      mockPrisma.waitlistEntry.aggregate.mockResolvedValue({
        _max: { position: 3 },
      });
      mockPrisma.waitlistEntry.create.mockImplementation(({ data }) => ({
        ...data,
        joined_at: new Date(),
      }));

      const result = await service.joinWaitlist('TRK-wait01', {
        learner_id: 'LRN-abc123',
      });

      expect(result.id).toMatch(/^WTL-[a-f0-9]{6}$/);
      expect(result.learner_id).toBe('LRN-abc123');
      expect(result.track_id).toBe('TRK-wait01');
      expect(result.position).toBe(4);
      expect(result.track_name).toBe('Cybersecurity and AI Security');
    });

    it('should assign position 1 when waitlist is empty', async () => {
      mockPrisma.track.findUnique.mockResolvedValue({
        id: 'TRK-wait01',
        name: 'Cybersecurity',
        status: 'waitlisted',
      });
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue(null);
      mockPrisma.waitlistEntry.aggregate.mockResolvedValue({
        _max: { position: null },
      });
      mockPrisma.waitlistEntry.create.mockImplementation(({ data }) => ({
        ...data,
        joined_at: new Date(),
      }));

      const result = await service.joinWaitlist('TRK-wait01', {
        learner_id: 'LRN-abc123',
      });

      expect(result.position).toBe(1);
    });

    it('should throw NotFoundException when track does not exist', async () => {
      mockPrisma.track.findUnique.mockResolvedValue(null);

      await expect(
        service.joinWaitlist('TRK-missing', { learner_id: 'LRN-abc123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when learner is already on waitlist', async () => {
      mockPrisma.track.findUnique.mockResolvedValue({
        id: 'TRK-wait01',
        name: 'Cybersecurity',
        status: 'waitlisted',
      });
      mockPrisma.waitlistEntry.findFirst.mockResolvedValue({ id: 'WTL-exists' });

      await expect(
        service.joinWaitlist('TRK-wait01', { learner_id: 'LRN-abc123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── Waitlist notification flow ─────────────────────────────────

  describe('notifyWaitlist', () => {
    it('should notify all un-notified entries with 72-hour enrollment deadline', async () => {
      const entries = [
        { id: 'WTL-001', learner_id: 'LRN-001', position: 1 },
        { id: 'WTL-002', learner_id: 'LRN-002', position: 2 },
      ];
      mockPrisma.waitlistEntry.findMany.mockResolvedValue(entries);
      mockPrisma.waitlistEntry.update.mockImplementation(({ data }) => data);

      const result = await service.notifyWaitlist('TRK-abc123');

      expect(result.notified_count).toBe(2);
      expect(result.enrollment_deadline).toBeInstanceOf(Date);

      // Verify 72-hour window
      const now = Date.now();
      const deadlineMs = result.enrollment_deadline!.getTime();
      const hoursDiff = (deadlineMs - now) / (1000 * 60 * 60);
      expect(hoursDiff).toBeGreaterThan(71);
      expect(hoursDiff).toBeLessThanOrEqual(72);
    });

    it('should return 0 when no un-notified entries exist', async () => {
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([]);

      const result = await service.notifyWaitlist('TRK-abc123');

      expect(result.notified_count).toBe(0);
    });
  });

  describe('releaseExpiredWaitlistSlots', () => {
    it('should delete expired entries where learner did not enroll', async () => {
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([
        { id: 'WTL-001', learner_id: 'LRN-001', track_id: 'TRK-abc123' },
      ]);
      mockPrisma.enrollment.findFirst.mockResolvedValue(null);
      mockPrisma.waitlistEntry.delete.mockResolvedValue({});

      const result = await service.releaseExpiredWaitlistSlots('TRK-abc123');

      expect(result.released_count).toBe(1);
      expect(mockPrisma.waitlistEntry.delete).toHaveBeenCalledWith({
        where: { id: 'WTL-001' },
      });
    });

    it('should not delete expired entries where learner enrolled', async () => {
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([
        { id: 'WTL-001', learner_id: 'LRN-001', track_id: 'TRK-abc123' },
      ]);
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'ENR-exists' });

      const result = await service.releaseExpiredWaitlistSlots('TRK-abc123');

      expect(result.released_count).toBe(0);
      expect(mockPrisma.waitlistEntry.delete).not.toHaveBeenCalled();
    });

    it('should return 0 when no expired entries exist', async () => {
      mockPrisma.waitlistEntry.findMany.mockResolvedValue([]);

      const result = await service.releaseExpiredWaitlistSlots('TRK-abc123');

      expect(result.released_count).toBe(0);
    });
  });

  // ── Pod Assignment — resolveRoleForTrack ───────────────────────

  describe('resolveRoleForTrack', () => {
    it('should map AI Engineering track to AIEngineer role', () => {
      expect(service.resolveRoleForTrack('AI Engineering and Intelligent Systems')).toBe('AIEngineer');
    });

    it('should map Data Science track to DataScientist role', () => {
      expect(service.resolveRoleForTrack('Data Science and Decision Intelligence')).toBe('DataScientist');
    });

    it('should map Cybersecurity track to CybersecurityAISecurity role', () => {
      expect(service.resolveRoleForTrack('Cybersecurity and AI Security')).toBe('CybersecurityAISecurity');
    });

    it('should map AI Product Leadership track to ProductManager role', () => {
      expect(service.resolveRoleForTrack('AI Product and Project Leadership')).toBe('ProductManager');
    });

    it('should default to IndustrySpecialist for unknown tracks', () => {
      expect(service.resolveRoleForTrack('Unknown Track')).toBe('IndustrySpecialist');
    });
  });

  // ── POST /enrollment/pods/assign ───────────────────────────────

  describe('assignLearnerToPod', () => {
    it('should assign learner to existing pending pod with vacancy for their role', async () => {
      mockPrisma.track.findUnique.mockResolvedValue({
        id: 'TRK-abc123',
        name: 'AI Engineering and Intelligent Systems',
      });
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.podMember.findFirst.mockResolvedValue(null);
      // Existing pod with no AIEngineer yet
      mockPrisma.pod.findMany.mockResolvedValue([
        {
          id: 'POD-exist1',
          track_id: 'TRK-abc123',
          status: 'pending',
          members: [
            { id: 'PDM-001', role: 'DataScientist', learner_id: 'LRN-other1' },
          ],
        },
      ]);
      mockPrisma.podMember.create.mockImplementation(({ data }) => ({
        ...data,
        assigned_at: new Date(),
      }));

      const result = await service.assignLearnerToPod({
        learner_id: 'LRN-abc123',
        track_id: 'TRK-abc123',
      });

      expect(result.pod_id).toBe('POD-exist1');
      expect(result.member_id).toMatch(/^PDM-[a-f0-9]{6}$/);
      expect(result.role).toBe('AIEngineer');
      expect(result.track_name).toBe('AI Engineering and Intelligent Systems');
    });

    it('should create a new pod when no existing pod has vacancy for the role', async () => {
      mockPrisma.track.findUnique.mockResolvedValue({
        id: 'TRK-abc123',
        name: 'AI Engineering and Intelligent Systems',
      });
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.podMember.findFirst.mockResolvedValue(null);
      // Existing pod already has AIEngineer
      mockPrisma.pod.findMany.mockResolvedValue([
        {
          id: 'POD-full01',
          track_id: 'TRK-abc123',
          status: 'pending',
          members: [
            { id: 'PDM-001', role: 'AIEngineer', learner_id: 'LRN-other1' },
          ],
        },
      ]);
      mockPrisma.pod.create.mockImplementation(({ data }) => ({
        ...data,
        status: 'pending',
        members: [],
      }));
      mockPrisma.podMember.create.mockImplementation(({ data }) => ({
        ...data,
        assigned_at: new Date(),
      }));

      const result = await service.assignLearnerToPod({
        learner_id: 'LRN-abc123',
        track_id: 'TRK-abc123',
      });

      expect(result.pod_id).toMatch(/^POD-[a-f0-9]{6}$/);
      expect(result.role).toBe('AIEngineer');
      expect(mockPrisma.pod.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when track does not exist', async () => {
      mockPrisma.track.findUnique.mockResolvedValue(null);

      await expect(
        service.assignLearnerToPod({ learner_id: 'LRN-abc123', track_id: 'TRK-missing' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when learner does not exist', async () => {
      mockPrisma.track.findUnique.mockResolvedValue({ id: 'TRK-abc123', name: 'AI Engineering' });
      mockPrisma.learner.findUnique.mockResolvedValue(null);

      await expect(
        service.assignLearnerToPod({ learner_id: 'LRN-missing', track_id: 'TRK-abc123' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when learner is already in a pod for this track', async () => {
      mockPrisma.track.findUnique.mockResolvedValue({ id: 'TRK-abc123', name: 'AI Engineering' });
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.podMember.findFirst.mockResolvedValue({ id: 'PDM-exists' });

      await expect(
        service.assignLearnerToPod({ learner_id: 'LRN-abc123', track_id: 'TRK-abc123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── GET /enrollment/pods/:podId ────────────────────────────────

  describe('getPodDetails', () => {
    it('should return pod details with members and missing roles', async () => {
      mockPrisma.pod.findUnique.mockResolvedValue({
        id: 'POD-abc123',
        track_id: 'TRK-abc123',
        assessor_id: null,
        status: 'pending',
        activated_at: null,
        created_at: new Date(),
        track: { id: 'TRK-abc123', name: 'AI Engineering and Intelligent Systems' },
        members: [
          { id: 'PDM-001', learner_id: 'LRN-001', role: 'AIEngineer', assigned_at: new Date(), learner: { id: 'LRN-001', user_id: 'USR-001' } },
          { id: 'PDM-002', learner_id: 'LRN-002', role: 'DataScientist', assigned_at: new Date(), learner: { id: 'LRN-002', user_id: 'USR-002' } },
        ],
      });

      const result = await service.getPodDetails('POD-abc123');

      expect(result.id).toBe('POD-abc123');
      expect(result.members).toHaveLength(2);
      expect(result.filled_roles).toContain('AIEngineer');
      expect(result.filled_roles).toContain('DataScientist');
      expect(result.missing_standard_roles).toContain('ProductManager');
      expect(result.missing_standard_roles).toContain('CybersecurityAISecurity');
      expect(result.missing_standard_roles).toContain('IndustrySpecialist');
    });

    it('should throw NotFoundException when pod does not exist', async () => {
      mockPrisma.pod.findUnique.mockResolvedValue(null);

      await expect(service.getPodDetails('POD-missing')).rejects.toThrow(NotFoundException);
    });
  });

  // ── POST /enrollment/pods/:podId/activate ──────────────────────

  describe('activatePod', () => {
    const makePodWithAllRoles = () => ({
      id: 'POD-abc123',
      track_id: 'TRK-abc123',
      assessor_id: null,
      status: 'pending',
      members: [
        { id: 'PDM-001', role: 'ProductManager', learner_id: 'LRN-001' },
        { id: 'PDM-002', role: 'DataScientist', learner_id: 'LRN-002' },
        { id: 'PDM-003', role: 'AIEngineer', learner_id: 'LRN-003' },
        { id: 'PDM-004', role: 'CybersecurityAISecurity', learner_id: 'LRN-004' },
        { id: 'PDM-005', role: 'IndustrySpecialist', learner_id: 'LRN-005' },
      ],
    });

    it('should activate pod when assessor assigned and all standard roles filled', async () => {
      mockPrisma.pod.findUnique.mockResolvedValue(makePodWithAllRoles());
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'USR-asr001', role: 'Assessor' });
      mockPrisma.pod.update.mockImplementation(({ data }) => ({
        id: 'POD-abc123',
        track_id: 'TRK-abc123',
        ...data,
      }));

      const result = await service.activatePod('POD-abc123', { assessor_id: 'USR-asr001' });

      expect(result.status).toBe('active');
      expect(result.assessor_id).toBe('USR-asr001');
      expect(result.activated_at).toBeInstanceOf(Date);
      expect(result.member_count).toBe(5);
    });

    it('should throw BadRequestException when standard roles are missing', async () => {
      const incompletePod = {
        ...makePodWithAllRoles(),
        members: [
          { id: 'PDM-001', role: 'ProductManager', learner_id: 'LRN-001' },
          { id: 'PDM-002', role: 'DataScientist', learner_id: 'LRN-002' },
        ],
      };
      mockPrisma.pod.findUnique.mockResolvedValue(incompletePod);
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'USR-asr001', role: 'Assessor' });

      await expect(
        service.activatePod('POD-abc123', { assessor_id: 'USR-asr001' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when assigned user is not an Assessor', async () => {
      mockPrisma.pod.findUnique.mockResolvedValue(makePodWithAllRoles());
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'USR-lrn001', role: 'Learner' });

      await expect(
        service.activatePod('POD-abc123', { assessor_id: 'USR-lrn001' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when pod does not exist', async () => {
      mockPrisma.pod.findUnique.mockResolvedValue(null);

      await expect(
        service.activatePod('POD-missing', { assessor_id: 'USR-asr001' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when pod is already active', async () => {
      mockPrisma.pod.findUnique.mockResolvedValue({
        ...makePodWithAllRoles(),
        status: 'active',
      });

      await expect(
        service.activatePod('POD-abc123', { assessor_id: 'USR-asr001' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when assessor user does not exist', async () => {
      mockPrisma.pod.findUnique.mockResolvedValue(makePodWithAllRoles());
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.activatePod('POD-abc123', { assessor_id: 'USR-missing' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── Pod reassignment ───────────────────────────────────────────

  describe('reassignPodMembers', () => {
    it('should reassign members to active pods with matching vacancies and disband original', async () => {
      // Pod missing CybersecurityAISecurity and IndustrySpecialist
      mockPrisma.pod.findUnique.mockResolvedValue({
        id: 'POD-weak01',
        track_id: 'TRK-abc123',
        status: 'active',
        members: [
          { id: 'PDM-001', role: 'ProductManager', learner_id: 'LRN-001' },
          { id: 'PDM-002', role: 'DataScientist', learner_id: 'LRN-002' },
          { id: 'PDM-003', role: 'AIEngineer', learner_id: 'LRN-003' },
        ],
      });
      // Target pod that can accept these roles
      mockPrisma.pod.findMany.mockResolvedValue([
        {
          id: 'POD-target1',
          track_id: 'TRK-abc123',
          status: 'active',
          members: [
            { id: 'PDM-010', role: 'CybersecurityAISecurity', learner_id: 'LRN-010' },
            { id: 'PDM-011', role: 'IndustrySpecialist', learner_id: 'LRN-011' },
          ],
        },
      ]);
      mockPrisma.podMember.update.mockResolvedValue({});
      mockPrisma.pod.update.mockResolvedValue({});

      const result = await service.reassignPodMembers('POD-weak01');

      expect(result.disbanded_pod_id).toBe('POD-weak01');
      expect(result.reassigned_members.length).toBeGreaterThan(0);
      expect(mockPrisma.pod.update).toHaveBeenCalledWith({
        where: { id: 'POD-weak01' },
        data: { status: 'disbanded' },
      });
    });

    it('should throw BadRequestException when pod has all standard roles', async () => {
      mockPrisma.pod.findUnique.mockResolvedValue({
        id: 'POD-full01',
        track_id: 'TRK-abc123',
        status: 'active',
        members: [
          { id: 'PDM-001', role: 'ProductManager', learner_id: 'LRN-001' },
          { id: 'PDM-002', role: 'DataScientist', learner_id: 'LRN-002' },
          { id: 'PDM-003', role: 'AIEngineer', learner_id: 'LRN-003' },
          { id: 'PDM-004', role: 'CybersecurityAISecurity', learner_id: 'LRN-004' },
          { id: 'PDM-005', role: 'IndustrySpecialist', learner_id: 'LRN-005' },
        ],
      });

      await expect(service.reassignPodMembers('POD-full01')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when pod does not exist', async () => {
      mockPrisma.pod.findUnique.mockResolvedValue(null);

      await expect(service.reassignPodMembers('POD-missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── POST /enrollment/gates/:gateId/evaluate ────────────────────

  describe('evaluateGate', () => {
    const makeGateWithContext = (overrides: Record<string, any> = {}) => ({
      id: 'PGT-gate01',
      module_id: 'MOD-mod01',
      threshold_score: 70,
      max_attempts: 2,
      ...overrides,
      module: {
        id: 'MOD-mod01',
        title: 'Python for AI',
        sequence: 1,
        level: {
          id: 'LVL-beg01',
          tier: 'Beginner',
          sequence: 1,
          modules: [
            { id: 'MOD-mod01', title: 'Python for AI', sequence: 1 },
            { id: 'MOD-mod02', title: 'REST APIs', sequence: 2 },
          ],
          track: {
            id: 'TRK-abc123',
            name: 'AI Engineering and Intelligent Systems',
            levels: [
              {
                id: 'LVL-beg01',
                tier: 'Beginner',
                sequence: 1,
                modules: [{ id: 'MOD-mod01', title: 'Python for AI' }],
              },
              {
                id: 'LVL-int01',
                tier: 'Intermediate',
                sequence: 2,
                modules: [{ id: 'MOD-mid01', title: 'RAG Pipelines' }],
              },
            ],
          },
        },
        ...(overrides.module ?? {}),
      },
    });

    it('should pass gate and unlock next module when score meets threshold', async () => {
      mockPrisma.performanceGate.findUnique.mockResolvedValue(makeGateWithContext());
      mockPrisma.gateAttempt.count.mockResolvedValue(0);
      mockPrisma.gateAttempt.create.mockImplementation(({ data }) => data);

      const result = await service.evaluateGate('PGT-gate01', {
        learner_id: 'LRN-abc123',
        score: 85,
      });

      expect(result.passed).toBe(true);
      expect(result.score).toBe(85);
      expect(result.attempt_number).toBe(1);
      expect(result.next_action).toBe('unlock');
      expect(result.unlock).toEqual({
        type: 'module',
        level_id: 'LVL-beg01',
        level_tier: 'Beginner',
        module_id: 'MOD-mod02',
        module_title: 'REST APIs',
      });
      expect(result.attempt_id).toMatch(/^GTA-[a-f0-9]{6}$/);
    });

    it('should pass gate and unlock next level when last module in level', async () => {
      const gate = makeGateWithContext();
      // Make this the last module in the level
      gate.module.sequence = 2;
      gate.module.id = 'MOD-mod02';
      gate.module.level.modules = [
        { id: 'MOD-mod01', title: 'Python for AI', sequence: 1 },
        { id: 'MOD-mod02', title: 'REST APIs', sequence: 2 },
      ];

      mockPrisma.performanceGate.findUnique.mockResolvedValue(gate);
      mockPrisma.gateAttempt.count.mockResolvedValue(0);
      mockPrisma.gateAttempt.create.mockImplementation(({ data }) => data);

      const result = await service.evaluateGate('PGT-gate01', {
        learner_id: 'LRN-abc123',
        score: 75,
      });

      expect(result.passed).toBe(true);
      expect(result.next_action).toBe('unlock');
      expect(result.unlock).toEqual({
        type: 'level',
        level_id: 'LVL-int01',
        level_tier: 'Intermediate',
        module_id: 'MOD-mid01',
        module_title: 'RAG Pipelines',
      });
    });

    it('should fail gate with remaining attempts and offer reassessment', async () => {
      mockPrisma.performanceGate.findUnique.mockResolvedValue(makeGateWithContext());
      mockPrisma.gateAttempt.count.mockResolvedValue(0);
      mockPrisma.gateAttempt.create.mockImplementation(({ data }) => data);

      const result = await service.evaluateGate('PGT-gate01', {
        learner_id: 'LRN-abc123',
        score: 50,
      });

      expect(result.passed).toBe(false);
      expect(result.score).toBe(50);
      expect(result.attempt_number).toBe(1);
      expect(result.next_action).toBe('reassessment');
      expect(result.remaining_attempts).toBe(1);
    });

    it('should fail gate on second attempt and require module repeat', async () => {
      mockPrisma.performanceGate.findUnique.mockResolvedValue(makeGateWithContext());
      mockPrisma.gateAttempt.count.mockResolvedValue(1); // 1 previous attempt
      mockPrisma.gateAttempt.create.mockImplementation(({ data }) => data);

      const result = await service.evaluateGate('PGT-gate01', {
        learner_id: 'LRN-abc123',
        score: 60,
      });

      expect(result.passed).toBe(false);
      expect(result.attempt_number).toBe(2);
      expect(result.next_action).toBe('module_repeat');
      expect(result.remaining_attempts).toBe(0);
    });

    it('should throw BadRequestException when max attempts exhausted', async () => {
      mockPrisma.performanceGate.findUnique.mockResolvedValue(makeGateWithContext());
      mockPrisma.gateAttempt.count.mockResolvedValue(2); // Already used both attempts

      await expect(
        service.evaluateGate('PGT-gate01', {
          learner_id: 'LRN-abc123',
          score: 90,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when gate does not exist', async () => {
      mockPrisma.performanceGate.findUnique.mockResolvedValue(null);

      await expect(
        service.evaluateGate('PGT-missing', {
          learner_id: 'LRN-abc123',
          score: 80,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should record GateAttempt with GTA-* ID', async () => {
      mockPrisma.performanceGate.findUnique.mockResolvedValue(makeGateWithContext());
      mockPrisma.gateAttempt.count.mockResolvedValue(0);
      mockPrisma.gateAttempt.create.mockImplementation(({ data }) => data);

      await service.evaluateGate('PGT-gate01', {
        learner_id: 'LRN-abc123',
        score: 85,
      });

      const createCall = mockPrisma.gateAttempt.create.mock.calls[0][0];
      expect(createCall.data.id).toMatch(/^GTA-[a-f0-9]{6}$/);
      expect(createCall.data.gate_id).toBe('PGT-gate01');
      expect(createCall.data.learner_id).toBe('LRN-abc123');
      expect(createCall.data.score).toBe(85);
      expect(createCall.data.passed).toBe(true);
      expect(createCall.data.attempt_number).toBe(1);
    });
  });

  // ── GET /enrollment/progress ───────────────────────────────────

  describe('getLearnerProgress', () => {
    const makeEnrollmentWithTrack = () => ({
      id: 'ENR-enr001',
      learner_id: 'LRN-abc123',
      track_id: 'TRK-abc123',
      status: 'active',
      enrolled_at: new Date('2025-01-01'),
      track: {
        id: 'TRK-abc123',
        name: 'AI Engineering and Intelligent Systems',
        levels: [
          {
            id: 'LVL-beg01',
            tier: 'Beginner',
            sequence: 1,
            modules: [
              {
                id: 'MOD-mod01',
                title: 'Python for AI',
                sequence: 1,
                performance_gates: [
                  {
                    id: 'PGT-gate01',
                    threshold_score: 70,
                    max_attempts: 2,
                    attempts: [
                      { id: 'GTA-att01', score: 85, passed: true, attempt_number: 1 },
                    ],
                  },
                ],
              },
              {
                id: 'MOD-mod02',
                title: 'REST APIs',
                sequence: 2,
                performance_gates: [
                  {
                    id: 'PGT-gate02',
                    threshold_score: 70,
                    max_attempts: 2,
                    attempts: [],
                  },
                ],
              },
            ],
          },
          {
            id: 'LVL-int01',
            tier: 'Intermediate',
            sequence: 2,
            modules: [
              {
                id: 'MOD-mid01',
                title: 'RAG Pipelines',
                sequence: 1,
                performance_gates: [
                  {
                    id: 'PGT-gate03',
                    threshold_score: 75,
                    max_attempts: 2,
                    attempts: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    it('should return progress with current level/module and completion percentage', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findMany.mockResolvedValue([makeEnrollmentWithTrack()]);
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);

      const result = await service.getLearnerProgress('LRN-abc123');

      expect(result.learner_id).toBe('LRN-abc123');
      expect(result.tracks).toHaveLength(1);

      const track = result.tracks[0] as any;
      expect(track.track_name).toBe('AI Engineering and Intelligent Systems');
      expect(track.completion_percentage).toBe(33); // 1 of 3 modules completed
      expect(track.completed_modules).toBe(1);
      expect(track.total_modules).toBe(3);
      expect(track.current_level).toEqual({ id: 'LVL-beg01', tier: 'Beginner' });
      expect(track.current_module).toEqual({ id: 'MOD-mod02', title: 'REST APIs' });
      expect(track.gate_results).toHaveLength(3);
    });

    it('should return cached progress when available', async () => {
      const cachedProgress = {
        enrollment_id: 'ENR-enr001',
        track_id: 'TRK-abc123',
        track_name: 'AI Engineering',
        completion_percentage: 50,
      };
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findMany.mockResolvedValue([makeEnrollmentWithTrack()]);
      mockCache.get.mockResolvedValue(cachedProgress);

      const result = await service.getLearnerProgress('LRN-abc123');

      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0]).toEqual(cachedProgress);
      // Should not have called cache.set since we got a cache hit
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should cache progress with 2 min TTL', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findMany.mockResolvedValue([makeEnrollmentWithTrack()]);
      mockCache.get.mockResolvedValue(null);
      mockCache.set.mockResolvedValue(undefined);

      await service.getLearnerProgress('LRN-abc123');

      expect(mockCache.set).toHaveBeenCalledWith(
        'progress:LRN-abc123:TRK-abc123',
        expect.any(Object),
        120,
      );
    });

    it('should throw NotFoundException when learner does not exist', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(null);

      await expect(
        service.getLearnerProgress('LRN-missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return empty tracks array when learner has no enrollments', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findMany.mockResolvedValue([]);

      const result = await service.getLearnerProgress('LRN-abc123');

      expect(result.learner_id).toBe('LRN-abc123');
      expect(result.tracks).toHaveLength(0);
    });
  });
});
