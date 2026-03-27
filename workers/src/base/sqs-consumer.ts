/**
 * @file base/sqs-consumer.ts
 * Abstract base class for SQS message consumers.
 * Provides long-polling, JSON parsing, exponential backoff retry (max 3 attempts),
 * dead-letter queue routing for permanently failed messages, and graceful shutdown
 * via SIGINT/SIGTERM handlers. Subclasses implement processMessage() with domain logic.
 */
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SendMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';

export interface SqsConsumerConfig {
  /** Name of the queue (used for logging) */
  queueName: string;
  /** SQS queue URL to poll messages from */
  queueUrl: string;
  /** SQS dead-letter queue URL for permanently failed messages */
  dlqUrl: string;
  /** Max messages per poll (1–10). Default: 10 */
  maxMessages?: number;
  /** Long-poll wait time in seconds (0–20). Default: 20 */
  waitTimeSeconds?: number;
  /** Max retry attempts before routing to DLQ. Default: 3 */
  maxRetries?: number;
  /** Base delay in ms for exponential backoff. Default: 1000 */
  baseBackoffMs?: number;
  /** AWS region. Default: process.env.AWS_REGION || 'us-east-1' */
  region?: string;
}

export interface ParsedMessage<T = unknown> {
  body: T;
  raw: Message;
}

/**
 * Base SQS consumer with message polling, JSON parsing,
 * error handling, exponential backoff retry, and DLQ routing.
 *
 * Subclasses implement `processMessage()` with domain-specific logic.
 */
export abstract class SqsConsumer<T = unknown> {
  protected readonly sqs: SQSClient;
  protected readonly config: Required<SqsConsumerConfig>;
  private running = false;
  private shutdownRequested = false;

  constructor(config: SqsConsumerConfig) {
    this.config = {
      maxMessages: 10,
      waitTimeSeconds: 20,
      maxRetries: 3,
      baseBackoffMs: 1000,
      region: process.env.AWS_REGION || 'us-east-1',
      ...config,
    };

    this.sqs = new SQSClient({ region: this.config.region });
  }

  /** Implement domain-specific message handling in subclasses */
  protected abstract processMessage(message: ParsedMessage<T>): Promise<void>;

  /** Start the polling loop */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.shutdownRequested = false;

    this.log('info', `Starting consumer for queue: ${this.config.queueName}`);
    this.registerShutdownHooks();

    while (!this.shutdownRequested) {
      try {
        await this.poll();
      } catch (err) {
        this.log('error', `Poll cycle error: ${(err as Error).message}`);
        await this.sleep(this.config.baseBackoffMs);
      }
    }

    this.running = false;
    this.log('info', 'Consumer stopped');
  }

  /** Request graceful shutdown after current poll completes */
  stop(): void {
    this.shutdownRequested = true;
    this.log('info', 'Shutdown requested');
  }

  /** Poll SQS for messages and process each one */
  private async poll(): Promise<void> {
    const response = await this.sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: this.config.queueUrl,
        MaxNumberOfMessages: this.config.maxMessages,
        WaitTimeSeconds: this.config.waitTimeSeconds,
        MessageAttributeNames: ['All'],
      }),
    );

    const messages = response.Messages ?? [];
    if (messages.length === 0) return;

    this.log('info', `Received ${messages.length} message(s)`);

    for (const message of messages) {
      if (this.shutdownRequested) break;
      await this.handleMessage(message);
    }
  }

  /** Parse, process, and acknowledge a single message with retry logic */
  private async handleMessage(message: Message): Promise<void> {
    const receiptHandle = message.ReceiptHandle;
    if (!receiptHandle) {
      this.log('warn', 'Message missing ReceiptHandle, skipping');
      return;
    }

    // Parse JSON body
    let parsed: T;
    try {
      parsed = JSON.parse(message.Body ?? '{}') as T;
    } catch {
      this.log('error', `Failed to parse message body, routing to DLQ. MessageId=${message.MessageId}`);
      await this.routeToDlq(message, 'JSON parse failure');
      await this.deleteMessage(receiptHandle);
      return;
    }

    // Attempt processing with exponential backoff retry
    const attempt = this.getReceiveCount(message);
    try {
      await this.processMessage({ body: parsed, raw: message });
      await this.deleteMessage(receiptHandle);
      this.log('info', `Processed message ${message.MessageId}`);
    } catch (err) {
      const errorMsg = (err as Error).message;
      this.log('error', `Processing failed (attempt ${attempt}/${this.config.maxRetries}): ${errorMsg}`);

      if (attempt >= this.config.maxRetries) {
        this.log('warn', `Max retries exceeded for ${message.MessageId}, routing to DLQ`);
        await this.routeToDlq(message, errorMsg);
        await this.deleteMessage(receiptHandle);
      } else {
        // Let SQS visibility timeout handle the retry with backoff delay
        const backoffMs = this.config.baseBackoffMs * Math.pow(2, attempt - 1);
        this.log('info', `Backing off ${backoffMs}ms before next retry`);
        await this.sleep(backoffMs);
      }
    }
  }

  /** Route a permanently failed message to the dead-letter queue */
  private async routeToDlq(message: Message, reason: string): Promise<void> {
    try {
      await this.sqs.send(
        new SendMessageCommand({
          QueueUrl: this.config.dlqUrl,
          MessageBody: message.Body ?? '{}',
          MessageAttributes: {
            OriginalMessageId: {
              DataType: 'String',
              StringValue: message.MessageId ?? 'unknown',
            },
            FailureReason: {
              DataType: 'String',
              StringValue: reason,
            },
            SourceQueue: {
              DataType: 'String',
              StringValue: this.config.queueName,
            },
          },
        }),
      );
      this.log('info', `Routed message ${message.MessageId} to DLQ`);
    } catch (err) {
      this.log('error', `Failed to route to DLQ: ${(err as Error).message}`);
    }
  }

  /** Delete a successfully processed (or DLQ-routed) message from the source queue */
  private async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      await this.sqs.send(
        new DeleteMessageCommand({
          QueueUrl: this.config.queueUrl,
          ReceiptHandle: receiptHandle,
        }),
      );
    } catch (err) {
      this.log('error', `Failed to delete message: ${(err as Error).message}`);
    }
  }

  /** Extract approximate receive count from message attributes */
  private getReceiveCount(message: Message): number {
    const count = message.Attributes?.['ApproximateReceiveCount'];
    return count ? parseInt(count, 10) : 1;
  }

  /** Register SIGINT/SIGTERM handlers for graceful shutdown */
  private registerShutdownHooks(): void {
    const handler = () => this.stop();
    process.once('SIGINT', handler);
    process.once('SIGTERM', handler);
  }

  /** Structured log output */
  protected log(level: 'info' | 'warn' | 'error', message: string): void {
    const entry = JSON.stringify({
      timestamp: new Date().toISOString(),
      service: 'workers',
      queue: this.config.queueName,
      level,
      message,
    });
    if (level === 'error') {
      console.error(entry);
    } else {
      console.log(entry);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
