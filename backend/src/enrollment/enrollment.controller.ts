/**
 * @file enrollment.controller.ts
 * REST controller for the enrollment domain.
 * Exposes endpoints for learner registration, onboarding, AI Foundation School progress,
 * Track enrollment, waitlist management, pod assignment/activation, and performance gate evaluation.
 * All endpoints require JWT authentication.
 */
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { EnrollmentService } from './enrollment.service';
import { RegisterLearnerDto } from './dto/register-learner.dto';
import { OnboardLearnerDto } from './dto/onboard-learner.dto';
import { CompleteFoundationModuleDto } from './dto/complete-foundation-module.dto';
import { EnrollTrackDto } from './dto/enroll-track.dto';
import { JoinWaitlistDto } from './dto/join-waitlist.dto';
import { AssignPodDto } from './dto/assign-pod.dto';
import { ActivatePodDto } from './dto/activate-pod.dto';
import { EvaluateGateDto } from './dto/evaluate-gate.dto';
import { UpdateLearnerDto } from './dto/update-learner.dto';

/**
 * Enrollment controller managing the learner journey from registration through progression.
 * All endpoints are prefixed with `/enrollment`.
 */
@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('register')
  async register(@Body() dto: RegisterLearnerDto) {
    return this.enrollmentService.registerLearner(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('onboard')
  async onboard(@Body() dto: OnboardLearnerDto) {
    return this.enrollmentService.onboardLearner(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('foundation/progress')
  async getFoundationProgress(@Query('learner_id') learnerId: string) {
    return this.enrollmentService.getFoundationProgress(learnerId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('foundation/complete-module')
  async completeFoundationModule(@Body() dto: CompleteFoundationModuleDto) {
    return this.enrollmentService.completeFoundationModule(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('foundation/status')
  async getFoundationStatus(@Query('learner_id') learnerId: string) {
    return this.enrollmentService.getFoundationStatus(learnerId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tracks/:trackId/enroll')
  async enrollInTrack(
    @Param('trackId') trackId: string,
    @Body() dto: EnrollTrackDto,
  ) {
    return this.enrollmentService.enrollInTrack(trackId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('waitlist/:trackId')
  async joinWaitlist(
    @Param('trackId') trackId: string,
    @Body() dto: JoinWaitlistDto,
  ) {
    return this.enrollmentService.joinWaitlist(trackId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('pods/assign')
  async assignPod(@Body() dto: AssignPodDto) {
    return this.enrollmentService.assignLearnerToPod(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('pods/:podId')
  async getPodDetails(@Param('podId') podId: string) {
    return this.enrollmentService.getPodDetails(podId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('pods/:podId/activate')
  async activatePod(
    @Param('podId') podId: string,
    @Body() dto: ActivatePodDto,
  ) {
    return this.enrollmentService.activatePod(podId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('gates/:gateId/evaluate')
  async evaluateGate(
    @Param('gateId') gateId: string,
    @Body() dto: EvaluateGateDto,
  ) {
    return this.enrollmentService.evaluateGate(gateId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('progress')
  async getLearnerProgress(@Query('learner_id') learnerId: string) {
    return this.enrollmentService.getLearnerProgress(learnerId);
  }

  /** PATCH /enrollment/learners/:id — Update mutable learner profile fields (e.g. project_interest). */
  @UseGuards(AuthGuard('jwt'))
  @Patch('learners/:id')
  async updateLearner(
    @Param('id') id: string,
    @Body() dto: UpdateLearnerDto,
  ) {
    return this.enrollmentService.updateLearner(id, dto);
  }
}
