/**
 * @file email.module.ts — NestJS module for the transactional email system.
 * Provides EmailService (SQS publisher) and UnsubscribeService (GDPR-compliant
 * preference management) to all domain modules. Registers EmailController for
 * the public unsubscribe endpoint. Imports JwtModule for purpose-scoped token
 * generation (password reset, unsubscribe). PrismaService is available globally
 * via CommonModule so no explicit import is needed.
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EmailService } from './email.service';
import { UnsubscribeService } from './unsubscribe.service';
import { EmailController } from './email.controller';

/** JWT expiration in seconds (default: 3600 = 1 hour) */
const JWT_EXPIRATION_SECONDS = parseInt(
  process.env.JWT_EXPIRATION_SECONDS ?? '3600',
  10,
);

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
      signOptions: { expiresIn: JWT_EXPIRATION_SECONDS },
    }),
  ],
  controllers: [EmailController],
  providers: [EmailService, UnsubscribeService],
  exports: [EmailService, UnsubscribeService],
})
export class EmailModule {}
