/**
 * @file payment-events.ts — Payment events worker.
 * Consumes messages from the payment-events SQS queue to process scheduled
 * installment charges, apply grace period checks, trigger access pause on
 * threshold breach, and handle payment-received confirmations.
 * Runs as a standalone process on ECS Fargate.
 */
import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';
import { getPrisma } from './services/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScheduledInstallmentEvent {
  type: 'scheduled_installment';
  installment_id: string;
  plan_id: string;
  due_date: string;
}

interface PaymentReceivedEvent {
  type: 'payment_received';
  installment_id: string;
  plan_id: string;
}

type PaymentEventPayload = ScheduledInstallmentEvent | PaymentReceivedEvent;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Grace period in days after due date before access is paused. */
const GRACE_PERIOD_DAYS = 14;

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

export class PaymentEventsWorker extends SqsConsumer<PaymentEventPayload> {
  protected async processMessage(message: ParsedMessage<PaymentEventPayload>): Promise<void> {
    const payload = message.body;

    switch (payload.type) {
      case 'scheduled_installment':
        await this.handleScheduledInstallment(payload);
        break;
      case 'payment_received':
        await this.handlePaymentReceived(payload);
        break;
      default:
        this.log('error', `Unknown payment event type: "${(payload as any).type}"`);
        throw new Error(`Unknown payment event type: "${(payload as any).type}"`);
    }
  }

  /**
   * Process a scheduled installment check.
   *
   * - If installment is already paid/paused: skip (idempotent).
   * - If past due date but within grace period: mark as overdue.
   * - If past grace period end: log access pause event, update enrollment status to paused.
   */
  private async handleScheduledInstallment(event: ScheduledInstallmentEvent): Promise<void> {
    const prisma = getPrisma();
    const { installment_id, plan_id } = event;

    this.log('info', `Processing scheduled installment ${installment_id} [plan: ${plan_id}]`);

    const installment = await prisma.installment.findUnique({
      where: { id: installment_id },
      include: {
        plan: {
          include: { enrollment: true },
        },
      },
    });

    if (!installment) {
      this.log('warn', `Installment ${installment_id} not found — skipping`);
      return;
    }

    // Already resolved — idempotent skip
    if (installment.status === 'paid' || installment.status === 'paused') {
      this.log('info', `Installment ${installment_id} already ${installment.status} — skipping`);
      return;
    }

    const now = new Date();
    const dueDate = new Date(installment.due_date);
    const gracePeriodEnd = installment.grace_period_end
      ? new Date(installment.grace_period_end)
      : new Date(dueDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    // Not yet due — nothing to do
    if (now < dueDate) {
      this.log('info', `Installment ${installment_id} not yet due (${dueDate.toISOString()}) — skipping`);
      return;
    }

    // Past due but within grace period — mark as overdue
    if (now >= dueDate && now < gracePeriodEnd) {
      if (installment.status !== 'overdue') {
        await prisma.installment.update({
          where: { id: installment_id },
          data: { status: 'overdue' },
        });
        this.log('info', `Installment ${installment_id} marked as overdue (grace ends ${gracePeriodEnd.toISOString()})`);
      }
      return;
    }

    // Past grace period — pause access
    if (now >= gracePeriodEnd) {
      // Ensure installment is marked overdue
      if (installment.status !== 'overdue') {
        await prisma.installment.update({
          where: { id: installment_id },
          data: { status: 'overdue' },
        });
      }

      // Pause the payment plan
      await prisma.paymentPlan.update({
        where: { id: plan_id },
        data: { status: 'paused' },
      });

      // Pause the enrollment (progress is always preserved)
      const enrollmentId = installment.plan.enrollment_id;
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'paused' },
      });

      this.log(
        'warn',
        `Access paused for enrollment ${enrollmentId} — installment ${installment_id} exceeded grace period`,
      );
    }
  }

  /**
   * Process a payment-received event.
   *
   * - Mark the installment as paid.
   * - If enrollment was paused due to overdue payment, restore access.
   * - If all installments are paid, complete the payment plan.
   */
  private async handlePaymentReceived(event: PaymentReceivedEvent): Promise<void> {
    const prisma = getPrisma();
    const { installment_id, plan_id } = event;

    this.log('info', `Processing payment received for installment ${installment_id}`);

    const installment = await prisma.installment.findUnique({
      where: { id: installment_id },
      include: {
        plan: {
          include: {
            installments: true,
            enrollment: true,
          },
        },
      },
    });

    if (!installment) {
      this.log('warn', `Installment ${installment_id} not found — skipping`);
      return;
    }

    // Already paid — idempotent skip
    if (installment.status === 'paid') {
      this.log('info', `Installment ${installment_id} already paid — skipping`);
      return;
    }

    const wasPreviouslyOverdue = installment.status === 'overdue';

    // Mark installment as paid
    await prisma.installment.update({
      where: { id: installment_id },
      data: {
        status: 'paid',
        paid_at: new Date(),
      },
    });

    this.log('info', `Installment ${installment_id} marked as paid`);

    // Check if all installments are now paid — complete the plan
    const allInstallments = installment.plan.installments;
    const allPaid = allInstallments.every(
      (i: any) => i.id === installment_id || i.status === 'paid',
    );

    if (allPaid) {
      await prisma.paymentPlan.update({
        where: { id: plan_id },
        data: { status: 'completed' },
      });
      this.log('info', `Payment plan ${plan_id} completed — all installments paid`);
    }

    // Restore access if enrollment was paused due to overdue payment
    if (wasPreviouslyOverdue) {
      const enrollment = installment.plan.enrollment;
      if (enrollment.status === 'paused') {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: 'active' },
        });

        // Re-activate the payment plan if it was paused
        if (installment.plan.status === 'paused') {
          await prisma.paymentPlan.update({
            where: { id: plan_id },
            data: { status: allPaid ? 'completed' : 'active' },
          });
        }

        this.log('info', `Access restored for enrollment ${enrollment.id} after payment received`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Standalone startup
// ---------------------------------------------------------------------------

if (require.main === module) {
  const worker = new PaymentEventsWorker({
    queueName: 'payment-events',
    queueUrl: process.env.PAYMENT_EVENTS_QUEUE_URL ?? '',
    dlqUrl: process.env.PAYMENT_EVENTS_DLQ_URL ?? '',
  });

  worker.start();
}
