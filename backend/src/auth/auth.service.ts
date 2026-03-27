/**
 * @file auth.service.ts
 * Core authentication service for KoreField Academy.
 * Handles user registration, email verification, login with session tracking,
 * and TOTP-based MFA setup/verification for privileged roles.
 */
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import { PrismaService } from '@common/prisma/prisma.service';
import { generateId } from '@common/utils/generate-id';
import { MFA_REQUIRED_ROLES } from '@common/guards/rbac.guard';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

/** Cost factor for bcrypt hashing — 12 rounds balances security and performance */
const BCRYPT_ROUNDS = 12;

/**
 * Core authentication service managing the full user identity lifecycle.
 * Coordinates with Prisma for persistence, JWT for token issuance,
 * bcrypt for password hashing, and otplib for TOTP-based MFA.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Register a new user account.
   * Creates the user in PendingVerification status and sends a verification email
   * containing a purpose-scoped JWT token (valid for 24 hours).
   * @throws ConflictException if the email is already registered
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        'An account with this email already exists. Please use the password recovery option to regain access.',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const userId = generateId('USR');

    const user = await this.prisma.user.create({
      data: {
        id: userId,
        email: dto.email,
        password_hash: passwordHash,
        role: dto.role,
        status: 'PendingVerification',
        email_verified: false,
      },
    });

    const verificationToken = this.jwtService.sign(
      { sub: user.id, purpose: 'email-verification' },
      { expiresIn: '24h' },
    );

    await this.emailService.sendVerificationEmail(user.email, verificationToken);

    this.logger.log(`User registered: ${user.id}`);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  /**
   * Verify a user's email using a purpose-scoped JWT token.
   * Transitions the user from PendingVerification to Active status.
   * @throws BadRequestException if the token is invalid, expired, or misused
   */
  async verifyEmail(token: string) {
    let payload: { sub: string; purpose: string };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (payload.purpose !== 'email-verification') {
      throw new BadRequestException('Invalid token purpose');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.email_verified) {
      return { message: 'Email already verified' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        status: 'Active',
      },
    });

    this.logger.log(`Email verified for user: ${user.id}`);

    return { message: 'Email verified successfully' };
  }

  /**
   * Authenticate a user with email and password.
   * Validates credentials, checks email verification and account status,
   * issues a JWT, and persists a session record for audit tracking.
   * @throws UnauthorizedException for invalid credentials or inactive accounts
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.email_verified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    if (user.status !== 'Active') {
      throw new UnauthorizedException('Account is not active');
    }

    const jwtPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(jwtPayload);

    // Store session record
    const sessionId = generateId('SES');
    const tokenHash = await bcrypt.hash(accessToken.slice(-32), 10);
    const decoded = this.jwtService.decode(accessToken) as JwtPayload;

    await this.prisma.session.create({
      data: {
        id: sessionId,
        user_id: user.id,
        jwt_token_hash: tokenHash,
        expires_at: new Date(decoded.exp * 1000),
      },
    });

    this.logger.log(`User logged in: ${user.id}`);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Retrieve a user's profile by ID.
   * Returns a safe subset of user fields (no password hash or MFA secret).
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        mfa_enabled: true,
        email_verified: true,
        status: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Generate a TOTP secret for MFA setup.
   * Returns the secret and an otpauth URI for QR code generation.
   */
  async mfaSetup(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfa_enabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    const secret = authenticator.generateSecret();

    // Store the secret (not yet enabled until confirmed)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfa_secret: secret },
    });

    const otpauthUrl = authenticator.keyuri(
      user.email,
      'KoreField Academy',
      secret,
    );

    this.logger.log(`MFA setup initiated for user: ${userId}`);

    return { secret, otpauthUrl };
  }

  /**
   * Confirm MFA setup by verifying a TOTP token against the stored secret.
   */
  async mfaSetupConfirm(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.mfa_enabled) {
      throw new BadRequestException('MFA is already enabled');
    }

    if (!user.mfa_secret) {
      throw new BadRequestException(
        'MFA setup not initiated. Call POST /auth/mfa/setup first.',
      );
    }

    const isValid = authenticator.verify({
      token,
      secret: user.mfa_secret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfa_enabled: true },
    });

    this.logger.log(`MFA enabled for user: ${userId}`);

    return { message: 'MFA enabled successfully' };
  }

  /**
   * Verify a TOTP token and issue a new JWT with mfaVerified=true.
   * Used after login for roles that require MFA.
   */
  async mfaVerify(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.mfa_enabled || !user.mfa_secret) {
      throw new BadRequestException('MFA is not enabled for this account');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.mfa_secret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid MFA token');
    }

    // Issue a new JWT with mfaVerified claim
    const jwtPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      mfaVerified: true,
    };

    const accessToken = this.jwtService.sign(jwtPayload);

    // Store new session
    const sessionId = generateId('SES');
    const tokenHash = await bcrypt.hash(accessToken.slice(-32), 10);
    const decoded = this.jwtService.decode(accessToken) as JwtPayload;

    await this.prisma.session.create({
      data: {
        id: sessionId,
        user_id: user.id,
        jwt_token_hash: tokenHash,
        expires_at: new Date(decoded.exp * 1000),
      },
    });

    this.logger.log(`MFA verified for user: ${userId}`);

    return {
      accessToken,
      mfaVerified: true,
    };
  }

  /**
   * Check whether a role requires MFA verification.
   */
  isMfaRequired(role: string): boolean {
    return MFA_REQUIRED_ROLES.has(role);
  }
}
