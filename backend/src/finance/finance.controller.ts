import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RbacGuard } from '@common/guards/rbac.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(AuthGuard('jwt'), RbacGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Roles('SuperAdmin', 'FinanceAdmin')
  @Get('pl-summary')
  async getPLSummary() {
    return this.financeService.getPLSummary();
  }

  @Roles('SuperAdmin', 'FinanceAdmin')
  @Get('payroll')
  async getPayrollSummary() {
    return this.financeService.getPayrollSummary();
  }

  @Roles('SuperAdmin', 'FinanceAdmin')
  @Get('recruitment-costs')
  async getRecruitmentCosts() {
    return this.financeService.getRecruitmentCosts();
  }
}
