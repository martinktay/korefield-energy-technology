import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';

/** Roles that require MFA verification before accessing protected endpoints. */
export const MFA_REQUIRED_ROLES: ReadonlySet<string> = new Set([
  'SuperAdmin',
  'Instructor',
  'Assessor',
  'CorporatePartner',
  'FinanceAdmin',
  'DevOpsEngineer',
]);

/**
 * RBAC guard — enforces role-based permissions per endpoint.
 *
 * 1. Reads required roles from the @Roles() decorator metadata.
 * 2. Compares against the authenticated user's role from the JWT payload.
 * 3. For MFA-required roles, verifies that the user has completed MFA.
 */
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No roles specified — endpoint is open to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No authenticated user found');
    }

    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Enforce MFA for privileged roles
    if (MFA_REQUIRED_ROLES.has(user.role) && !user.mfaVerified) {
      throw new ForbiddenException(
        'MFA verification required. Please complete MFA before accessing this resource.',
      );
    }

    return true;
  }
}
