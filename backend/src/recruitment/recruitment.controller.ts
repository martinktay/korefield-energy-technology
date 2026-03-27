import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { RbacGuard } from '@common/guards/rbac.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { RecruitmentService } from './recruitment.service';
import { ApplyDto, UpdateApplicationStatusDto } from './dto';

@Controller('careers')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  /**
   * POST /careers/apply — Public endpoint.
   * Accepts multipart form with CV file upload.
   */
  @Post('apply')
  @UseInterceptors(FileInterceptor('cv'))
  async apply(
    @Body() dto: ApplyDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const cvFilename = file?.originalname || 'unknown.pdf';
    const cvText = file?.buffer?.toString('utf-8') || '';
    const cvS3Key = `cvs/${dto.job_opening_id}/${Date.now()}-${cvFilename}`;

    // In production: upload file.buffer to S3 at cvS3Key
    // For now, we store the key and process the text for ATS scoring

    return this.recruitmentService.apply(dto, cvFilename, cvText, cvS3Key);
  }

  /**
   * GET /careers/applications — Admin/SuperAdmin only.
   * List all applications with optional status and department filters.
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Get('applications')
  async listApplications(
    @Query('status') status?: string,
    @Query('department') department?: string,
  ) {
    return this.recruitmentService.listApplications({ status, department });
  }

  /**
   * GET /careers/applications/:id — Admin/SuperAdmin only.
   * Get full application detail with ATS breakdown.
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Get('applications/:id')
  async getApplication(@Param('id') id: string) {
    return this.recruitmentService.getApplication(id);
  }

  /**
   * PATCH /careers/applications/:id/status — Admin/SuperAdmin only.
   * Update application status with optional reviewer notes.
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Patch('applications/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.recruitmentService.updateStatus(id, dto);
  }

  /**
   * GET /careers/applications/:id/cv — Admin/SuperAdmin only.
   * Returns the S3 key for CV download (presigned URL in production).
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Get('applications/:id/cv')
  async getCv(@Param('id') id: string) {
    const app = await this.recruitmentService.getApplication(id);
    return { downloadUrl: this.recruitmentService.getCvDownloadKey(app) };
  }

  /**
   * GET /careers/pipeline — Admin/SuperAdmin only.
   * Returns pipeline KPIs (count by status).
   */
  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Get('pipeline')
  async getPipeline() {
    return this.recruitmentService.getPipelineKPIs();
  }
}
