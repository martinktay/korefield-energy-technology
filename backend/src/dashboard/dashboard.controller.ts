/**
 * @file dashboard.controller.ts
 * REST controller exposing aggregated dashboard endpoints for all portal types.
 * All endpoints require JWT auth. Admin/SuperAdmin endpoints require RBAC guards.
 */
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RbacGuard } from '@common/guards/rbac.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';

interface AuthRequest {
  user: { id: string; email: string; role: string };
}

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ── Admin Endpoints ───────────────────────────────────────────

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Get('admin')
  async getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Get('admin/users')
  async getAdminUsers() {
    return this.dashboardService.getAdminUsers();
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Get('admin/enrollments')
  async getAdminEnrollments() {
    return this.dashboardService.getAdminEnrollments();
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Get('admin/payments')
  async getAdminPayments() {
    return this.dashboardService.getAdminPayments();
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Get('admin/certificates')
  async getAdminCertificates() {
    return this.dashboardService.getAdminCertificates();
  }

  // ── Super Admin Endpoints ─────────────────────────────────────

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Admin', 'SuperAdmin')
  @Get('admin/recruitment')
  async getAdminRecruitment() {
    return this.dashboardService.getRecruitmentPipeline();
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin')
  @Get('super-admin')
  async getSuperAdminKPIs() {
    return this.dashboardService.getSuperAdminKPIs();
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin')
  @Get('super-admin/revenue')
  async getSuperAdminRevenue() {
    return this.dashboardService.getSuperAdminRevenue();
  }

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('SuperAdmin')
  @Get('super-admin/enrollments')
  async getSuperAdminEnrollments() {
    return this.dashboardService.getSuperAdminEnrollments();
  }

  // ── Instructor Endpoint ───────────────────────────────────────

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Instructor', 'Admin', 'SuperAdmin')
  @Get('instructor')
  async getInstructorDashboard(@Request() req: AuthRequest) {
    return this.dashboardService.getInstructorDashboard(req.user.id);
  }

  // ── Assessor Endpoint ─────────────────────────────────────────

  @UseGuards(AuthGuard('jwt'), RbacGuard)
  @Roles('Assessor', 'Admin', 'SuperAdmin')
  @Get('assessor')
  async getAssessorDashboard(@Request() req: AuthRequest) {
    return this.dashboardService.getAssessorDashboard(req.user.id);
  }

  // ── Learner Endpoints ─────────────────────────────────────────

  @UseGuards(AuthGuard('jwt'))
  @Get('learner')
  async getLearnerDashboard(@Request() req: AuthRequest) {
    return this.dashboardService.getLearnerDashboard(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('learner/payments')
  async getLearnerPayments(@Request() req: AuthRequest) {
    return this.dashboardService.getLearnerPayments(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('learner/certificates')
  async getLearnerCertificates(@Request() req: AuthRequest) {
    return this.dashboardService.getLearnerCertificates(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('learner/pods')
  async getLearnerPods(@Request() req: AuthRequest) {
    return this.dashboardService.getLearnerPods(req.user.id);
  }
}
