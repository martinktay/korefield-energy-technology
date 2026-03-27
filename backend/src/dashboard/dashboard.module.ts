/**
 * @file dashboard.module.ts
 * Dashboard module providing aggregated data endpoints for all portal types.
 * Consumes PrismaService from the global CommonModule.
 */
import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
