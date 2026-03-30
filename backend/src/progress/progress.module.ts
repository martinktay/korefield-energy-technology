/**
 * @file progress.module.ts
 * NestJS module for learner lesson progress tracking.
 * Provides endpoints for saving, completing, and fetching lesson progress
 * scoped to the authenticated learner.
 */
import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
