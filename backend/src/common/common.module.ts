/**
 * @file common.module.ts
 * Global shared module providing cross-cutting services to all domain modules.
 * Marked @Global so PrismaService and CacheService are available everywhere
 * without explicit imports in each feature module.
 */
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { CacheService } from './cache/cache.service';

@Global()
@Module({
  providers: [PrismaService, CacheService],
  exports: [PrismaService, CacheService],
})
export class CommonModule {}
