/**
 * @file enrollment.module.ts
 * NestJS module for the enrollment domain.
 * Manages learner registration, onboarding, AI Foundation School, Track enrollment,
 * pod assignment, and performance-gated progression.
 */
import { Module } from '@nestjs/common';
import { EnrollmentController } from './enrollment.controller';
import { EnrollmentService } from './enrollment.service';

@Module({
  controllers: [EnrollmentController],
  providers: [EnrollmentService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
