/**
 * @file logs.controller.ts
 * REST controller for client-side error logging.
 * Accepts batched error payloads from the frontend and forwards them
 * to CloudWatch Logs. Rate-limited to 100 requests per minute per IP.
 */
import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LogsService, ErrorPayload } from './logs.service';

/** Request body shape for the client-errors endpoint. */
interface ClientErrorsBody {
  errors: ErrorPayload[];
}

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  /**
   * POST /logs/client-errors — accepts batched client error payloads.
   * Rate-limited to 100 requests per minute per IP to prevent abuse.
   */
  @Post('client-errors')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async logClientErrors(@Body() body: ClientErrorsBody) {
    await this.logsService.forwardErrors(body.errors);
    return { received: true };
  }
}
