import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';

interface AnalyticsPayload {
  metricType: string;
  aggregationParams: Record<string, unknown>;
}

class AnalyticsWorker extends SqsConsumer<AnalyticsPayload> {
  protected async processMessage(message: ParsedMessage<AnalyticsPayload>): Promise<void> {
    const { metricType } = message.body;
    this.log('info', `Pre-aggregating analytics metric: ${metricType}`);

    // TODO: Pre-aggregate Super Admin dashboard metrics, store in Redis (dashboard:superadmin:* keys, 10 min TTL)
  }
}

const worker = new AnalyticsWorker({
  queueName: 'analytics',
  queueUrl: process.env.ANALYTICS_QUEUE_URL ?? '',
  dlqUrl: process.env.ANALYTICS_DLQ_URL ?? '',
});

worker.start();
