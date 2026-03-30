/**
 * @file certification.module.ts
 * NestJS module for the certification domain.
 * Manages capstone projects, panel defenses, composite eligibility checks,
 * certificate issuance with KFCERT verification codes, and revocation.
 */
import { Module } from '@nestjs/common';
import { EmailModule } from '@email/email.module';
import { CertificationController } from './certification.controller';
import { CertificationService } from './certification.service';

@Module({
  imports: [EmailModule],
  controllers: [CertificationController],
  providers: [CertificationService],
  exports: [CertificationService],
})
export class CertificationModule {}
