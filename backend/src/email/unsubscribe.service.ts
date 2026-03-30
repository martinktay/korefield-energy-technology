/**
 * @file unsubscribe.service.ts — GDPR-compliant unsubscribe preference manager.
 * Manages per-user email preferences stored in the email_preferences table.
 * Uses purpose-scoped JWTs for self-authenticating one-click unsubscribe links
 * compliant with RFC 8058 (List-Unsubscribe-Post header).
 */
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@common/prisma/prisma.service';
import { generateId } from '@common/utils/generate-id';

/** JWT payload shape for unsubscribe tokens. */
interface UnsubscribeTokenPayload {
  sub: string;
  purpose: 'email-unsubscribe';
}

@Injectable()
export class UnsubscribeService {
  private readonly logger = new Logger(UnsubscribeService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.frontendUrl =
      process.env.FRONTEND_URL ?? 'http://localhost:3000';
  }

  /**
   * Retrieve the email preferences record for a given user.
   * Returns null if no preferences have been set yet.
   */
  async getPreferences(userId: string) {
    return this.prisma.emailPreference.findUnique({
      where: { user_id: userId },
    });
  }

  /**
   * Opt a user out of marketing emails using a self-authenticating token.
   * The token is a purpose-scoped JWT containing the userId — no session
   * or auth header is required (the token itself is the credential).
   */
  async unsubscribeMarketing(token: string): Promise<void> {
    const payload = this.verifyUnsubscribeToken(token);
    const userId = payload.sub;

    await this.prisma.emailPreference.upsert({
      where: { user_id: userId },
      update: {
        marketing_opted_out: true,
        marketing_opted_out_at: new Date(),
      },
      create: {
        id: generateId('EPR'),
        user_id: userId,
        marketing_opted_out: true,
        marketing_opted_out_at: new Date(),
      },
    });

    this.logger.log(`User ${userId} unsubscribed from marketing emails`);
  }

  /**
   * Re-subscribe a user to marketing emails (e.g. from a settings page).
   */
  async resubscribeMarketing(userId: string): Promise<void> {
    await this.prisma.emailPreference.upsert({
      where: { user_id: userId },
      update: {
        marketing_opted_out: false,
        marketing_opted_out_at: null,
      },
      create: {
        id: generateId('EPR'),
        user_id: userId,
        marketing_opted_out: false,
      },
    });

    this.logger.log(`User ${userId} re-subscribed to marketing emails`);
  }

  /**
   * Check whether a user has opted out of marketing emails.
   * Returns false if no preference record exists (default: opted in).
   */
  async isMarketingOptedOut(userId: string): Promise<boolean> {
    const pref = await this.prisma.emailPreference.findUnique({
      where: { user_id: userId },
    });
    return pref?.marketing_opted_out ?? false;
  }

  /**
   * Generate a purpose-scoped JWT for one-click unsubscribe.
   * Token contains `purpose: 'email-unsubscribe'` and expires in 30 days.
   */
  generateUnsubscribeToken(userId: string): string {
    return this.jwtService.sign(
      { sub: userId, purpose: 'email-unsubscribe' } satisfies UnsubscribeTokenPayload,
      { expiresIn: '30d' },
    );
  }

  /**
   * Generate an RFC 8058 compliant one-click unsubscribe URL.
   * The URL is suitable for use in List-Unsubscribe and
   * List-Unsubscribe-Post email headers.
   */
  generateUnsubscribeUrl(userId: string): string {
    const token = this.generateUnsubscribeToken(userId);
    return `${this.frontendUrl}/email/unsubscribe?token=${token}`;
  }

  /**
   * Verify and decode an unsubscribe JWT token.
   * Throws UnauthorizedException if the token is invalid, expired,
   * or does not carry the correct purpose claim.
   */
  private verifyUnsubscribeToken(token: string): UnsubscribeTokenPayload {
    try {
      const payload = this.jwtService.verify<UnsubscribeTokenPayload>(token);

      if (payload.purpose !== 'email-unsubscribe') {
        throw new UnauthorizedException('Invalid unsubscribe token purpose');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      this.logger.warn(`Invalid unsubscribe token: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired unsubscribe token');
    }
  }
}
