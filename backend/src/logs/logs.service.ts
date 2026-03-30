/**
 * @file logs.service.ts
 * Service for forwarding client-side error payloads to AWS CloudWatch Logs.
 * Writes batched error events to the log group
 * `/korefield-academy/{env}/client-errors` using the AWS SDK.
 */
import { Injectable, Logger } from '@nestjs/common';
import {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  CreateLogStreamCommand,
  ResourceAlreadyExistsException,
} from '@aws-sdk/client-cloudwatch-logs';

/** Shape of a single client error payload. */
export interface ErrorPayload {
  message: string;
  stack?: string;
  pageUrl?: string;
  userAgent?: string;
  timestamp?: string;
  userId?: string;
}

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private readonly cwClient: CloudWatchLogsClient;
  private readonly logGroupName: string;
  private readonly logStreamName: string;

  constructor() {
    this.cwClient = new CloudWatchLogsClient({});
    const env = process.env.NODE_ENV ?? 'development';
    this.logGroupName = `/korefield-academy/${env}/client-errors`;
    this.logStreamName = `client-errors-${new Date().toISOString().slice(0, 10)}`;
  }

  /**
   * Forward an array of client error payloads to CloudWatch Logs.
   * Creates the log stream if it doesn't exist, then writes all events.
   */
  async forwardErrors(errors: ErrorPayload[]): Promise<void> {
    if (!errors || errors.length === 0) return;

    try {
      await this.ensureLogStream();

      const logEvents = errors.map((err) => ({
        timestamp: err.timestamp ? new Date(err.timestamp).getTime() : Date.now(),
        message: JSON.stringify({
          message: err.message,
          stack: err.stack,
          pageUrl: err.pageUrl,
          userAgent: err.userAgent,
          userId: err.userId,
          receivedAt: new Date().toISOString(),
        }),
      }));

      await this.cwClient.send(
        new PutLogEventsCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
          logEvents,
        }),
      );

      this.logger.log(`Forwarded ${errors.length} client error(s) to CloudWatch`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Failed to forward client errors to CloudWatch: ${errorMessage}`);
    }
  }

  /**
   * Ensure the log stream exists, creating it if necessary.
   */
  private async ensureLogStream(): Promise<void> {
    try {
      await this.cwClient.send(
        new CreateLogStreamCommand({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
        }),
      );
    } catch (err: unknown) {
      if (err instanceof ResourceAlreadyExistsException) {
        return; // Stream already exists
      }
      throw err;
    }
  }
}
