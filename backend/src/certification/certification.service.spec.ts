import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CertificationService } from './certification.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { EmailService } from '@email/email.service';

const mockEmailService = {
  sendCertificateIssuedEmail: jest.fn().mockResolvedValue(undefined),
};

const mockPrisma = {
  learner: { findUnique: jest.fn() },
  enrollment: { findFirst: jest.fn() },
  capstone: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  level: { findMany: jest.fn() },
  gateAttempt: { findFirst: jest.fn() },
  user: { findUnique: jest.fn() },
  capstoneDefense: {
    create: jest.fn(),
    count: jest.fn(),
  },
  track: { findUnique: jest.fn() },
  foundationProgress: { findUnique: jest.fn() },
  certificationEligibility: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  installment: { count: jest.fn() },
  certificate: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('CertificationService', () => {
  let service: CertificationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<CertificationService>(CertificationService);
  });

  // ── unlockCapstone ─────────────────────────────────────────────

  describe('unlockCapstone', () => {
    const baseDto = {
      learner_id: 'LRN-abc123',
      track_id: 'TRK-ai0001',
      assessor_id: 'USR-asr001',
    };

    const advancedLevelsWithGates = [
      {
        id: 'LVL-adv001',
        modules: [
          {
            id: 'MOD-adv01',
            performance_gates: [{ id: 'PGT-adv01' }, { id: 'PGT-adv02' }],
          },
        ],
      },
    ];

    function setupHappyPath() {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findFirst.mockResolvedValue({
        id: 'ENR-001',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        status: 'active',
      });
      mockPrisma.capstone.findFirst.mockResolvedValue(null);
      mockPrisma.level.findMany.mockResolvedValue(advancedLevelsWithGates);
      mockPrisma.gateAttempt.findFirst.mockResolvedValue({
        id: 'GTA-001',
        passed: true,
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'USR-asr001',
        role: 'Assessor',
      });
      mockPrisma.capstone.create.mockImplementation(({ data }) => ({
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      }));
    }

    it('should unlock capstone when all Advanced gates passed and assessor validates', async () => {
      setupHappyPath();

      const result = await service.unlockCapstone(baseDto);

      expect(result.id).toMatch(/^CPS-[a-f0-9]{6}$/);
      expect(result.learner_id).toBe('LRN-abc123');
      expect(result.track_id).toBe('TRK-ai0001');
      expect(result.status).toBe('unlocked');
    });

    it('should throw NotFoundException when learner does not exist', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(null);

      await expect(service.unlockCapstone(baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when learner has no active enrollment', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findFirst.mockResolvedValue(null);

      await expect(service.unlockCapstone(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when capstone already exists', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'ENR-001' });
      mockPrisma.capstone.findFirst.mockResolvedValue({
        id: 'CPS-exists',
        status: 'unlocked',
      });

      await expect(service.unlockCapstone(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException when Advanced gate not passed', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'ENR-001' });
      mockPrisma.capstone.findFirst.mockResolvedValue(null);
      mockPrisma.level.findMany.mockResolvedValue(advancedLevelsWithGates);
      // First gate passes, second gate fails
      mockPrisma.gateAttempt.findFirst
        .mockResolvedValueOnce({ id: 'GTA-001', passed: true })
        .mockResolvedValueOnce(null);

      await expect(service.unlockCapstone(baseDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when no Advanced levels exist', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'ENR-001' });
      mockPrisma.capstone.findFirst.mockResolvedValue(null);
      mockPrisma.level.findMany.mockResolvedValue([]);

      await expect(service.unlockCapstone(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when assessor does not exist', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'ENR-001' });
      mockPrisma.capstone.findFirst.mockResolvedValue(null);
      mockPrisma.level.findMany.mockResolvedValue(advancedLevelsWithGates);
      mockPrisma.gateAttempt.findFirst.mockResolvedValue({ passed: true });
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.unlockCapstone(baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user is not an Assessor', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'ENR-001' });
      mockPrisma.capstone.findFirst.mockResolvedValue(null);
      mockPrisma.level.findMany.mockResolvedValue(advancedLevelsWithGates);
      mockPrisma.gateAttempt.findFirst.mockResolvedValue({ passed: true });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'USR-asr001',
        role: 'Learner',
      });

      await expect(service.unlockCapstone(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });


  // ── submitCapstone ─────────────────────────────────────────────

  describe('submitCapstone', () => {
    const submitDto = { learner_id: 'LRN-abc123', content: 'My capstone project' };

    it('should submit capstone when status is unlocked', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-sub001',
        learner_id: 'LRN-abc123',
        status: 'unlocked',
        defenses: [],
      });
      mockPrisma.capstone.update.mockResolvedValue({
        id: 'CPS-sub001',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        status: 'submitted',
        submitted_at: new Date(),
      });

      const result = await service.submitCapstone('CPS-sub001', submitDto);

      expect(result.status).toBe('submitted');
      expect(result.submitted_at).toBeDefined();
      expect(mockPrisma.capstone.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'CPS-sub001' },
          data: expect.objectContaining({ status: 'submitted' }),
        }),
      );
    });

    it('should throw NotFoundException when capstone does not exist', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue(null);

      await expect(
        service.submitCapstone('CPS-nonexist', submitDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when capstone belongs to different learner', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-sub001',
        learner_id: 'LRN-other99',
        status: 'unlocked',
        defenses: [],
      });

      await expect(
        service.submitCapstone('CPS-sub001', submitDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when capstone is in locked status', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-sub001',
        learner_id: 'LRN-abc123',
        status: 'locked',
        defenses: [],
      });

      await expect(
        service.submitCapstone('CPS-sub001', submitDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow resubmission after failed defense within 30-day window', async () => {
      const submittedAt = new Date();
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-sub001',
        learner_id: 'LRN-abc123',
        status: 'evaluated',
        submitted_at: submittedAt,
        defenses: [{ result: 'fail', created_at: new Date() }],
      });
      mockPrisma.capstoneDefense.count.mockResolvedValue(1);
      mockPrisma.capstone.update.mockResolvedValue({
        id: 'CPS-sub001',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        status: 'submitted',
        submitted_at: new Date(),
      });

      const result = await service.submitCapstone('CPS-sub001', submitDto);

      expect(result.status).toBe('submitted');
    });

    it('should reject resubmission when defense result was pass', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-sub001',
        learner_id: 'LRN-abc123',
        status: 'evaluated',
        submitted_at: new Date(),
        defenses: [{ result: 'pass', created_at: new Date() }],
      });

      await expect(
        service.submitCapstone('CPS-sub001', submitDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject resubmission when max resubmissions reached (2 defenses)', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-sub001',
        learner_id: 'LRN-abc123',
        status: 'evaluated',
        submitted_at: new Date(),
        defenses: [{ result: 'fail', created_at: new Date() }],
      });
      mockPrisma.capstoneDefense.count.mockResolvedValue(2);

      await expect(
        service.submitCapstone('CPS-sub001', submitDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject resubmission when 30-day window has expired', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-sub001',
        learner_id: 'LRN-abc123',
        status: 'evaluated',
        submitted_at: oldDate,
        defenses: [{ result: 'fail', created_at: new Date() }],
      });
      mockPrisma.capstoneDefense.count.mockResolvedValue(1);

      await expect(
        service.submitCapstone('CPS-sub001', submitDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── evaluateCapstone ───────────────────────────────────────────

  describe('evaluateCapstone', () => {
    const now = new Date();
    const scheduledWithin14Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const evaluateDto = {
      panel_assessor_ids: ['USR-asr001', 'USR-asr002'],
      scheduled_at: scheduledWithin14Days.toISOString(),
      result: 'pass' as const,
      feedback: 'Excellent capstone defense.',
    };

    it('should evaluate capstone with pass result and create defense record', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-eval01',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        status: 'submitted',
        submitted_at: now,
      });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'USR-asr001', role: 'Assessor' })
        .mockResolvedValueOnce({ id: 'USR-asr002', role: 'Assessor' });
      mockPrisma.capstoneDefense.create.mockImplementation(({ data }) => ({
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      }));
      mockPrisma.capstone.update.mockResolvedValue({
        id: 'CPS-eval01',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        status: 'evaluated',
        result: 'pass',
        feedback: 'Excellent capstone defense.',
      });

      const result = await service.evaluateCapstone('CPS-eval01', evaluateDto);

      expect(result.capstone.status).toBe('evaluated');
      expect(result.capstone.result).toBe('pass');
      expect(result.defense.id).toMatch(/^DEF-[a-f0-9]{6}$/);
      expect(result.defense.panel_assessor_ids).toEqual(['USR-asr001', 'USR-asr002']);
    });

    it('should evaluate capstone with fail result', async () => {
      const failDto = { ...evaluateDto, result: 'fail' as const, feedback: 'Needs improvement.' };
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-eval01',
        status: 'submitted',
        submitted_at: now,
      });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'USR-asr001', role: 'Assessor' })
        .mockResolvedValueOnce({ id: 'USR-asr002', role: 'Assessor' });
      mockPrisma.capstoneDefense.create.mockImplementation(({ data }) => ({
        ...data,
        created_at: new Date(),
      }));
      mockPrisma.capstone.update.mockResolvedValue({
        id: 'CPS-eval01',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        status: 'evaluated',
        result: 'fail',
        feedback: 'Needs improvement.',
      });

      const result = await service.evaluateCapstone('CPS-eval01', failDto);

      expect(result.capstone.result).toBe('fail');
      expect(result.defense.result).toBe('fail');
    });

    it('should throw NotFoundException when capstone does not exist', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue(null);

      await expect(
        service.evaluateCapstone('CPS-nonexist', evaluateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when capstone is not in submitted status', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-eval01',
        status: 'unlocked',
      });

      await expect(
        service.evaluateCapstone('CPS-eval01', evaluateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when a panel assessor does not exist', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-eval01',
        status: 'submitted',
        submitted_at: now,
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.evaluateCapstone('CPS-eval01', evaluateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when panel member is not Assessor or Admin', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-eval01',
        status: 'submitted',
        submitted_at: now,
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'USR-asr001',
        role: 'Learner',
      });

      await expect(
        service.evaluateCapstone('CPS-eval01', evaluateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when defense scheduled beyond 14 days', async () => {
      const tooLate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
      const lateDto = { ...evaluateDto, scheduled_at: tooLate.toISOString() };

      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-eval01',
        status: 'submitted',
        submitted_at: now,
      });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'USR-asr001', role: 'Assessor' })
        .mockResolvedValueOnce({ id: 'USR-asr002', role: 'Assessor' });

      await expect(
        service.evaluateCapstone('CPS-eval01', lateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow Admin role on defense panel', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-eval01',
        status: 'submitted',
        submitted_at: now,
      });
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: 'USR-asr001', role: 'Assessor' })
        .mockResolvedValueOnce({ id: 'USR-adm001', role: 'Admin' });
      mockPrisma.capstoneDefense.create.mockImplementation(({ data }) => ({
        ...data,
        created_at: new Date(),
      }));
      mockPrisma.capstone.update.mockResolvedValue({
        id: 'CPS-eval01',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        status: 'evaluated',
        result: 'pass',
        feedback: 'Excellent capstone defense.',
      });

      const result = await service.evaluateCapstone('CPS-eval01', evaluateDto);

      expect(result.capstone.status).toBe('evaluated');
    });
  });

  // ── getCapstone ────────────────────────────────────────────────

  describe('getCapstone', () => {
    it('should return capstone details with defenses', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue({
        id: 'CPS-get001',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        status: 'evaluated',
        submitted_at: new Date(),
        result: 'pass',
        feedback: 'Great work',
        created_at: new Date(),
        defenses: [
          {
            id: 'DEF-def001',
            panel_assessor_ids: ['USR-asr001', 'USR-asr002'],
            scheduled_at: new Date(),
            result: 'pass',
            feedback: 'Great work',
            created_at: new Date(),
          },
        ],
      });

      const result = await service.getCapstone('CPS-get001');

      expect(result.id).toBe('CPS-get001');
      expect(result.status).toBe('evaluated');
      expect(result.defenses).toHaveLength(1);
      expect(result.defenses[0].id).toBe('DEF-def001');
      expect(result.defenses[0].panel_assessor_ids).toEqual([
        'USR-asr001',
        'USR-asr002',
      ]);
    });

    it('should throw NotFoundException when capstone does not exist', async () => {
      mockPrisma.capstone.findUnique.mockResolvedValue(null);

      await expect(service.getCapstone('CPS-nonexist')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── checkEligibility ───────────────────────────────────────────

  describe('checkEligibility', () => {
    const eligibilityDto = {
      learner_id: 'LRN-abc123',
      track_id: 'TRK-ai0001',
    };

    const levelsWithGates = [
      {
        id: 'LVL-beg001',
        tier: 'Beginner',
        modules: [
          { id: 'MOD-beg01', performance_gates: [{ id: 'PGT-beg01' }] },
        ],
      },
      {
        id: 'LVL-int001',
        tier: 'Intermediate',
        modules: [
          { id: 'MOD-int01', performance_gates: [{ id: 'PGT-int01' }] },
        ],
      },
      {
        id: 'LVL-adv001',
        tier: 'Advanced',
        modules: [
          { id: 'MOD-adv01', performance_gates: [{ id: 'PGT-adv01' }] },
        ],
      },
    ];

    function setupFullyEligible() {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.track.findUnique.mockResolvedValue({ id: 'TRK-ai0001', name: 'AI Engineering' });
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        learner_id: 'LRN-abc123',
        completed: true,
      });
      mockPrisma.level.findMany.mockResolvedValue(levelsWithGates);
      mockPrisma.gateAttempt.findFirst.mockResolvedValue({ passed: true });
      mockPrisma.certificationEligibility.findFirst.mockResolvedValue({
        id: 'CEL-exist1',
        pod_deliverables_complete: true,
        assessor_approved: true,
      });
      mockPrisma.capstone.findFirst.mockResolvedValue({ id: 'CPS-001', result: 'pass' });
      mockPrisma.enrollment.findFirst.mockResolvedValue({ id: 'ENR-001' });
      mockPrisma.installment.count.mockResolvedValue(0);
      mockPrisma.certificationEligibility.update.mockImplementation(({ data }) => ({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        ...data,
      }));
    }

    it('should return eligible=true when all 6 conditions are met', async () => {
      setupFullyEligible();

      const result = await service.checkEligibility(eligibilityDto);

      expect(result.eligible).toBe(true);
      expect(result.foundation_complete).toBe(true);
      expect(result.levels_complete).toBe(true);
      expect(result.pod_deliverables_complete).toBe(true);
      expect(result.capstone_passed).toBe(true);
      expect(result.assessor_approved).toBe(true);
      expect(result.payment_cleared).toBe(true);
    });

    it('should return eligible=false when Foundation is incomplete', async () => {
      setupFullyEligible();
      mockPrisma.foundationProgress.findUnique.mockResolvedValue({
        learner_id: 'LRN-abc123',
        completed: false,
      });
      mockPrisma.certificationEligibility.update.mockImplementation(({ data }) => ({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        ...data,
      }));

      const result = await service.checkEligibility(eligibilityDto);

      expect(result.eligible).toBe(false);
      expect(result.foundation_complete).toBe(false);
    });

    it('should return eligible=false when assessor approval is missing', async () => {
      setupFullyEligible();
      mockPrisma.certificationEligibility.findFirst.mockResolvedValue({
        id: 'CEL-exist1',
        pod_deliverables_complete: true,
        assessor_approved: false,
      });
      mockPrisma.certificationEligibility.update.mockImplementation(({ data }) => ({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        ...data,
      }));

      const result = await service.checkEligibility(eligibilityDto);

      expect(result.eligible).toBe(false);
      expect(result.assessor_approved).toBe(false);
    });

    it('should return eligible=false when payment is outstanding', async () => {
      setupFullyEligible();
      mockPrisma.installment.count.mockResolvedValue(2);
      mockPrisma.certificationEligibility.update.mockImplementation(({ data }) => ({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        ...data,
      }));

      const result = await service.checkEligibility(eligibilityDto);

      expect(result.eligible).toBe(false);
      expect(result.payment_cleared).toBe(false);
    });

    it('should return eligible=false when capstone not passed', async () => {
      setupFullyEligible();
      mockPrisma.capstone.findFirst.mockResolvedValue(null);
      mockPrisma.certificationEligibility.update.mockImplementation(({ data }) => ({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        ...data,
      }));

      const result = await service.checkEligibility(eligibilityDto);

      expect(result.eligible).toBe(false);
      expect(result.capstone_passed).toBe(false);
    });

    it('should return eligible=false when levels are incomplete (gate not passed)', async () => {
      setupFullyEligible();
      // Second gate call returns null (not passed)
      mockPrisma.gateAttempt.findFirst
        .mockResolvedValueOnce({ passed: true })
        .mockResolvedValueOnce(null);
      mockPrisma.certificationEligibility.update.mockImplementation(({ data }) => ({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        ...data,
      }));

      const result = await service.checkEligibility(eligibilityDto);

      expect(result.eligible).toBe(false);
      expect(result.levels_complete).toBe(false);
    });

    it('should return eligible=false when pod deliverables are incomplete', async () => {
      setupFullyEligible();
      mockPrisma.certificationEligibility.findFirst.mockResolvedValue({
        id: 'CEL-exist1',
        pod_deliverables_complete: false,
        assessor_approved: true,
      });
      mockPrisma.certificationEligibility.update.mockImplementation(({ data }) => ({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        ...data,
      }));

      const result = await service.checkEligibility(eligibilityDto);

      expect(result.eligible).toBe(false);
      expect(result.pod_deliverables_complete).toBe(false);
    });

    it('should create a new CEL record when none exists', async () => {
      setupFullyEligible();
      mockPrisma.certificationEligibility.findFirst.mockResolvedValue(null);
      mockPrisma.certificationEligibility.create.mockImplementation(({ data }) => ({
        ...data,
      }));

      const result = await service.checkEligibility(eligibilityDto);

      expect(mockPrisma.certificationEligibility.create).toHaveBeenCalled();
      expect(result.id).toMatch(/^CEL-[a-f0-9]{6}$/);
      // pod_deliverables_complete and assessor_approved default to false when no CEL exists
      expect(result.pod_deliverables_complete).toBe(false);
      expect(result.assessor_approved).toBe(false);
      expect(result.eligible).toBe(false);
    });

    it('should throw NotFoundException when learner does not exist', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(null);

      await expect(service.checkEligibility(eligibilityDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when track does not exist', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue({ id: 'LRN-abc123' });
      mockPrisma.track.findUnique.mockResolvedValue(null);

      await expect(service.checkEligibility(eligibilityDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── approveEligibility ─────────────────────────────────────────

  describe('approveEligibility', () => {
    it('should set assessor_approved to true', async () => {
      mockPrisma.certificationEligibility.findUnique.mockResolvedValue({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        foundation_complete: true,
        levels_complete: true,
        pod_deliverables_complete: true,
        capstone_passed: true,
        assessor_approved: false,
        payment_cleared: true,
        eligible: false,
      });
      mockPrisma.certificationEligibility.update.mockImplementation(({ data }) => ({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        foundation_complete: true,
        levels_complete: true,
        pod_deliverables_complete: true,
        capstone_passed: true,
        payment_cleared: true,
        ...data,
      }));

      const result = await service.approveEligibility('CEL-exist1');

      expect(result.assessor_approved).toBe(true);
      expect(result.eligible).toBe(true);
    });

    it('should set pod_deliverables_complete when provided', async () => {
      mockPrisma.certificationEligibility.findUnique.mockResolvedValue({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        foundation_complete: true,
        levels_complete: true,
        pod_deliverables_complete: false,
        capstone_passed: true,
        assessor_approved: false,
        payment_cleared: true,
        eligible: false,
      });
      mockPrisma.certificationEligibility.update.mockImplementation(({ data }) => ({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        foundation_complete: true,
        levels_complete: true,
        capstone_passed: true,
        payment_cleared: true,
        ...data,
      }));

      const result = await service.approveEligibility('CEL-exist1', true);

      expect(result.pod_deliverables_complete).toBe(true);
      expect(result.assessor_approved).toBe(true);
      expect(result.eligible).toBe(true);
    });

    it('should throw NotFoundException when CEL record does not exist', async () => {
      mockPrisma.certificationEligibility.findUnique.mockResolvedValue(null);

      await expect(
        service.approveEligibility('CEL-nonexist'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── issueCertificate ───────────────────────────────────────────

  describe('issueCertificate', () => {
    const issueDto = {
      learner_id: 'LRN-abc123',
      track_id: 'TRK-ai0001',
    };

    function setupEligibleForIssuance() {
      mockPrisma.learner.findUnique.mockResolvedValue({
        id: 'LRN-abc123',
        user: { email: 'learner@example.com' },
      });
      mockPrisma.track.findUnique.mockResolvedValue({
        id: 'TRK-ai0001',
        name: 'AI Engineering',
      });
      mockPrisma.certificationEligibility.findFirst.mockResolvedValue({
        id: 'CEL-exist1',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        foundation_complete: true,
        levels_complete: true,
        pod_deliverables_complete: true,
        capstone_passed: true,
        assessor_approved: true,
        payment_cleared: true,
        eligible: true,
      });
      mockPrisma.certificate.findFirst.mockResolvedValue(null);
      mockPrisma.certificate.create.mockImplementation(({ data }) => ({
        ...data,
      }));
    }

    it('should issue certificate with CRT-* ID and KFCERT-* verification code', async () => {
      setupEligibleForIssuance();

      const result = await service.issueCertificate(issueDto);

      expect(result.id).toMatch(/^CRT-[a-f0-9]{6}$/);
      expect(result.verification_code).toMatch(
        /^KFCERT-\d{4}-[A-Z0-9]{8}$/,
      );
      expect(result.learner_id).toBe('LRN-abc123');
      expect(result.track_id).toBe('TRK-ai0001');
      expect(result.status).toBe('active');
      expect(result.track_name).toBe('AI Engineering');
    });

    it('should block issuance when not eligible (Foundation incomplete)', async () => {
      setupEligibleForIssuance();
      mockPrisma.certificationEligibility.findFirst.mockResolvedValue({
        id: 'CEL-exist1',
        eligible: false,
        foundation_complete: false,
        levels_complete: true,
        pod_deliverables_complete: true,
        capstone_passed: true,
        assessor_approved: true,
        payment_cleared: true,
      });

      await expect(service.issueCertificate(issueDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should block issuance when assessor approval is missing', async () => {
      setupEligibleForIssuance();
      mockPrisma.certificationEligibility.findFirst.mockResolvedValue({
        id: 'CEL-exist1',
        eligible: false,
        foundation_complete: true,
        levels_complete: true,
        pod_deliverables_complete: true,
        capstone_passed: true,
        assessor_approved: false,
        payment_cleared: true,
      });

      await expect(service.issueCertificate(issueDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should block issuance when payment is outstanding', async () => {
      setupEligibleForIssuance();
      mockPrisma.certificationEligibility.findFirst.mockResolvedValue({
        id: 'CEL-exist1',
        eligible: false,
        foundation_complete: true,
        levels_complete: true,
        pod_deliverables_complete: true,
        capstone_passed: true,
        assessor_approved: true,
        payment_cleared: false,
      });

      await expect(service.issueCertificate(issueDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should block issuance for attendance-only learner (levels incomplete)', async () => {
      setupEligibleForIssuance();
      mockPrisma.certificationEligibility.findFirst.mockResolvedValue({
        id: 'CEL-exist1',
        eligible: false,
        foundation_complete: true,
        levels_complete: false,
        pod_deliverables_complete: false,
        capstone_passed: false,
        assessor_approved: false,
        payment_cleared: true,
      });

      await expect(service.issueCertificate(issueDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException when no eligibility record exists', async () => {
      setupEligibleForIssuance();
      mockPrisma.certificationEligibility.findFirst.mockResolvedValue(null);

      await expect(service.issueCertificate(issueDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when active certificate already exists', async () => {
      setupEligibleForIssuance();
      mockPrisma.certificate.findFirst.mockResolvedValue({
        id: 'CRT-exists',
        status: 'active',
      });

      await expect(service.issueCertificate(issueDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when learner does not exist', async () => {
      mockPrisma.learner.findUnique.mockResolvedValue(null);

      await expect(service.issueCertificate(issueDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── verifyCertificate ──────────────────────────────────────────

  describe('verifyCertificate', () => {
    it('should return valid=true with certificate details for active certificate', async () => {
      mockPrisma.certificate.findUnique.mockResolvedValue({
        id: 'CRT-abc123',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        verification_code: 'KFCERT-2026-A7X9K2M4',
        issued_at: new Date('2026-01-15'),
        status: 'active',
        revocation_reason: null,
        learner: { user: { email: 'learner@example.com' } },
        track: { name: 'AI Engineering' },
      });

      const result = await service.verifyCertificate('KFCERT-2026-A7X9K2M4');

      expect(result.valid).toBe(true);
      expect(result.status).toBe('active');
      expect(result.certificate_id).toBe('CRT-abc123');
      expect((result as any).learner_name).toBe('learner@example.com');
      expect((result as any).track_name).toBe('AI Engineering');
      expect((result as any).issued_at).toEqual(new Date('2026-01-15'));
    });

    it('should return valid=false with revocation reason for revoked certificate', async () => {
      mockPrisma.certificate.findUnique.mockResolvedValue({
        id: 'CRT-abc123',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        verification_code: 'KFCERT-2026-A7X9K2M4',
        issued_at: new Date('2026-01-15'),
        status: 'revoked',
        revocation_reason: 'Academic misconduct',
        learner: { user: { email: 'learner@example.com' } },
        track: { name: 'AI Engineering' },
      });

      const result = await service.verifyCertificate('KFCERT-2026-A7X9K2M4');

      expect(result.valid).toBe(false);
      expect(result.status).toBe('revoked');
      expect(result.certificate_id).toBe('CRT-abc123');
      expect((result as any).revocation_reason).toBe('Academic misconduct');
      expect(result).not.toHaveProperty('learner_name');
      expect(result).not.toHaveProperty('track_name');
    });

    it('should throw NotFoundException when verification code does not exist', async () => {
      mockPrisma.certificate.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyCertificate('KFCERT-2026-INVALID1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── revokeCertificate ──────────────────────────────────────────

  describe('revokeCertificate', () => {
    const revokeDto = { reason: 'Academic misconduct' };

    it('should revoke an active certificate and record the reason', async () => {
      mockPrisma.certificate.findUnique.mockResolvedValue({
        id: 'CRT-abc123',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        verification_code: 'KFCERT-2026-A7X9K2M4',
        status: 'active',
      });
      mockPrisma.certificate.update.mockResolvedValue({
        id: 'CRT-abc123',
        learner_id: 'LRN-abc123',
        track_id: 'TRK-ai0001',
        verification_code: 'KFCERT-2026-A7X9K2M4',
        status: 'revoked',
        revocation_reason: 'Academic misconduct',
      });

      const result = await service.revokeCertificate('CRT-abc123', revokeDto);

      expect(result.status).toBe('revoked');
      expect(result.revocation_reason).toBe('Academic misconduct');
      expect(mockPrisma.certificate.update).toHaveBeenCalledWith({
        where: { id: 'CRT-abc123' },
        data: { status: 'revoked', revocation_reason: 'Academic misconduct' },
      });
    });

    it('should throw NotFoundException when certificate does not exist', async () => {
      mockPrisma.certificate.findUnique.mockResolvedValue(null);

      await expect(
        service.revokeCertificate('CRT-nonexist', revokeDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when certificate is already revoked', async () => {
      mockPrisma.certificate.findUnique.mockResolvedValue({
        id: 'CRT-abc123',
        status: 'revoked',
      });

      await expect(
        service.revokeCertificate('CRT-abc123', revokeDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
