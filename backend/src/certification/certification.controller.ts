/**
 * @file certification.controller.ts
 * REST controller for the certification domain.
 * Exposes endpoints for capstone unlock/submission/evaluation,
 * composite eligibility checks, certificate issuance, public verification,
 * and certificate revocation. Role-gated via RBAC.
 */
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RbacGuard } from '@common/guards/rbac.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CertificationService } from './certification.service';
import { UnlockCapstoneDto } from './dto/unlock-capstone.dto';
import { SubmitCapstoneDto } from './dto/submit-capstone.dto';
import { EvaluateCapstoneDto } from './dto/evaluate-capstone.dto';
import { CheckEligibilityDto } from './dto/check-eligibility.dto';
import { IssueCertificateDto } from './dto/issue-certificate.dto';
import { RevokeCertificateDto } from './dto/revoke-certificate.dto';

@Controller('certification')
export class CertificationController {
  constructor(private readonly certificationService: CertificationService) {}

  /**
   * Unlock a capstone for a learner.
   * Requires Assessor or Admin role (assessor validates readiness).
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Assessor', 'Admin')
  @Post('capstone/unlock')
  async unlockCapstone(@Body() dto: UnlockCapstoneDto) {
    return this.certificationService.unlockCapstone(dto);
  }

  /**
   * Submit a capstone project.
   * Learner-only endpoint.
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Learner')
  @Post('capstone/:capstoneId/submit')
  async submitCapstone(
    @Param('capstoneId') capstoneId: string,
    @Body() dto: SubmitCapstoneDto,
  ) {
    return this.certificationService.submitCapstone(capstoneId, dto);
  }

  /**
   * Evaluate a capstone — schedule defense and record result.
   * Assessor or Admin only.
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Assessor', 'Admin')
  @Post('capstone/:capstoneId/evaluate')
  async evaluateCapstone(
    @Param('capstoneId') capstoneId: string,
    @Body() dto: EvaluateCapstoneDto,
  ) {
    return this.certificationService.evaluateCapstone(capstoneId, dto);
  }

  /**
   * Get capstone details.
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('capstone/:capstoneId')
  async getCapstone(@Param('capstoneId') capstoneId: string) {
    return this.certificationService.getCapstone(capstoneId);
  }

  // ── Certification Eligibility & Certificate Issuance ──────────

  /**
   * Run composite eligibility check for a learner on a track.
   * Creates/updates a CEL-* record with all 6 condition statuses.
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Assessor', 'Admin', 'Learner')
  @Post('eligibility/check')
  async checkEligibility(@Body() dto: CheckEligibilityDto) {
    return this.certificationService.checkEligibility(dto);
  }

  /**
   * Issue a certificate for a learner on a track.
   * Requires all 6 eligibility conditions to be met.
   * Admin or Assessor only.
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'Assessor')
  @Post('certificates/issue')
  async issueCertificate(@Body() dto: IssueCertificateDto) {
    return this.certificationService.issueCertificate(dto);
  }

  /**
   * Assessor approves eligibility for a CEL record.
   * Sets assessor_approved = true and optionally pod_deliverables_complete.
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Assessor', 'Admin')
  @Post('eligibility/:celId/approve')
  async approveEligibility(
    @Param('celId') celId: string,
    @Body() body: { pod_deliverables_complete?: boolean },
  ) {
    return this.certificationService.approveEligibility(
      celId,
      body.pod_deliverables_complete,
    );
  }

  // ── Public Certificate Verification & Revocation ──────────────

  /**
   * Public verification of a certificate by its KFCERT-* verification code.
   * No authentication required.
   */
  @Get('certificates/:verificationCode/verify')
  async verifyCertificate(
    @Param('verificationCode') verificationCode: string,
  ) {
    return this.certificationService.verifyCertificate(verificationCode);
  }

  /**
   * Revoke a certificate. Admin-only.
   * Records revocation reason and updates public verification status.
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin')
  @Post('certificates/:certificateId/revoke')
  async revokeCertificate(
    @Param('certificateId') certificateId: string,
    @Body() dto: RevokeCertificateDto,
  ) {
    return this.certificationService.revokeCertificate(certificateId, dto);
  }
}
