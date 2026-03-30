/**
 * @file progress.controller.ts
 * REST controller for learner lesson progress.
 * All endpoints require JWT authentication and restrict access so
 * learners can only read/write their own progress records.
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ProgressService, SaveProgressPayload } from './progress.service';

/** Authenticated request with user payload from JWT. */
interface AuthenticatedRequest extends Request {
  user: { id: string; role: string; learnerId?: string };
}

@Controller('progress')
@UseGuards(AuthGuard('jwt'))
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * POST /progress/lessons/:lessonId — save lesson progress.
   * Upserts by learner_id + lesson_id.
   */
  @Post('lessons/:lessonId')
  async saveProgress(
    @Param('lessonId') lessonId: string,
    @Body() body: SaveProgressPayload,
    @Req() req: AuthenticatedRequest,
  ) {
    const learnerId = this.extractLearnerId(req);
    return this.progressService.saveProgress(learnerId, lessonId, body);
  }

  /**
   * PUT /progress/lessons/:lessonId/complete — mark lesson completed.
   */
  @Put('lessons/:lessonId/complete')
  async markCompleted(
    @Param('lessonId') lessonId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const learnerId = this.extractLearnerId(req);
    return this.progressService.markCompleted(learnerId, lessonId);
  }

  /**
   * GET /progress/lessons — fetch all progress for the authenticated learner.
   */
  @Get('lessons')
  async getAllProgress(@Req() req: AuthenticatedRequest) {
    const learnerId = this.extractLearnerId(req);
    return this.progressService.getAllProgress(learnerId);
  }

  /**
   * Extract the learner ID from the authenticated request.
   * Ensures learners can only access their own records.
   */
  private extractLearnerId(req: AuthenticatedRequest): string {
    const learnerId = req.user?.learnerId;
    if (!learnerId) {
      throw new ForbiddenException('Only learners can access progress records');
    }
    return learnerId;
  }
}
