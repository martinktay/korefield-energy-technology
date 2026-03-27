import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../guards/rbac.guard';

/**
 * Decorator to specify which roles are allowed to access a route.
 * Usage: @Roles('SuperAdmin', 'Admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
