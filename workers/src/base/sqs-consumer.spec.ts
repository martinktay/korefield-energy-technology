import {
  SqsConsumer,
  ParsedMessage,
  SqsConsumerConfig,
} from './sqs-consumer';
import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';

// Mock SQSClient
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-sqs', () => {
  const actual = jest.requireActual('@aws-sdk/client-sqs');
  return {
    ...actual,
    SQSClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  };
});

interface TestPayload {
  id: string;
  value: number;
}

/**
 * Expose private methods for unit testing via a thin subclass.
 */
class TestWorker extends SqsConsumer<TestPayload> {
  public processedMessages: ParsedMessage<TestPayload>[] = [];
  public shouldThrow = false;

  protected async processMessage(msg: ParsedMessage<TestPayload>): Promise<void> {
    if (this.shouldThrow) throw new Error('processing failed');
    this.processedMessages.push(msg);
  }

  // Expose private methods for testing
  public exposedPoll() {
    return (this as any)['poll']();
  }
  public exposedHandleMessage(msg: any) {
    return (this as any)['handleMessage'](msg);
  }
}

function createWorker(overrides?: Partial<SqsConsumerConfig>): TestWorker {
  return new TestWorker({
    queueName: 'test-queue',
    queueUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue',
    dlqUrl: 'https://sqs.us-east-1.amazonaws.com/123456789/test-queue-dlq',
    ...overrides,
  });
}

function sqsMessage(body: unknown, receiveCount = 1) {
  return {
    MessageId: 'msg-001',
    ReceiptHandle: 'receipt-001',
    Body: JSON.stringify(body),
    Attributes: { ApproximateReceiveCount: String(receiveCount) },
  };
}

beforeEach(() => {
  mockSend.mockReset();
});

