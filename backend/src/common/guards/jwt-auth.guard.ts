import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT authentication guard using Passport.js JWT strategy.
 * Validates Bearer token from Authorization header and attaches
 * the authenticated user to the request object.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
