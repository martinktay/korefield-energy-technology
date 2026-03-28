/**
 * @file content.controller.ts
 * REST controller for the content domain.
 * Exposes endpoints for track catalog browsing, curriculum management,
 * lesson retrieval, lab session scheduling/submission/feedback,
 * and in-browser coding exercise creation/execution.
 * Write operations require Instructor/Admin/SuperAdmin roles via RBAC.
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ContentService } from './content.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { ScheduleLabSessionDto } from './dto/schedule-lab-session.dto';
import { UpdateLabRecordingDto } from './dto/update-lab-recording.dto';
import { SubmitLabWorkDto } from './dto/submit-lab-work.dto';
import { LabFeedbackDto } from './dto/lab-feedback.dto';
import { CreateCodingExerciseDto } from './dto/create-coding-exercise.dto';
import { ExecuteCodeDto } from './dto/execute-code.dto';
import { RbacGuard } from '@common/guards/rbac.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UploadService } from './upload.service';

@Controller('content')
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly uploadService: UploadService,
  ) {}

  @Get('tracks')
  async getTrackCatalog() {
    return this.contentService.getTrackCatalog();
  }

  @Get('tracks/:trackId')
  async getTrackDetail(@Param('trackId') trackId: string) {
    return this.contentService.getTrackDetail(trackId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('tracks/:trackId/curriculum')
  async getTrackCurriculum(@Param('trackId') trackId: string) {
    return this.contentService.getTrackCurriculum(trackId);
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Post('modules')
  async createModule(@Body() dto: CreateModuleDto) {
    return this.contentService.createModule(dto);
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Put('modules/:moduleId')
  async updateModule(
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.contentService.updateModule(moduleId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('lessons/:lessonId')
  async getLesson(@Param('lessonId') lessonId: string) {
    return this.contentService.getLesson(lessonId);
  }

  // ── Lesson CRUD Endpoints ────────────────────────────────────

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Post('lessons')
  async createLesson(@Body() dto: CreateLessonDto) {
    return this.contentService.createLesson(dto);
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Put('lessons/:lessonId')
  async updateLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.contentService.updateLesson(lessonId, dto);
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Delete('lessons/:lessonId')
  async deleteLesson(@Param('lessonId') lessonId: string) {
    return this.contentService.deleteLesson(lessonId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('modules/:moduleId/lessons')
  async getModuleLessons(@Param('moduleId') moduleId: string) {
    return this.contentService.getModuleLessons(moduleId);
  }

  // ── Assessment CRUD Endpoints ────────────────────────────────

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Post('assessments')
  async createAssessment(@Body() dto: CreateAssessmentDto) {
    return this.contentService.createAssessment(dto);
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Put('assessments/:assessmentId')
  async updateAssessment(
    @Param('assessmentId') assessmentId: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.contentService.updateAssessment(assessmentId, dto);
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Delete('assessments/:assessmentId')
  async deleteAssessment(@Param('assessmentId') assessmentId: string) {
    return this.contentService.deleteAssessment(assessmentId);
  }

  // ── File Upload Endpoint ─────────────────────────────────────

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Post('upload/presign')
  async getPresignedUploadUrl(@Body() dto: PresignUploadDto) {
    return this.uploadService.generatePresignedUrl(dto.filename, dto.content_type);
  }

  // ── AI Foundation School Endpoint ───────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('foundation')
  async getFoundationContent() {
    return this.contentService.getFoundationContent();
  }

  // ── Lab Session Endpoints ────────────────────────────────────

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Post('labs')
  async scheduleLabSession(@Body() dto: ScheduleLabSessionDto) {
    return this.contentService.scheduleLabSession(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('labs/:labId')
  async getLabSession(@Param('labId') labId: string) {
    return this.contentService.getLabSession(labId);
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Put('labs/:labId/recording')
  async updateLabRecording(
    @Param('labId') labId: string,
    @Body() dto: UpdateLabRecordingDto,
  ) {
    return this.contentService.updateLabRecording(labId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('labs/:labId/submit')
  async submitLabWork(
    @Param('labId') labId: string,
    @Body() dto: SubmitLabWorkDto,
  ) {
    return this.contentService.submitLabWork(labId, dto);
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Post('labs/:labId/feedback')
  async provideLabFeedback(
    @Param('labId') labId: string,
    @Body() dto: LabFeedbackDto,
  ) {
    return this.contentService.provideLabFeedback(labId, dto);
  }

  // ── Coding Exercise Endpoints ────────────────────────────────

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin', 'Admin', 'Instructor')
  @Post('exercises')
  async createCodingExercise(@Body() dto: CreateCodingExerciseDto) {
    return this.contentService.createCodingExercise(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('exercises/:exerciseId')
  async getCodingExercise(@Param('exerciseId') exerciseId: string) {
    return this.contentService.getCodingExercise(exerciseId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('exercises/:exerciseId/execute')
  async executeExercise(
    @Param('exerciseId') exerciseId: string,
    @Body() dto: ExecuteCodeDto,
  ) {
    return this.contentService.executeExercise(exerciseId, dto);
  }
}
