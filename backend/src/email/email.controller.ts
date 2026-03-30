/**
 * @file email.controller.ts — REST controller for email-related endpoints.
 * Exposes a public POST /email/unsubscribe endpoint that accepts a
 * self-authenticating JWT token (no auth guard required). The token
 * carries the userId and purpose claim, making it safe for one-click
 * unsubscribe links in email headers (RFC 8058).
 */
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UnsubscribeService } from './unsubscribe.service';

/** DTO for the unsubscribe request body. */
class UnsubscribeDto {
  token!: string;
}

@Controller('email')
export class EmailController {
  constructor(private readonly unsubscribeService: UnsubscribeService) {}

  /**
   * POST /email/unsubscribe — One-click marketing email unsubscribe.
   * No authentication guard is required because the JWT token in the
   * request body is self-authenticating (purpose-scoped, time-limited).
   */
  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Body() body: UnsubscribeDto) {
    await this.unsubscribeService.unsubscribeMarketing(body.token);
    return { message: 'Successfully unsubscribed from marketing emails' };
  }
}
