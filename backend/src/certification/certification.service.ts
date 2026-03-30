/**
 * @file certification.service.ts
 * Core certification service managing the end-to-end certification pipeline:
 * capstone unlock → submission → panel defense → eligibility check → certificate issuance.
 *
 * Certification requires all 6 conditions:
 * 1. AI Foundation School complete
 * 2. All level performance gates passed
 * 3. Pod deliverables complete (assessor-verified)
 * 4. Capstone defense passed
 * 5. Assessor approval
 * 6. Payment cleared (no outstanding installments)
 *
 * Certificates use KFCERT-{YEAR}-{ALPHANUMERIC} verification codes
 * and are publicly verifiable without authentication.
 */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { EmailService } from '@email/email.service';
import { generateId, generateCertVerificationCode } from '@common/utils/generate-id';
import { UnlockCapstoneDto } from './dto/unlock-capstone.dto';
import { SubmitCapstoneDto } from './dto/submit-capstone.dto';
import { EvaluateCapstoneDto } from './dto/evaluate-capstone.dto';
import { CheckEligibilityDto } from './dto/check-eligibility.dto';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { RevokeCertificateDto } from './dto/revoke-certificate.dto';

/** Maximum days after submission within which a defense must be scheduled. */
const DEFENSE_WINDOW_DAYS = 14;

/** Maximum days after a failed defense within which a resubmission is allowed. */
const RESUBMISSION_WINDOW_DAYS = 30;

