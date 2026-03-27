/**
 * @file jwt.strategy.ts
 * Passport JWT strategy for validating Bearer tokens on protected routes.
 * Extracts the JWT from the Authorization header, verifies it, and attaches
 * the authenticated user to the request object.
 */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@common/prisma/prisma.service';

/** Shape of the decoded JWT payload used across auth flows */
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  mfaVerified?: boolean;
  iat: number;
  exp: number;
}

/**
 * Passport JWT strategy for Bearer token authentication.
 * Extracts the token from the Authorization header, verifies signature/expiry,
 * then loads the user from the database to confirm they still exist and are active.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
    });
  }

  /**
   * Validate the decoded JWT payload by loading the user from the database.
   * Rejects tokens for deleted or deactivated users.
   * @returns Sanitized user object attached to the request
   */
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'Active') {
      throw new UnauthorizedException('Account is not active');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      mfaVerified: payload.mfaVerified ?? false,
    };
  }
}
