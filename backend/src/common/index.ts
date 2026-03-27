/**
 * @file common/index.ts
 * Barrel export for all shared utilities, services, guards, interceptors,
 * filters, decorators, and DTOs used across backend domain modules.
 */
export { CommonModule } from './common.module';
export { PrismaService } from './prisma';
export { CacheService } from './cache';
export { generateId, generateCertVerificationCode, ENTITY_PREFIXES } from './utils';
export type { EntityPrefix } from './utils';
export { PaginationDto, PaginatedResponseDto } from './dto';
export { HttpExceptionFilter } from './filters';
export { LoggingInterceptor, TracingInterceptor } from './interceptors';
export { JwtAuthGuard, RbacGuard } from './guards';
export { Roles } from './decorators';
