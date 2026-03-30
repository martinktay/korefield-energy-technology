/**
 * @file progress.service.ts
 * Service managing learner lesson progress persistence.
 * Provides upsert (save), mark-complete, and fetch-all operations
 * against the `learner_lesson_progress` table via Prisma.
 * All operations are scoped to the authenticated learner's own records.
 */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { generateId } from '@common/utils/generate-id';

/** Payload accepted by the save-progress endpoint. */
export interface SaveProgressPayload {
  active_tab?: string;
  code_value?: string;
  practice_input?: string;
  deliverable_input?: string;
  mcq_answers?: Record<string, unknown>;
  mcq_score?: number;
}

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /progress/lessons/:lessonId — upsert lesson progress.
   * Creates a new record or updates the existing one for the
   * given learner + lesson combination.
   */
  async saveProgress(
    learnerId: string,
    lessonId: string,
    payload: SaveProgressPayload,
  ) {
    const existing = await this.prisma.learnerLessonProgress.findUnique({
      where: { learner_id_lesson_id: { learner_id: learnerId, lesson_id: lessonId } },
    });

    if (existing) {
      const updateData: Record<string, unknown> = {
        updated_at: new Date(),
      };
      if (payload.active_tab !== undefined) updateData.active_tab = payload.active_tab;
      if (payload.code_value !== undefined) updateData.code_value = payload.code_value;
      if (payload.practice_input !== undefined) updateData.practice_input = payload.practice_input;
      if (payload.deliverable_input !== undefined) updateData.deliverable_input = payload.deliverable_input;
      if (payload.mcq_answers !== undefined) updateData.mcq_answers = payload.mcq_answers as any;
      if (payload.mcq_score !== undefined) updateData.mcq_score = payload.mcq_score;

      const updated = await this.prisma.learnerLessonProgress.update({
        where: { id: existing.id },
        data: updateData as any,
      });
      this.logger.log(`Progress updated for learner ${learnerId}, lesson ${lessonId}`);
      return updated;
    }

    const created = await this.prisma.learnerLessonProgress.create({
      data: {
        id: generateId('LRN'),
        learner_id: learnerId,
        lesson_id: lessonId,
        active_tab: payload.active_tab ?? 'learn',
        code_value: payload.code_value ?? null,
        practice_input: payload.practice_input ?? null,
        deliverable_input: payload.deliverable_input ?? null,
        mcq_answers: (payload.mcq_answers ?? {}) as any,
        mcq_score: payload.mcq_score ?? null,
        updated_at: new Date(),
      },
    });

    this.logger.log(`Progre
ss created for learner ${learnerId}, lesson ${lessonId}`);
    return created;
  }

  /**
   * PUT /progress/lessons/:lessonId/complete — mark a lesson as completed.
   * Sets `submitted = true` on the progress record.
   */
  async markCompleted(learnerId: string, lessonId: string) {
    const existing = await this.prisma.learnerLessonProgress.findUnique({
      where: { learner_id_lesson_id: { learner_id: learnerId, lesson_id: lessonId } },
    });

    if (existing) {
      const updated = await this.prisma.learnerLessonProgress.update({
        where: { id: existing.id },
        data: { submitted: true, updated_at: new Date() },
      });
      this.logger.log(`Lesson ${lessonId} marked complete for learner ${learnerId}`);
      return updated;
    }

    // Create a new record with submitted = true if none exists
    const created = await this.prisma.learnerLessonProgress.create({
      data: {
        id: generateId('LRN'),
        learner_id: learnerId,
        lesson_id: lessonId,
        submitted: true,
        updated_at: new Date(),
      },
    });

    this.logger.log(`Lesson ${lessonId} marked complete for learner ${learnerId} (new record)`);
    return created;
  }

  /**
   * GET /progress/lessons — fetch all progress records for the authenticated learner.
   */
  async getAllProgress(learnerId: string) {
    return this.prisma.learnerLessonProgress.findMany({
      where: { learner_id: learnerId },
      orderBy: { updated_at: 'desc' },
    });
  }
}
