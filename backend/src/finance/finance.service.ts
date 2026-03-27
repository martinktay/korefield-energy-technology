import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** P&L overview — revenue from paid installments vs recorded expenses */
  async getPLSummary() {
    const paidInstallments = await this.prisma.installment.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true },
    });

    const totalRevenue = paidInstallments._sum.amount ?? 0;

    // Expenses would come from a dedicated expenses table in production
    // For now, return structure with revenue from actual data
    return {
      revenue: { total: totalRevenue },
      // Expense data would be populated from CapEx/OpEx tables
    };
  }

  /** Payroll summary — aggregate staff costs from user records */
  async getPayrollSummary() {
    const staffCount = await this.prisma.user.count({
      where: {
        role: { in: ['SuperAdmin', 'Admin', 'Instructor', 'Assessor', 'FinanceAdmin', 'DevOpsEngineer'] },
        status: 'Active',
      },
    });

    return { activeStaff: staffCount };
  }

  /** Recruitment cost metrics */
  async getRecruitmentCosts() {
    const totalApplications = await this.prisma.application.count();
    const hiredCount = await this.prisma.application.count({
      where: { status: 'hired' },
    });

    return {
      totalApplications,
      hiredCount,
      costPerHire: hiredCount > 0 ? 0 : 0, // Would be calculated from actual recruitment spend
    };
  }
}
