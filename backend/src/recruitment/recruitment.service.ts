import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { generateId } from '@common/utils/generate-id';
import { scoreCV } from './ats-scorer';
import { ApplyDto } from './dto/apply.dto';
import { UpdateApplicationStatusDto } from './dto/update-status.dto';

@Injectable()
export class RecruitmentService {
  private readonly logger = new Logger(RecruitmentService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Submit a job application (public endpoint).
   * Uploads CV to S3 (key generated here, actual upload handled by controller),
   * runs ATS keyword scoring, and stores the application.
   */
  async apply(dto: ApplyDto, cvFilename: string, cvText: string, cvS3Key: string) {
    const job = await this.prisma.jobOpening.findUnique({
      where: { id: dto.job_opening_id },
    });
    if (!job) throw new NotFoundException(`Job opening ${dto.job_opening_id} not found`);
    if (job.status !== 'open') throw new BadRequestException('This position is no longer accepting applications');

    const keywords = (job.keywords as string[]) || [];
    const atsResult = scoreCV(cvText, keywords);

    const application = await this.prisma.application.create({
      data: {
        id: generateId('APP'),
        job_opening_id: dto.job_opening_id,
        applicant_name: dto.applicant_name,
        applicant_email: dto.applicant_email,
        cv_s3_key: cvS3Key,
        cv_filename: cvFilename,
        cover_note: dto.cover_note || null,
        ats_score: atsResult.score,
        matched_keywords: atsResult.matched,
        missing_keywords: atsResult.missing,
      },
    });

    this.logger.log(`Application ${application.id} created for job ${job.id} — ATS score: ${atsResult.score}%`);
    return application;
  }

  /** List all applications with optional filters (Admin/SuperAdmin only) */
  async listApplications(filters?: { status?: string; department?: string }) {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.department) {
      where.job_opening = { department: filters.department };
    }

    return this.prisma.application.findMany({
      where,
      include: { job_opening: { select: { title: true, department: true } } },
      orderBy: { applied_at: 'desc' },
    });
  }

  /** Get single application detail (Admin/SuperAdmin only) */
  async getApplication(id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: { job_opening: true },
    });
    if (!app) throw new NotFoundException(`Application ${id} not found`);
    return app;
  }

  /** Update application status with optional reviewer notes (Admin/SuperAdmin only) */
  async updateStatus(id: string, dto: UpdateApplicationStatusDto) {
    const app = await this.prisma.application.findUnique({ where: { id } });
    if (!app) throw new NotFoundException(`Application ${id} not found`);

    const updated = await this.prisma.application.update({
      where: { id },
      data: {
        status: dto.status as any,
        reviewer_notes: dto.reviewer_notes
          ? app.reviewer_notes
            ? `${app.reviewer_notes}\n${dto.reviewer_notes}`
            : dto.reviewer_notes
          : app.reviewer_notes,
      },
    });

    this.logger.log(`Application ${id} status changed to ${dto.status}`);
    return updated;
  }

  /** Generate presigned S3 URL for CV download (Admin/SuperAdmin only) */
  getCvDownloadKey(application: { cv_s3_key: string }) {
    // In production, this would generate a presigned S3 URL
    // For now, return the S3 key for the controller to handle
    return application.cv_s3_key;
  }

  /** Get pipeline KPIs — count by status (Admin/SuperAdmin only) */
  async getPipelineKPIs() {
    const all = await this.prisma.application.findMany({
      select: { status: true },
    });

    const counts: Record<string, number> = {
      total: all.length,
      new_application: 0,
      in_review: 0,
      shortlisted: 0,
      interview: 0,
      offer: 0,
      hired: 0,
      rejected: 0,
    };

    for (const app of all) {
      counts[app.status] = (counts[app.status] || 0) + 1;
    }

    return counts;
  }
}