describe('SqsConsumer', () => {
  describe('config', () => {
    it('should apply default config values', () => {
      const worker = createWorker();
      expect(worker['config'].maxMessages).toBe(10);
      expect(worker['config'].waitTimeSeconds).toBe(20);
      expect(worker['config'].maxRetries).toBe(3);
      expect(worker['config'].baseBackoffMs).toBe(1000);
    });

    it('should allow config overrides', () => {
      const worker = createWorker({ maxMessages: 5, maxRetries: 5 });
      expect(worker['config'].maxMessages).toBe(5);
      expect(worker['config'].maxRetries).toBe(5);
    });
  });

  describe('message handling', () => {
    it('should parse JSON body and call processMessage', async () => {
      const worker = createWorker();
      const payload = { id: 'test-1', value: 42 };
      const message = sqsMessage(payload);

      // deleteMessage call
      mockSend.mockResolvedValueOnce({});

      await worker.exposedHandleMessage(message);

      expect(worker.processedMessages).toHaveLength(1);
      expect(worker.processedMessages[0].body).toEqual(payload);
      expect(worker.processedMessages[0].raw).toBe(message);
    });

    it('should delete message after successful processing', async () => {
      const worker = createWorker();
      const message = sqsMessage({ id: 'x', value: 1 });

      mockSend.mockResolvedValueOnce({}); // deleteMessage

      await worker.exposedHandleMessage(message);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const deleteCall = mockSend.mock.calls[0][0];
      expect(deleteCall).toBeInstanceOf(DeleteMessageCommand);
      expect(deleteCall.input.ReceiptHandle).toBe('receipt-001');
    });

    it('should route unparseable JSON to DLQ and delete from source', async () => {
      const worker = createWorker();
      const badMessage = {
        MessageId: 'msg-bad',
        ReceiptHandle: 'receipt-bad',
        Body: '<<<not json>>>',
        Attributes: { ApproximateReceiveCount: '1' },
      };

      mockSend
        .mockResolvedValueOnce({}) // sendMessage (DLQ)
        .mockResolvedValueOnce({}); // deleteMessage

      await worker.exposedHandleMessage(badMessage);

      expect(worker.processedMessages).toHaveLength(0);

      // First call: SendMessageCommand to DLQ
      const dlqCall = mockSend.mock.calls[0][0];
      expect(dlqCall).toBeInstanceOf(SendMessageCommand);
      expect(dlqCall.input.QueueUrl).toContain('dlq');
      expect(dlqCall.input.MessageAttributes.FailureReason.StringValue).toBe(
        'JSON parse failure',
      );

      // Second call: DeleteMessageCommand
      const deleteCall = mockSend.mock.calls[1][0];
      expect(deleteCall).toBeInstanceOf(DeleteMessageCommand);
    });

    it('should route to DLQ after max retries exceeded', async () => {
      const worker = createWorker({ maxRetries: 1, baseBackoffMs: 1 });
      worker.shouldThrow = true;

      const message = sqsMessage({ id: 'fail', value: 0 }, 1);

      mockSend
        .mockResolvedValueOnce({}) // sendMessage (DLQ)
        .mockResolvedValueOnce({}); // deleteMessage

      await worker.exposedHandleMessage(message);

      const dlqCall = mockSend.mock.calls[0][0];
      expect(dlqCall).toBeInstanceOf(SendMessageCommand);
      expect(dlqCall.input.QueueUrl).toContain('dlq');
      expect(dlqCall.input.MessageAttributes.FailureReason.StringValue).toBe(
        'processing failed',
      );
      expect(dlqCall.input.MessageAttributes.SourceQueue.StringValue).toBe(
        'test-queue',
      );
    });

    it('should retry with backoff when under max retries', async () => {
      const worker = createWorker({ maxRetries: 3, baseBackoffMs: 1 });
      worker.shouldThrow = true;

      // receiveCount=1, maxRetries=3 → should NOT route to DLQ
      const message = sqsMessage({ id: 'retry', value: 0 }, 1);

      await worker.exposedHandleMessage(message);

      // No DLQ routing or delete — message stays in queue for SQS retry
      const sendCalls = mockSend.mock.calls.filter(
        (c) => c[0] instanceof SendMessageCommand,
      );
      expect(sendCalls).toHaveLength(0);
    });

    it('should skip messages without ReceiptHandle', async () => {
      const worker = createWorker();
      const noHandleMessage = {
        MessageId: 'msg-no-handle',
        Body: JSON.stringify({ id: 'x', value: 1 }),
      };

      await worker.exposedHandleMessage(noHandleMessage);

      expect(worker.processedMessages).toHaveLength(0);
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('polling', () => {
    it('should receive messages from SQS and process them', async () => {
      const worker = createWorker();
      const payload = { id: 'poll-1', value: 99 };
      const message = sqsMessage(payload);

      mockSend
        .mockResolvedValueOnce({ Messages: [message] }) // ReceiveMessageCommand
        .mockResolvedValueOnce({});                      // DeleteMessageCommand

      await worker.exposedPoll();

      expect(worker.processedMessages).toHaveLength(1);
      expect(worker.processedMessages[0].body).toEqual(payload);

      // First call is ReceiveMessageCommand
      const receiveCall = mockSend.mock.calls[0][0];
      expect(receiveCall).toBeInstanceOf(ReceiveMessageCommand);
    });

    it('should handle empty poll gracefully', async () => {
      const worker = createWorker();

      mockSend.mockResolvedValueOnce({ Messages: [] });

      await worker.exposedPoll();

      expect(worker.processedMessages).toHaveLength(0);
    });
  });

  describe('DLQ message attributes', () => {
    it('should include OriginalMessageId and SourceQueue in DLQ message', async () => {
      const worker = createWorker();
      const badMessage = {
        MessageId: 'msg-123',
        ReceiptHandle: 'receipt-123',
        Body: '{invalid',
        Attributes: { ApproximateReceiveCount: '1' },
      };

      mockSend
        .mockResolvedValueOnce({}) // DLQ send
        .mockResolvedValueOnce({}); // delete

      await worker.exposedHandleMessage(badMessage);

      const dlqCall = mockSend.mock.calls[0][0];
      expect(dlqCall.input.MessageAttributes.OriginalMessageId.StringValue).toBe('msg-123');
      expect(dlqCall.input.MessageAttributes.SourceQueue.StringValue).toBe('test-queue');
    });
  });
});
