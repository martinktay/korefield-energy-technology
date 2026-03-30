import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { EmailService } from './email.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock generateId
jest.mock('@common/utils/generate-id', () => ({
  generateId: jest.fn(),
}));

import { generateId } from '@common/utils/generate-id';

const mockGenerateId = generateId as jest.MockedFunction<typeof generateId>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    session: { create: jest.Mock };
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock; decode: jest.Mock };
  let emailService: { sendVerificationEmail: jest.Mock; sendWelcomeEmail: jest.Mock; sendMfaSetupConfirmationEmail: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      session: {
        create: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
    };

    emailService = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
      sendMfaSetupConfirmationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'learner@example.com',
      password: 'SecurePass123',
      role: 'Learner' as const,
    };

    it('should create a user with hashed password and USR-* ID', async () => {
      mockGenerateId.mockReturnValue('USR-abc123' as any);
      mockBcryptHash.mockResolvedValue('hashed_password' as never);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'USR-abc123',
        email: registerDto.email,
        role: registerDto.role,
        status: 'PendingVerification',
      });
      jwtService.sign.mockReturnValue('verification-token');

      const result = await service.register(registerDto);

      expect(mockGenerateId).toHaveBeenCalledWith('USR');
      expect(mockBcryptHash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'USR-abc123',
          email: registerDto.email,
          password_hash: 'hashed_password',
          role: registerDto.role,
          status: 'PendingVerification',
          email_verified: false,
        }),
      });
      expect(result.id).toMatch(/^USR-/);
      expect(result.email).toBe(registerDto.email);
      expect(result.role).toBe(registerDto.role);
      expect(result.status).toBe('PendingVerification');
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        registerDto.email,
        'verification-token',
      );
    });

    it('should throw ConflictException with password recovery suggestion for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'USR-existing',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      await expect(service.register(registerDto)).rejects.toThrow(
        /password recovery/i,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('should activate account on valid verification token', async () => {
      jwtService.verify.mockReturnValue({ sub: 'USR-abc123', purpose: 'email-verification' });
      prisma.user.findUnique.mockResolvedValue({
        id: 'USR-abc123',
        email_verified: false,
        status: 'PendingVerification',
      });
      prisma.user.update.mockResolvedValue({
        id: 'USR-abc123',
        email_verified: true,
        status: 'Active',
      });

      const result = await service.verifyEmail('valid-token');

      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'USR-abc123' },
        data: { email_verified: true, status: 'Active' },
      });
      expect(result.message).toBe('Email verified successfully');
    });

    it('should return already-verified message if email already verified', async () => {
      jwtService.verify.mockReturnValue({ sub: 'USR-abc123', purpose: 'email-verification' });
      prisma.user.findUnique.mockResolvedValue({
        id: 'USR-abc123',
        email_verified: true,
      });

      const result = await service.verifyEmail('valid-token');

      expect(result.message).toBe('Email already verified');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for expired/invalid token', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.verifyEmail('expired-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for wrong token purpose', async () => {
      jwtService.verify.mockReturnValue({ sub: 'USR-abc123', purpose: 'password-reset' });

      await expect(service.verifyEmail('wrong-purpose-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    const loginDto = { email: 'learner@example.com', password: 'SecurePass123' };

    const activeUser = {
      id: 'USR-abc123',
      email: 'learner@example.com',
      password_hash: 'hashed_password',
      role: 'Learner',
      email_verified: true,
      status: 'Active',
    };

    it('should return valid JWT with correct claims on successful login', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);
      mockBcryptCompare.mockResolvedValue(true as never);
      mockGenerateId.mockReturnValue('SES-sess01' as any);
      mockBcryptHash.mockResolvedValue('token_hash' as never);

      const now = Math.floor(Date.now() / 1000);
      jwtService.sign.mockReturnValue('jwt-access-token');
      jwtService.decode.mockReturnValue({
        sub: activeUser.id,
        email: activeUser.email,
        role: activeUser.role,
        iat: now,
        exp: now + 3600,
      });

      const result = await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: activeUser.id,
        email: activeUser.email,
        role: activeUser.role,
      });
      expect(result.accessToken).toBe('jwt-access-token');
      expect(result.user).toEqual({
        id: activeUser.id,
        email: activeUser.email,
        role: activeUser.role,
      });
      // Session should be created
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'SES-sess01',
          user_id: activeUser.id,
          jwt_token_hash: 'token_hash',
        }),
      });
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(activeUser);
      mockBcryptCompare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unverified email', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        email_verified: false,
      });
      mockBcryptCompare.mockResolvedValue(true as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow(/verify your email/i);
    });

    it('should throw UnauthorizedException for inactive account', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        status: 'Suspended',
      });
      mockBcryptCompare.mockResolvedValue(true as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow(/not active/i);
    });
  });
});