@Injectable()
export class CertificationService {
  private readonly logger = new Logger(CertificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Unlock a capstone for a learner on a track.
   * Prerequisites:
   *  1. Learner must have an active enrollment in the track
   *  2. All Advanced level performance gates must be passed
   *  3. Assessor must validate readiness (assessor_id provided)
   */
  async unlockCapstone(dto: UnlockCapstoneDto) {
    // 1. Verify learner exists
    const learner = await this.prisma.learner.findUnique({
      where: { id: dto.learner_id },
    });
    if (!learner) {
      throw new NotFoundException(`Learner ${dto.learner_id} not found`);
    }

    // 2. Verify active enrollment in track
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        learner_id: dto.learner_id,
        track_id: dto.track_id,
        status: 'active',
      },
    });
    if (!enrollment) {
      throw new BadRequestException(
        'Learner does not have an active enrollment in this track',
      );
    }

    // 3. Check no existing unlocked/submitted/evaluated capstone
    const existing = await this.prisma.capstone.findFirst({
      where: {
        learner_id: dto.learner_id,
        track_id: dto.track_id,
        status: { in: ['unlocked', 'submitted', 'evaluated'] },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Capstone already exists with status "${existing.status}"`,
      );
    }

    // 4. Verify all Advanced level gates are passed
    await this.assertAdvancedGatesPassed(dto.learner_id, dto.track_id);

    // 5. Verify assessor exists and has Assessor role
    const assessor = await this.prisma.user.findUnique({
      where: { id: dto.assessor_id },
    });
    if (!assessor) {
      throw new NotFoundException(`Assessor ${dto.assessor_id} not found`);
    }
    if (assessor.role !== 'Assessor') {
      throw new BadRequestException('User does not have the Assessor role');
    }

    // 6. Create capstone record with status 'unlocked'
    const capstoneId = generateId('CPS');
    const capstone = await this.prisma.capstone.create({
      data: {
        id: capstoneId,
        learner_id: dto.learner_id,
        track_id: dto.track_id,
        status: 'unlocked',
      },
    });

    this.logger.log(
      `Capstone ${capstoneId} unlocked for learner ${dto.learner_id} on track ${dto.track_id}`,
    );

    return {
      id: capstone.id,
      learner_id: capstone.learner_id,
      track_id: capstone.track_id,
      status: capstone.status,
      created_at: capstone.created_at,
    };
  }

  /**
   * Verify all Advanced level performance gates are passed for a learner in a track.
   * Throws if any gate is not passed.
   */
  private async assertAdvancedGatesPassed(
    learnerId: string,
    trackId: string,
  ): Promise<void> {
    // Find all Advanced levels for this track
    const advancedLevels = await this.prisma.level.findMany({
      where: { track_id: trackId, tier: 'Advanced' },
      include: {
        modules: {
          include: {
            performance_gates: true,
          },
        },
      },
    });

    if (advancedLevels.length === 0) {
      throw new BadRequestException(
        'No Advanced levels found for this track',
      );
    }

    // Collect all gate IDs from Advanced level modules
    const gateIds: string[] = [];
    for (const level of advancedLevels) {
      for (const mod of level.modules) {
        for (const gate of mod.performance_gates) {
          gateIds.push(gate.id);
        }
      }
    }

    if (gateIds.length === 0) {
      throw new BadRequestException(
        'No performance gates defined for Advanced level modules',
      );
    }

    // Check that the learner has a passing attempt for every gate
    for (const gateId of gateIds) {
      const passingAttempt = await this.prisma.gateAttempt.findFirst({
        where: {
          gate_id: gateId,
          learner_id: learnerId,
          passed: true,
        },
      });

      if (!passingAttempt) {
        throw new ForbiddenException(
          `Learner has not passed Advanced level gate ${gateId}. All Advanced gates must be passed to unlock capstone.`,
        );
      }
    }
  }

  /**
   * Submit a capstone project.
   * The capstone must be in 'unlocked' status, OR in 'evaluated' status with a failed
   * defense and within the 30-day resubmission window.
   */
  async submitCapstone(capstoneId: string, dto: SubmitCapstoneDto) {
    const capstone = await this.prisma.capstone.findUnique({
      where: { id: capstoneId },
      include: { defenses: { orderBy: { created_at: 'desc' }, take: 1 } },
    });

    if (!capstone) {
      throw new NotFoundException(`Capstone ${capstoneId} not found`);
    }

    if (capstone.learner_id !== dto.learner_id) {
      throw new ForbiddenException('Capstone does not belong to this learner');
    }

    // Allow submission if unlocked (first submission)
    if (capstone.status === 'unlocked') {
      const updated = await this.prisma.capstone.update({
        where: { id: capstoneId },
        data: {
          status: 'submitted',
          submitted_at: new Date(),
          result: null,
          feedback: dto.content,
        },
      });

      this.logger.log(`Capstone ${capstoneId} submitted by learner ${dto.learner_id}`);

      return {
        id: updated.id,
        learner_id: updated.learner_id,
        track_id: updated.track_id,
        status: updated.status,
        submitted_at: updated.submitted_at,
      };
    }

    // Allow resubmission if evaluated with 'fail' result and within 30-day window
    if (capstone.status === 'evaluated') {
      const lastDefense = capstone.defenses[0];
      if (!lastDefense || lastDefense.result !== 'fail') {
        throw new BadRequestException(
          'Resubmission is only allowed after a failed defense',
        );
      }

      // Check resubmission count — only one resubmission allowed
      const defenseCount = await this.prisma.capstoneDefense.count({
        where: { capstone_id: capstoneId },
      });
      if (defenseCount >= 2) {
        throw new BadRequestException(
          'Maximum resubmissions reached. Only one resubmission is allowed after a failed defense.',
        );
      }

      // Check 30-day resubmission window from original submission date
      if (capstone.submitted_at) {
        const deadline = new Date(capstone.submitted_at.getTime());
        deadline.setDate(deadline.getDate() + RESUBMISSION_WINDOW_DAYS);
        if (new Date() > deadline) {
          throw new BadRequestException(
            `Resubmission window has expired. Resubmission must be within ${RESUBMISSION_WINDOW_DAYS} days of the original submission.`,
          );
        }
      }

      const updated = await this.prisma.capstone.update({
        where: { id: capstoneId },
        data: {
          status: 'submitted',
          submitted_at: new Date(),
          result: null,
          feedback: dto.content,
        },
      });

      this.logger.log(
        `Capstone ${capstoneId} resubmitted by learner ${dto.learner_id}`,
      );

      return {
        id: updated.id,
        learner_id: updated.learner_id,
        track_id: updated.track_id,
        status: updated.status,
        submitted_at: updated.submitted_at,
      };
    }

    throw new BadRequestException(
      `Capstone cannot be submitted in current status "${capstone.status}"`,
    );
  }

  /**
   * Evaluate a capstone — schedule defense with panel of 2+ assessors,
   * record pass/fail with feedback.
   *
   * Rules:
   *  - Capstone must be in 'submitted' status
   *  - Panel must have at least 2 assessors
   *  - Defense must be scheduled within 14 days of submission
   *  - Result is 'pass' or 'fail' with written feedback
   */
  async evaluateCapstone(capstoneId: string, dto: EvaluateCapstoneDto) {
    const capstone = await this.prisma.capstone.findUnique({
      where: { id: capstoneId },
    });

    if (!capstone) {
      throw new NotFoundException(`Capstone ${capstoneId} not found`);
    }

    if (capstone.status !== 'submitted') {
      throw new BadRequestException(
        `Capstone must be in "submitted" status to evaluate. Current status: "${capstone.status}"`,
      );
    }

    // Validate panel assessor IDs — each must be a valid user with Assessor role
    for (const assessorId of dto.panel_assessor_ids) {
      const user = await this.prisma.user.findUnique({
        where: { id: assessorId },
      });
      if (!user) {
        throw new NotFoundException(`Assessor ${assessorId} not found`);
      }
      if (user.role !== 'Assessor' && user.role !== 'Admin') {
        throw new BadRequestException(
          `User ${assessorId} does not have Assessor or Admin role`,
        );
      }
    }

    // Validate defense is scheduled within 14 days of submission
    const scheduledAt = new Date(dto.scheduled_at);
    if (capstone.submitted_at) {
      const maxDefenseDate = new Date(capstone.submitted_at.getTime());
      maxDefenseDate.setDate(
        maxDefenseDate.getDate() + DEFENSE_WINDOW_DAYS,
      );
      if (scheduledAt > maxDefenseDate) {
        throw new BadRequestException(
          `Defense must be scheduled within ${DEFENSE_WINDOW_DAYS} days of submission. Deadline: ${maxDefenseDate.toISOString()}`,
        );
      }
    }

    // Create defense record
    const defenseId = generateId('DEF');
    const defense = await this.prisma.capstoneDefense.create({
      data: {
        id: defenseId,
        capstone_id: capstoneId,
        panel_assessor_ids: dto.panel_assessor_ids,
        scheduled_at: scheduledAt,
        result: dto.result,
        feedback: dto.feedback,
      },
    });

    // Update capstone status and result
    const updated = await this.prisma.capstone.update({
      where: { id: capstoneId },
      data: {
        status: 'evaluated',
        result: dto.result,
        feedback: dto.feedback,
      },
    });

    this.logger.log(
      `Capstone ${capstoneId} evaluated: ${dto.result}. Defense ${defenseId} scheduled at ${dto.scheduled_at}`,
    );

    return {
      capstone: {
        id: updated.id,
        learner_id: updated.learner_id,
        track_id: updated.track_id,
        status: updated.status,
        result: updated.result,
        feedback: updated.feedback,
      },
      defense: {
        id: defense.id,
        capstone_id: defense.capstone_id,
        panel_assessor_ids: defense.panel_assessor_ids,
        scheduled_at: defense.scheduled_at,
        result: defense.result,
        feedback: defense.feedback,
      },
    };
  }

  /**
   * Get capstone details for a given capstone ID.
   */
  async getCapstone(capstoneId: string) {
    const capstone = await this.prisma.capstone.findUnique({
      where: { id: capstoneId },
      include: {
        defenses: { orderBy: { created_at: 'desc' } },
      },
    });

    if (!capstone) {
      throw new NotFoundException(`Capstone ${capstoneId} not found`);
    }

    return {
      id: capstone.id,
      learner_id: capstone.learner_id,
      track_id: capstone.track_id,
      status: capstone.status,
      submitted_at: capstone.submitted_at,
      result: capstone.result,
      feedback: capstone.feedback,
      created_at: capstone.created_at,
      defenses: capstone.defenses.map((d) => ({
        id: d.id,
        panel_assessor_ids: d.panel_assessor_ids,
        scheduled_at: d.scheduled_at,
        result: d.result,
        feedback: d.feedback,
        created_at: d.created_at,
      })),
    };
  }

  // ── Certification Eligibility & Certificate Issuance ──────────

  /**
   * Run composite eligibility check for a learner on a track.
   * Evaluates all 6 conditions and creates/updates a CEL-* record.
   *
   * Conditions:
   *  1. foundation_complete — FoundationProgress.completed = true
   *  2. levels_complete — all performance gates passed for all levels (Beginner + Intermediate + Advanced)
   *  3. pod_deliverables_complete — boolean flag set by assessor on the CEL record
   *  4. capstone_passed — Capstone.result = 'pass'
   *  5. assessor_approved — boolean set by assessor via approval endpoint
   *  6. payment_cleared — no outstanding installments (all paid)
   */
  async checkEligibility(dto: CheckEligibilityDto) {
    // Verify learner exists
    const learner = await this.prisma.learner.findUnique({
      where: { id: dto.learner_id },
    });
    if (!learner) {
      throw new NotFoundException(`Learner ${dto.learner_id} not found`);
    }

    // Verify track exists
    const track = await this.prisma.track.findUnique({
      where: { id: dto.track_id },
    });
    if (!track) {
      throw new NotFoundException(`Track ${dto.track_id} not found`);
    }

    // 1. Foundation complete
    const foundationProgress = await this.prisma.foundationProgress.findUnique({
      where: { learner_id: dto.learner_id },
    });
    const foundationComplete = foundationProgress?.completed === true;

    // 2. All levels complete — check all performance gates passed for all levels
    const levelsComplete = await this.checkAllLevelsComplete(dto.learner_id, dto.track_id);

    // 3. Pod deliverables complete — read from existing CEL record (assessor sets this)
    const existingEligibility = await this.prisma.certificationEligibility.findFirst({
      where: { learner_id: dto.learner_id, track_id: dto.track_id },
    });
    const podDeliverablesComplete = existingEligibility?.pod_deliverables_complete === true;

    // 4. Capstone passed
    const capstone = await this.prisma.capstone.findFirst({
      where: {
        learner_id: dto.learner_id,
        track_id: dto.track_id,
        result: 'pass',
      },
    });
    const capstonePassed = capstone !== null;

    // 5. Assessor approved — read from existing CEL record (assessor sets this)
    const assessorApproved = existingEligibility?.assessor_approved === true;

    // 6. Payment cleared — no outstanding installments
    const paymentCleared = await this.checkPaymentCleared(dto.learner_id, dto.track_id);

    // Compute overall eligibility
    const eligible =
      foundationComplete &&
      levelsComplete &&
      podDeliverablesComplete &&
      capstonePassed &&
      assessorApproved &&
      paymentCleared;

    // Create or update CEL record
    const eligibilityData = {
      foundation_complete: foundationComplete,
      levels_complete: levelsComplete,
      pod_deliverables_complete: podDeliverablesComplete,
      capstone_passed: capstonePassed,
      assessor_approved: assessorApproved,
      payment_cleared: paymentCleared,
      eligible,
    };

    let eligibilityRecord;
    if (existingEligibility) {
      eligibilityRecord = await this.prisma.certificationEligibility.update({
        where: { id: existingEligibility.id },
        data: eligibilityData,
      });
    } else {
      const celId = generateId('CEL');
      eligibilityRecord = await this.prisma.certificationEligibility.create({
        data: {
          id: celId,
          learner_id: dto.learner_id,
          track_id: dto.track_id,
          ...eligibilityData,
        },
      });
    }

    this.logger.log(
      `Eligibility check for learner ${dto.learner_id} on track ${dto.track_id}: eligible=${eligible}`,
    );

    return {
      id: eligibilityRecord.id,
      learner_id: eligibilityRecord.learner_id,
      track_id: eligibilityRecord.track_id,
      foundation_complete: eligibilityRecord.foundation_complete,
      levels_complete: eligibilityRecord.levels_complete,
      pod_deliverables_complete: eligibilityRecord.pod_deliverables_complete,
      capstone_passed: eligibilityRecord.capstone_passed,
      assessor_approved: eligibilityRecord.assessor_approved,
      payment_cleared: eligibilityRecord.payment_cleared,
      eligible: eligibilityRecord.eligible,
    };
  }

  /**
   * Check if all performance gates for all levels (Beginner, Intermediate, Advanced)
   * in a track have been passed by the learner.
   */
  private async checkAllLevelsComplete(
    learnerId: string,
    trackId: string,
  ): Promise<boolean> {
    const levels = await this.prisma.level.findMany({
      where: { track_id: trackId },
      include: {
        modules: {
          include: {
            performance_gates: true,
          },
        },
      },
    });

    if (levels.length === 0) {
      return false;
    }

    for (const level of levels) {
      for (const mod of level.modules) {
        for (const gate of mod.performance_gates) {
          const passingAttempt = await this.prisma.gateAttempt.findFirst({
            where: {
              gate_id: gate.id,
              learner_id: learnerId,
              passed: true,
            },
          });
          if (!passingAttempt) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Check if all payment obligations are cleared for a learner's enrollment in a track.
   * Returns true if no outstanding (pending/overdue) installments exist.
   */
  private async checkPaymentCleared(
    learnerId: string,
    trackId: string,
  ): Promise<boolean> {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { learner_id: learnerId, track_id: trackId },
    });

    if (!enrollment) {
      return false;
    }

    const outstandingInstallments = await this.prisma.installment.count({
      where: {
        plan: { enrollment_id: enrollment.id },
        status: { in: ['pending', 'overdue'] },
      },
    });

    return outstandingInstallments === 0;
  }

  /**
   * Assessor approves eligibility for a CEL record.
   * Sets assessor_approved and optionally pod_deliverables_complete.
   */
  async approveEligibility(
    celId: string,
    podDeliverablesComplete?: boolean,
  ) {
    const eligibility = await this.prisma.certificationEligibility.findUnique({
      where: { id: celId },
    });

    if (!eligibility) {
      throw new NotFoundException(`Eligibility record ${celId} not found`);
    }

    const updateData: Record<string, boolean> = {
      assessor_approved: true,
    };

    if (podDeliverablesComplete !== undefined) {
      updateData.pod_deliverables_complete = podDeliverablesComplete;
    }

    // Recompute eligibility
    const newAssessorApproved = true;
    const newPodDeliverables =
      podDeliverablesComplete ?? eligibility.pod_deliverables_complete;

    const eligible =
      eligibility.foundation_complete &&
      eligibility.levels_complete &&
      newPodDeliverables &&
      eligibility.capstone_passed &&
      newAssessorApproved &&
      eligibility.payment_cleared;

    const updated = await this.prisma.certificationEligibility.update({
      where: { id: celId },
      data: {
        ...updateData,
        eligible,
      },
    });

    this.logger.log(
      `Eligibility ${celId} approved by assessor. eligible=${eligible}`,
    );

    return {
      id: updated.id,
      learner_id: updated.learner_id,
      track_id: updated.track_id,
      foundation_complete: updated.foundation_complete,
      levels_complete: updated.levels_complete,
      pod_deliverables_complete: updated.pod_deliverables_complete,
      capstone_passed: updated.capstone_passed,
      assessor_approved: updated.assessor_approved,
      payment_cleared: updated.payment_cleared,
      eligible: updated.eligible,
    };
  }

  /**
   * Issue a certificate for a learner on a track.
   * Requires all 6 eligibility conditions to be met (eligible = true on CEL record).
   * Creates a CRT-* record with KFCERT-* verification code and enqueues PDF generation.
   */
  async issueCertificate(dto: IssueCertificateDto) {
    // Verify learner exists
    const learner = await this.prisma.learner.findUnique({
      where: { id: dto.learner_id },
      include: { user: true },
    });
    if (!learner) {
      throw new NotFoundException(`Learner ${dto.learner_id} not found`);
    }

    // Verify track exists
    const track = await this.prisma.track.findUnique({
      where: { id: dto.track_id },
    });
    if (!track) {
      throw new NotFoundException(`Track ${dto.track_id} not found`);
    }

    // Check eligibility record exists and is eligible
    const eligibility = await this.prisma.certificationEligibility.findFirst({
      where: {
        learner_id: dto.learner_id,
        track_id: dto.track_id,
      },
    });

    if (!eligibility) {
      throw new BadRequestException(
        'No eligibility record found. Run eligibility check first.',
      );
    }

    if (!eligibility.eligible) {
      const unmet: string[] = [];
      if (!eligibility.foundation_complete) unmet.push('Foundation incomplete');
      if (!eligibility.levels_complete) unmet.push('Levels incomplete');
      if (!eligibility.pod_deliverables_complete) unmet.push('Pod deliverables incomplete');
      if (!eligibility.capstone_passed) unmet.push('Capstone not passed');
      if (!eligibility.assessor_approved) unmet.push('Assessor approval missing');
      if (!eligibility.payment_cleared) unmet.push('Payment outstanding');

      throw new ForbiddenException(
        `Certificate issuance blocked. Unmet conditions: ${unmet.join(', ')}`,
      );
    }

    // Check for existing certificate
    const existingCert = await this.prisma.certificate.findFirst({
      where: {
        learner_id: dto.learner_id,
        track_id: dto.track_id,
        status: 'active',
      },
    });
    if (existingCert) {
      throw new BadRequestException(
        `Active certificate already exists: ${existingCert.id}`,
      );
    }

    // Issue certificate
    const certId = generateId('CRT');
    const verificationCode = generateCertVerificationCode();

    const certificate = await this.prisma.certificate.create({
      data: {
        id: certId,
        learner_id: dto.learner_id,
        track_id: dto.track_id,
        verification_code: verificationCode,
        issued_at: new Date(),
        status: 'active',
      },
    });

    // Enqueue PDF generation to cert-generation SQS queue
    this.logger.log(
      `[SQS:cert-generation] Enqueuing PDF generation for certificate ${certId} ` +
        `(learner: ${learner.user.email}, track: ${track.name}, verification: ${verificationCode})`,
    );

    this.logger.log(
      `Certificate ${certId} issued for learner ${dto.learner_id} on track ${dto.track_id}`,
    );

    // Fire-and-forget certificate issued email
    try {
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
      await this.emailService.sendCertificateIssuedEmail(
        learner.user.email,
        {
          trackName: track.name,
          verificationCode: verificationCode,
          certificateUrl: `${frontendUrl}/learner/certificates`,
          issueDate: certificate.issued_at.toISOString(),
        },
        learner.user.id,
      );
    } catch (error) {
      this.logger.error(
        `Failed to queue certificate issued email for certificate ${certId}: ${(error as Error).message}`,
      );
    }

    return {
      id: certificate.id,
      learner_id: certificate.learner_id,
      track_id: certificate.track_id,
      verification_code: certificate.verification_code,
      issued_at: certificate.issued_at,
      status: certificate.status,
      learner_name: learner.user.email,
      track_name: track.name,
    };
  }

  // ── Public Certificate Verification & Revocation ──────────────

  /**
   * Public verification of a certificate by its KFCERT-* verification code.
   * No authentication required.
   * Returns validity status and certificate details if valid, or revoked status if revoked.
   */
  async verifyCertificate(verificationCode: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { verification_code: verificationCode },
      include: {
        learner: { include: { user: true } },
        track: true,
      },
    });

    if (!certificate) {
      throw new NotFoundException(
        `Certificate with verification code ${verificationCode} not found`,
      );
    }

    const valid = certificate.status === 'active';

    return {
      valid,
      verification_code: certificate.verification_code,
      status: certificate.status,
      certificate_id: certificate.id,
      ...(valid
        ? {
            learner_name: certificate.learner.user.email,
            track_name: certificate.track.name,
            issued_at: certificate.issued_at,
          }
        : {
            revocation_reason: certificate.revocation_reason,
          }),
    };
  }

  /**
   * Revoke a certificate by its CRT-* ID.
   * Admin-only operation. Records revocation reason.
   */
  async revokeCertificate(certificateId: string, dto: RevokeCertificateDto) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificate ${certificateId} not found`);
    }

    if (certificate.status === 'revoked') {
      throw new BadRequestException(
        `Certificate ${certificateId} is already revoked`,
      );
    }

    const updated = await this.prisma.certificate.update({
      where: { id: certificateId },
      data: {
        status: 'revoked',
        revocation_reason: dto.reason,
      },
    });

    this.logger.log(
      `Certificate ${certificateId} revoked. Reason: ${dto.reason}`,
    );

    return {
      id: updated.id,
      learner_id: updated.learner_id,
      track_id: updated.track_id,
      verification_code: updated.verification_code,
      status: updated.status,
      revocation_reason: updated.revocation_reason,
    };
  }
}
