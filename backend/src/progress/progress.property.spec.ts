/**
 * @file progress.property.spec.ts
 * Property-based tests for learner progress auth isolation.
 * Verifies that the progress service only returns and accepts writes
 * for the authenticated learner's own records — requests targeting
 * another learner's records are never served.
 *
 * **Validates: Requirements 6.6**
 */
import { Test, TestingModule } from '@nestjs/testing';
import * as fc from 'fast-check';
import { ForbiddenException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
import { PrismaService } from '@common/prisma/prisma.service';

// ── Mock helpers ────────────────────────────────────────────────

const mockPrisma = {
  learnerLessonProgress: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

// ── Generators ──────────────────────────────────────────────────

/** Learner ID with domain prefix. */
const learnerIdArb = fc
  .string({ minLength: 3, maxLength: 20, unit: 'grapheme-ascii' })
  .filter((s) => s.trim().length > 0)
  .map((s) => `LRN-${s}`);

/** Lesson ID with domain prefix. */
const lessonIdArb = fc
  .string({ minLength: 3, maxLength: 20, unit: 'grapheme-ascii' })
  .filter((s) => s.trim().length > 0)
  .map((s) => `LSN-${s}`);

/** Arbitrary save-progress payload. */
const payloadArb = fc.record({
  active_tab: fc.constantFrom('learn', 'practice', 'deliverable', 'mcq'),
  code_value: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  mcq_score: fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
});

/** Two distinct learner IDs guaranteed to differ. */
const distinctLearnerPairArb = fc
  .tuple(learnerIdArb, learnerIdArb)
  .filter(([a, b]) => a !== b);


// ── Property 13: Progress Auth Isolation ────────────────────────

describe('Property 13: Progress Auth Isolation', () => {
  let controller: ProgressController;
  let service: ProgressService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<ProgressController>(ProgressController);
    service = module.get<ProgressService>(ProgressService);
  });

  // ── Service: getAllProgress only returns records for the given learner ──

  it('getAllProgress returns only records belonging to the requested learner', async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctLearnerPairArb,
        lessonIdArb,
        async ([authenticatedLearner, otherLearner], lessonId) => {
          jest.clearAllMocks();

          const ownRecord = {
            id: 'PRG-own',
            learner_id: authenticatedLearner,
            lesson_id: lessonId,
            active_tab: 'learn',
            submitted: false,
            updated_at: new Date(),
          };

          // Prisma findMany is called with a where clause scoped to the learner
          mockPrisma.learnerLessonProgress.findMany.mockResolvedValue([ownRecord]);

          const results = await service.getAllProgress(authenticatedLearner);

          // Verify Prisma was queried with the authenticated learner's ID
          const findManyCall = mockPrisma.learnerLessonProgress.findMany.mock.calls[0][0];
          expect(findManyCall.where.learner_id).toBe(authenticatedLearner);

          // All returned records belong to the authenticated learner
          for (const record of results) {
            expect(record.learner_id).toBe(authenticatedLearner);
            expect(record.learner_id).not.toBe(otherLearner);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // ── Service: saveProgress writes only for the given learner ──

  it('saveProgress creates/updates records scoped to the authenticated learner only', async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctLearnerPairArb,
        lessonIdArb,
        payloadArb,
        async ([authenticatedLearner, otherLearner], lessonId, payload) => {
          jest.clearAllMocks();

          // No existing record — triggers create path
          mockPrisma.learnerLessonProgress.findUnique.mockResolvedValue(null);

          const createdRecord = {
            id: 'PRG-new',
            learner_id: authenticatedLearner,
            lesson_id: lessonId,
            active_tab: payload.active_tab,
            submitted: false,
            updated_at: new Date(),
          };
          mockPrisma.learnerLessonProgress.create.mockResolvedValue(createdRecord);

          const result = await service.saveProgress(authenticatedLearner, lessonId, payload);

          // Verify the lookup used the authenticated learner's ID
          const findCall = mockPrisma.learnerLessonProgress.findUnique.mock.calls[0][0];
          expect(findCall.where.learner_id_lesson_id.learner_id).toBe(authenticatedLearner);

          // Verify the created record is scoped to the authenticated learner
          const createCall = mockPrisma.learnerLessonProgress.create.mock.calls[0][0];
          expect(createCall.data.learner_id).toBe(authenticatedLearner);
          expect(createCall.data.learner_id).not.toBe(otherLearner);

          // Returned record belongs to the authenticated learner
          expect(result.learner_id).toBe(authenticatedLearner);
        },
      ),
      { numRuns: 100 },
    );
  });

  // ── Service: markCompleted writes only for the given learner ──

  it('markCompleted sets submitted=true scoped to the authenticated learner only', async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctLearnerPairArb,
        lessonIdArb,
        async ([authenticatedLearner, otherLearner], lessonId) => {
          jest.clearAllMocks();

          const existingRecord = {
            id: 'PRG-existing',
            learner_id: authenticatedLearner,
            lesson_id: lessonId,
            submitted: false,
            updated_at: new Date(),
          };

          mockPrisma.learnerLessonProgress.findUnique.mockResolvedValue(existingRecord);
          mockPrisma.learnerLessonProgress.update.mockResolvedValue({
            ...existingRecord,
            submitted: true,
            updated_at: new Date(),
          });

          const result = await service.markCompleted(authenticatedLearner, lessonId);

          // Verify the lookup used the authenticated learner's ID
          const findCall = mockPrisma.learnerLessonProgress.findUnique.mock.calls[0][0];
          expect(findCall.where.learner_id_lesson_id.learner_id).toBe(authenticatedLearner);

          // The update targeted the correct record
          const updateCall = mockPrisma.learnerLessonProgress.update.mock.calls[0][0];
          expect(updateCall.data.submitted).toBe(true);

          // Returned record belongs to the authenticated learner
          expect(result.learner_id).toBe(authenticatedLearner);
          expect(result.learner_id).not.toBe(otherLearner);
        },
      ),
      { numRuns: 100 },
    );
  });

  // ── Controller: extractLearnerId rejects non-learner users ──

  it('controller rejects requests from users without a learnerId', async () => {
    await fc.assert(
      fc.asyncProperty(lessonIdArb, async (lessonId) => {
        jest.clearAllMocks();

        // Request from a user with no learnerId (e.g. admin, instructor)
        const req = {
          user: { id: 'USR-admin', role: 'admin' },
        } as any;

        await expect(
          controller.getAllProgress(req),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          controller.saveProgress(lessonId, { active_tab: 'learn' }, req),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          controller.markCompleted(lessonId, req),
        ).rejects.toThrow(ForbiddenException);
      }),
      { numRuns: 100 },
    );
  });

  // ── Controller: routes requests using only the JWT learner ID ──

  it('controller always uses the JWT learnerId, never a body-supplied learner ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        distinctLearnerPairArb,
        lessonIdArb,
        payloadArb,
        async ([jwtLearnerId, bodyLearnerId], lessonId, payload) => {
          jest.clearAllMocks();

          // Simulate an attacker sending a different learner_id in the body
          const maliciousPayload = { ...payload, learner_id: bodyLearnerId };

          const req = {
            user: { id: 'USR-123', role: 'learner', learnerId: jwtLearnerId },
          } as any;

          mockPrisma.learnerLessonProgress.findUnique.mockResolvedValue(null);
          mockPrisma.learnerLessonProgress.create.mockResolvedValue({
            id: 'PRG-new',
            learner_id: jwtLearnerId,
            lesson_id: lessonId,
            active_tab: payload.active_tab,
            submitted: false,
            updated_at: new Date(),
          });

          await controller.saveProgress(lessonId, maliciousPayload, req);

          // The service was called with the JWT learner ID, not the body one
          const createCall = mockPrisma.learnerLessonProgress.create.mock.calls[0][0];
          expect(createCall.data.learner_id).toBe(jwtLearnerId);
          expect(createCall.data.learner_id).not.toBe(bodyLearnerId);
        },
      ),
      { numRuns: 100 },
    );
  });
});
