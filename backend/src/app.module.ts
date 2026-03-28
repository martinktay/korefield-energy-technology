/**
 * @file app.module.ts
 * Root application module that composes all domain modules.
 * Each domain (auth, enrollment, payment, content, certification) is an
 * independent NestJS module with its own controllers, services, and DTOs.
 * CommonModule is @Global and provides PrismaService + CacheService to all.
 */
import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { ContentModule } from './content/content.module';
import { PaymentModule } from './payment/payment.module';
import { CertificationModule } from './certification/certification.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { FinanceModule } from './finance/finance.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [CommonModule, AuthModule, EnrollmentModule, ContentModule, PaymentModule, CertificationModule, DashboardModule, RecruitmentModule, FinanceModule, NotificationModule],
})
export class AppModule {}
