/**
 * @file content.service.ts
 * Core content service managing the curriculum hierarchy and learning resources.
 * Handles track catalog (cached 15min), curriculum browsing, module CRUD with
 * content versioning, lab session lifecycle, and coding exercise execution.
 * High-read endpoints (catalog, track detail, curriculum) are cached via CacheService.
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { CacheService } from '@common/cache/cache.service';
import { generateId } from '@common/utils/generate-id';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ScheduleLabSessionDto } from './dto/schedule-lab-session.dto';
import { UpdateLabRecordingDto } from './dto/update-lab-recording.dto';
import { SubmitLabWorkDto } from './dto/submit-lab-work.dto';
import { LabFeedbackDto } from './dto/lab-feedback.dto';
import { CreateCodingExerciseDto } from './dto/create-coding-exercise.dto';
import { ExecuteCodeDto } from './dto/execute-code.dto';
import { CodeExecutionService, ExecutionResult } from './code-execution.service';

const CATALOG_CACHE_KEY = 'catalog:tracks';
const TRACK_DETAIL_CACHE_PREFIX = 'track:';
const CURRICULUM_CACHE_PREFIX = 'curriculum:';
const CACHE_TTL_SECONDS = 15 * 60; // 15 minutes

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly codeExecution: CodeExecutionService,
  ) {}

  /**
   * GET /content/tracks — track catalog with name, description, levels,
   * duration, pricing placeholder, and available/waitlisted status.
   */
  async getTrackCatalog() {
    const cached = await this.cache.get<unknown[]>(CATALOG_CACHE_KEY);
    if (cached) {
      this.logger.debug('Track catalog served from cache');
      return cached;
    }

    const tracks = await this.prisma.track.findMany({
      include: {
        levels: {
          orderBy: { sequence: 'asc' },
          select: { id: true, tier: true, sequence: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const catalog = tracks.map((track) => ({
      id: track.id,
      name: track.name,
      description: track.description,
      status: track.status,
      estimated_duration: track.estimated_duration,
      levels: track.levels.map((l) => ({
        id: l.id,
        tier: l.tier,
        sequence: l.sequence,
      })),
    }));

    await this.cache.set(CATALOG_CACHE_KEY, catalog, CACHE_TTL_SECONDS);
    this.logger.log('Track catalog cached');

    return catalog;
  }

  /**
   * GET /content/tracks/:trackId — track detail with curriculum outline,
   * prerequisites, and certification outcomes.
   */
  async getTrackDetail(trackId: string) {
    const cacheKey = `${TRACK_DETAIL_CACHE_PREFIX}${trackId}:detail`;

    const cached = await this.cache.get<unknown>(cacheKey);
    if (cached) {
      this.logger.debug(`Track detail for ${trackId} served from cache`);
      return cached;
    }

    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      include: {
        levels: {
          orderBy: { sequence: 'asc' },
          include: {
            modules: {
              orderBy: { sequence: 'asc' },
              select: {
                id: true,
                title: true,
                sequence: true,
                published: true,
              },
            },
          },
        },
      },
    });

    if (!track) {
      throw new NotFoundException(`Track ${trackId} not found`);
    }

    const detail = {
      id: track.id,
      name: track.name,
      description: track.description,
      status: track.status,
      estimated_duration: track.estimated_duration,
      prerequisites: ['Foundation School completion required'],
      certification_outcomes: [
        `${track.name} Certificate upon completion of all levels, capstone defense, and assessor approval`,
        `Verifiable certificate with KFCERT verification code`,
      ],
      curriculum: track.levels.map((level) => ({
        id: level.id,
        tier: level.tier,
        sequence: level.sequence,
        modules: level.modules.map((m) => ({
          id: m.id,
          title: m.title,
          sequence: m.sequence,
          published: m.published,
        })),
      })),
    };

    await this.cache.set(cacheKey, detail, CACHE_TTL_SECONDS);
    this.logger.log(`Track detail for ${trackId} cached`);

    return detail;
  }

  /**
   * GET /content/tracks/:trackId/curriculum — full curriculum hierarchy:
   * levels → modules → lessons (with sequence ordering).
   */
  async getTrackCurriculum(trackId: string) {
    const cacheKey = `${CURRICULUM_CACHE_PREFIX}${trackId}`;

    const cached = await this.cache.get<unknown>(cacheKey);
    if (cached) {
      this.logger.debug(`Curriculum for ${trackId} served from cache`);
      return cached;
    }

    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      include: {
        levels: {
          orderBy: { sequence: 'asc' },
          include: {
            modules: {
              orderBy: { sequence: 'asc' },
              include: {
                lessons: {
                  orderBy: { sequence: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    content_type: true,
                    sequence: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!track) {
      throw new NotFoundException(`Track ${trackId} not found`);
    }

    const curriculum = {
      track_id: track.id,
      track_name: track.name,
      levels: track.levels.map((level) => ({
        id: level.id,
        tier: level.tier,
        sequence: level.sequence,
        modules: level.modules.map((mod) => ({
          id: mod.id,
          title: mod.title,
          sequence: mod.sequence,
          version: mod.version,
          published: mod.published,
          lessons: mod.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            content_type: lesson.content_type,
            sequence: lesson.sequence,
          })),
        })),
      })),
    };

    await this.cache.set(cacheKey, curriculum, CACHE_TTL_SECONDS);
    this.logger.log(`Curriculum for ${trackId} cached`);

    return curriculum;
  }

  /**
   * POST /content/modules — create a new module within a level.
   */
  async createModule(dto: CreateModuleDto) {
    const level = await this.prisma.level.findUnique({
      where: { id: dto.level_id },
    });

    if (!level) {
      throw new NotFoundException(`Level ${dto.level_id} not found`);
    }

    const module = await this.prisma.module.create({
      data: {
        id: generateId('MOD'),
        level_id: dto.level_id,
        title: dto.title,
        sequence: dto.sequence,
        published: dto.published ?? false,
      },
    });

    // Invalidate related caches
    await this.invalidateTrackCaches(level.track_id);

    this.logger.log(`Module ${module.id} created in level ${dto.level_id}`);
    return module;
  }

  /**
   * PUT /content/modules/:moduleId — update module with content versioning.
   * If the module is published, creates a ContentVersion snapshot before updating
   * so in-progress learners continue seeing the old version.
   */
  async updateModule(moduleId: string, dto: UpdateModuleDto) {
    const existing = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            title: true,
            content_type: true,
            sequence: true,
            version: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Module ${moduleId} not found`);
    }

    // If the module is published, snapshot current state before updating
    let contentVersion = null;
    if (existing.published) {
      contentVersion = await this.prisma.contentVersion.create({
        data: {
          id: generateId('CVR'),
          module_id: moduleId,
          version_number: existing.version,
          published_at: new Date(),
          content_snapshot: {
            title: existing.title,
            sequence: existing.sequence,
            lessons: existing.lessons,
          },
        },
      });

      this.logger.log(
        `Content version ${contentVersion.id} (v${existing.version}) created for module ${moduleId}`,
      );
    }

    const newVersion = existing.published ? existing.version + 1 : existing.version;

    const updated = await this.prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.sequence !== undefined && { sequence: dto.sequence }),
        ...(dto.published !== undefined && { published: dto.published }),
        version: newVersion,
      },
    });

    // Invalidate related caches
    const level = await this.prisma.level.findUnique({
      where: { id: existing.level_id },
    });
    if (level) {
      await this.invalidateTrackCaches(level.track_id);
    }

    this.logger.log(`Module ${moduleId} updated to v${newVersion}`);

    return {
      ...updated,
      content_version: contentVersion
        ? { id: contentVersion.id, version_number: contentVersion.version_number }
        : null,
    };
  }

  /**
   * GET /content/lessons/:lessonId — return lesson content with coding exercises.
   */
  async getLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        coding_exercises: {
          select: {
            id: true,
            starter_code: true,
            test_cases: true,
            language: true,
            time_limit: true,
            memory_limit: true,
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson ${lessonId} not found`);
    }

    return lesson;
  }

  // ── Lab Session Management ─────────────────────────────────────

  /** Maximum days an instructor has to provide feedback on a lab submission. */
  private static readonly FEEDBACK_WINDOW_DAYS = 7;

  /**
   * POST /content/labs — schedule a new lab session.
   * Logs a 48-hour advance notification message (real notification via SQS workers later).
   */
  async scheduleLabSession(dto: ScheduleLabSessionDto) {
    const mod = await this.prisma.module.findUnique({ where: { id: dto.module_id } });
    if (!mod) {
      throw new NotFoundException(`Module ${dto.module_id} not found`);
    }

    const instructor = await this.prisma.user.findUnique({ where: { id: dto.instructor_id } });
    if (!instructor) {
      throw new NotFoundException(`Instructor ${dto.instructor_id} not found`);
    }

    const scheduledAt = new Date(dto.scheduled_at);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('scheduled_at must be in the future');
    }

    const labSession = await this.prisma.labSession.create({
      data: {
        id: generateId('LAB'),
        module_id: dto.module_id,
        instructor_id: dto.instructor_id,
        scheduled_at: scheduledAt,
      },
    });

    // Log 48-hour advance notification (real notification via SQS workers later)
    const notifyAt = new Date(scheduledAt.getTime() - 48 * 60 * 60 * 1000);
    this.logger.log(
      `Lab session ${labSession.id} scheduled for ${scheduledAt.toISOString()}. ` +
      `Enrolled learners should be notified at ${notifyAt.toISOString()} (48h advance).`,
    );

    return labSession;
  }

  /**
   * GET /content/labs/:labId — get lab session details.
   */
  async getLabSession(labId: string) {
    const labSession = await this.prisma.labSession.findUnique({
      where: { id: labId },
      include: {
        module: { select: { id: true, title: true } },
        submissions: {
          select: {
            id: true,
            learner_id: true,
            content: true,
            score: true,
            feedback: true,
            feedback_at: true,
            status: true,
            submitted_at: true,
          },
        },
      },
    });

    if (!labSession) {
      throw new NotFoundException(`Lab session ${labId} not found`);
    }

    return labSession;
  }

  /**
   * PUT /content/labs/:labId/recording — add recording URL after session.
   * Recording should be made available within 24 hours of the session.
   */
  async updateLabRecording(labId: string, dto: UpdateLabRecordingDto) {
    const labSession = await this.prisma.labSession.findUnique({ where: { id: labId } });
    if (!labSession) {
      throw new NotFoundException(`Lab session ${labId} not found`);
    }

    const updated = await this.prisma.labSession.update({
      where: { id: labId },
      data: {
        recording_url: dto.recording_url,
        status: 'completed',
      },
    });

    this.logger.log(
      `Recording added for lab session ${labId}. ` +
      `Recording should be available within 24 hours of session time ${labSession.scheduled_at.toISOString()}.`,
    );

    return updated;
  }

  /**
   * POST /content/labs/:labId/submit — async lab work submission for learners.
   * Supports learners who missed the live session.
   */
  async submitLabWork(labId: string, dto: SubmitLabWorkDto) {
    const labSession = await this.prisma.labSession.findUnique({ where: { id: labId } });
    if (!labSession) {
      throw new NotFoundException(`Lab session ${labId} not found`);
    }

    const learner = await this.prisma.learner.findUnique({ where: { id: dto.learner_id } });
    if (!learner) {
      throw new NotFoundException(`Learner ${dto.learner_id} not found`);
    }

    const submission = await this.prisma.submission.create({
      data: {
        id: generateId('SUB'),
        learner_id: dto.learner_id,
        lab_session_id: labId,
        content: dto.content,
        status: 'submitted',
        submitted_at: new Date(),
      },
    });

    this.logger.log(
      `Lab work submitted: ${submission.id} by learner ${dto.learner_id} for lab session ${labId}`,
    );

    return submission;
  }

  /**
   * POST /content/labs/:labId/feedback — instructor feedback on a lab submission.
   * Feedback must be provided within the 7-day review window from submission date.
   */
  async provideLabFeedback(labId: string, dto: LabFeedbackDto) {
    const labSession = await this.prisma.labSession.findUnique({ where: { id: labId } });
    if (!labSession) {
      throw new NotFoundException(`Lab session ${labId} not found`);
    }

    const submission = await this.prisma.submission.findUnique({
      where: { id: dto.submission_id },
    });
    if (!submission) {
      throw new NotFoundException(`Submission ${dto.submission_id} not found`);
    }

    if (submission.lab_session_id !== labId) {
      throw new BadRequestException(
        `Submission ${dto.submission_id} does not belong to lab session ${labId}`,
      );
    }

    // Enforce 7-day review window
    if (submission.submitted_at) {
      const deadlineMs =
        submission.submitted_at.getTime() +
        ContentService.FEEDBACK_WINDOW_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() > deadlineMs) {
        throw new BadRequestException(
          `Feedback window (${ContentService.FEEDBACK_WINDOW_DAYS} days) has expired for submission ${dto.submission_id}`,
        );
      }
    }

    const updated = await this.prisma.submission.update({
      where: { id: dto.submission_id },
      data: {
        feedback: dto.feedback,
        feedback_at: new Date(),
        score: dto.score ?? undefined,
        status: 'graded',
      },
    });

    this.logger.log(
      `Feedback provided for submission ${dto.submission_id} on lab session ${labId}`,
    );

    return updated;
  }

  // ── Coding Exercise Management ───────────────────────────────

  /**
   * POST /content/exercises — create a coding exercise (instructor only).
   */
  async createCodingExercise(dto: CreateCodingExerciseDto) {
    // Validate that at least one parent (lesson or assessment) is provided
    if (!dto.lesson_id && !dto.assessment_id) {
      throw new BadRequestException('Either lesson_id or assessment_id must be provided');
    }

    if (dto.lesson_id) {
      const lesson = await this.prisma.lesson.findUnique({ where: { id: dto.lesson_id } });
      if (!lesson) {
        throw new NotFoundException(`Lesson ${dto.lesson_id} not found`);
      }
    }

    if (dto.assessment_id) {
      const assessment = await this.prisma.assessment.findUnique({ where: { id: dto.assessment_id } });
      if (!assessment) {
        throw new NotFoundException(`Assessment ${dto.assessment_id} not found`);
      }
    }

    const exercise = await this.prisma.codingExercise.create({
      data: {
        id: generateId('CEX'),
        lesson_id: dto.lesson_id ?? null,
        assessment_id: dto.assessment_id ?? null,
        starter_code: dto.starter_code,
        test_cases: dto.test_cases as any,
        language: dto.language,
        time_limit: dto.time_limit ?? 10,
        memory_limit: dto.memory_limit ?? 256,
      },
    });

    this.logger.log(`Coding exercise ${exercise.id} created (language: ${dto.language})`);
    return exercise;
  }

  /**
   * GET /content/exercises/:exerciseId — get exercise details.
   */
  async getCodingExercise(exerciseId: string) {
    const exercise = await this.prisma.codingExercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new NotFoundException(`Coding exercise ${exerciseId} not found`);
    }

    return exercise;
  }

  /**
   * POST /content/exercises/:exerciseId/execute — execute code and run test cases.
   * Accepts learner code, executes in sandboxed backend, returns output within 10 seconds.
   */
  async executeExercise(exerciseId: string, dto: ExecuteCodeDto): Promise<ExecutionResult> {
    const exercise = await this.prisma.codingExercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new NotFoundException(`Coding exercise ${exerciseId} not found`);
    }

    const language = dto.language ?? exercise.language;
    const testCases = (exercise.test_cases as any[]) ?? [];

    const result = await this.codeExecution.executeWithTests(
      dto.code,
      language,
      testCases,
      exercise.time_limit,
      exercise.memory_limit,
    );

    this.logger.log(
      `Exercise ${exerciseId} executed: ${result.test_results.filter((t) => t.passed).length}/${result.test_results.length} tests passed (${result.execution_time_ms}ms)`,
    );

    return result;
  }

  /**
   * Invalidate track-related caches when content changes.
   */
  private async invalidateTrackCaches(trackId: string) {
    await Promise.all([
      this.cache.del(CATALOG_CACHE_KEY),
      this.cache.del(`${TRACK_DETAIL_CACHE_PREFIX}${trackId}:detail`),
      this.cache.del(`${CURRICULUM_CACHE_PREFIX}${trackId}`),
    ]);
  }
}
