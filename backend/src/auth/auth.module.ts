/**
 * @file auth.module.ts
 * NestJS module for the authentication domain.
 * Configures Passport JWT strategy, registers auth providers,
 * and exports AuthService/JwtModule for use by other modules.
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { EmailModule } from '../email/email.module';

/** JWT expiration in seconds (default: 3600 = 1 hour) */
const JWT_EXPIRATION_SECONDS = parseInt(
  process.env.JWT_EXPIRATION_SECONDS ?? '3600',
  10,
);

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      signOptions: { expiresIn: JWT_EXPIRATION_SECONDS },
    }),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
