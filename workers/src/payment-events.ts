import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';

interface PaymentEventPayload {
  installmentId: string;
  enrollmentId: string;
  learnerId: string;
  amount: number;
  currency: string;
  dueDate: string;
}

class PaymentEventsWorker extends SqsConsumer<PaymentEventPayload> {
  protected async processMessage(message: ParsedMessage<PaymentEventPayload>): Promise<void> {
    const { installmentId, learnerId } = message.body;
    this.log('info', `Processing payment event for installment ${installmentId}, learner ${learnerId}`);

    // TODO: Process scheduled installment charges, apply grace period checks, trigger access pause on threshold breach
  }
}

const worker = new PaymentEventsWorker({
  queueName: 'payment-events',
  queueUrl: process.env.PAYMENT_EVENTS_QUEUE_URL ?? '',
  dlqUrl: process.env.PAYMENT_EVENTS_DLQ_URL ?? '',
});

worker.start();
