import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacGuard, ROLES_KEY, MFA_REQUIRED_ROLES } from './rbac.guard';

function createMockContext(user: Record<string, unknown> | null): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
      getResponse: jest.fn(),
      getNext: jest.fn(),
    }),
  } as unknown as ExecutionContext;
}

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RbacGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ id: 'USR-1', role: 'Learner' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow access when user has a matching role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin', 'Learner']);
    const ctx = createMockContext({ id: 'USR-1', role: 'Learner' });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user has no matching role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SuperAdmin']);
    const ctx = createMockContext({ id: 'USR-1', role: 'Learner' });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Insufficient permissions');
  });

  it('should throw ForbiddenException when no user is on the request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);
    const ctx = createMockContext(null);

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('No authenticated user found');
  });

  describe('MFA enforcement for privileged roles', () => {
    const mfaRoles = [
      'SuperAdmin',
      'Instructor',
      'Assessor',
      'CorporatePartner',
      'FinanceAdmin',
      'DevOpsEngineer',
    ];

    const nonMfaRoles = ['Learner', 'Admin'];

    it.each(mfaRoles)(
      'should block %s without MFA verification',
      (role) => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([role]);
        const ctx = createMockContext({ id: 'USR-1', role, mfaVerified: false });

        expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(ctx)).toThrow(/MFA verification required/);
      },
    );

    it.each(mfaRoles)(
      'should allow %s with MFA verification',
      (role) => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([role]);
        const ctx = createMockContext({ id: 'USR-1', role, mfaVerified: true });

        expect(guard.canActivate(ctx)).toBe(true);
      },
    );

    it.each(nonMfaRoles)(
      'should allow %s without MFA verification',
      (role) => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([role]);
        const ctx = createMockContext({ id: 'USR-1', role, mfaVerified: false });

        expect(guard.canActivate(ctx)).toBe(true);
      },
    );
  });

  describe('MFA_REQUIRED_ROLES constant', () => {
    it('should contain exactly the 6 privileged roles', () => {
      expect(MFA_REQUIRED_ROLES.size).toBe(6);
      expect(MFA_REQUIRED_ROLES.has('SuperAdmin')).toBe(true);
      expect(MFA_REQUIRED_ROLES.has('Instructor')).toBe(true);
      expect(MFA_REQUIRED_ROLES.has('Assessor')).toBe(true);
      expect(MFA_REQUIRED_ROLES.has('CorporatePartner')).toBe(true);
      expect(MFA_REQUIRED_ROLES.has('FinanceAdmin')).toBe(true);
      expect(MFA_REQUIRED_ROLES.has('DevOpsEngineer')).toBe(true);
    });

    it('should NOT contain Learner or Admin', () => {
      expect(MFA_REQUIRED_ROLES.has('Learner')).toBe(false);
      expect(MFA_REQUIRED_ROLES.has('Admin')).toBe(false);
    });
  });

  describe('least-privilege enforcement', () => {
    it('should prevent Learner from accessing Admin-only endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['Admin']);
      const ctx = createMockContext({ id: 'USR-1', role: 'Learner' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should prevent Instructor from accessing SuperAdmin-only endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SuperAdmin']);
      const ctx = createMockContext({ id: 'USR-1', role: 'Instructor', mfaVerified: true });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should prevent Admin from accessing SuperAdmin-only endpoints', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['SuperAdmin']);
      const ctx = createMockContext({ id: 'USR-1', role: 'Admin' });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });
});
