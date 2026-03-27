/**
 * @file payment-state-machine.ts
 * Finite state machine governing payment installment lifecycle transitions.
 * Ensures all state changes are validated and auditable.
 * Valid flow: pending → paid → refunded, pending → overdue → paid, etc.
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';

/**
 * Valid payment installment states.
 */
export type PaymentState =
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'paused'
  | 'refunded'
  | 'failed';

/**
 * Auditable state transition record.
 */
export interface StateTransition {
  from: PaymentState;
  to: PaymentState;
  timestamp: Date;
  reason?: string;
  actor?: string;
}

/**
 * Defines the valid state transitions for payment installments.
 *
 * Requirement 31.15: Payment status changes processed through
 * validated, auditable state transitions only.
 */
const VALID_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  pending: ['paid', 'overdue', 'paused', 'failed'],
  overdue: ['paid', 'paused', 'failed'],
  paused: ['pending'],
  paid: ['refunded'],
  failed: ['pending'],
  refunded: [],
};

@Injectable()
export class PaymentStateMachine {
  private readonly logger = new Logger(PaymentStateMachine.name);

  /**
   * Validate and execute a state transition.
   * Rejects invalid transitions with a descriptive error.
   * Logs every transition for audit purposes.
   */
  transition(
    currentState: PaymentState,
    targetState: PaymentState,
    context?: { installment_id?: string; reason?: string; actor?: string },
  ): StateTransition {
    const allowed = VALID_TRANSITIONS[currentState];

    if (!allowed || !allowed.includes(targetState)) {
      const msg = `Invalid payment state transition: '${currentState}' → '${targetState}'. Allowed transitions from '${currentState}': [${(allowed ?? []).join(', ')}]`;

      this.logger.warn(
        JSON.stringify({
          event: 'invalid_state_transition',
          from: currentState,
          to: targetState,
          installment_id: context?.installment_id,
          timestamp: new Date().toISOString(),
        }),
      );

      throw new BadRequestException(msg);
    }

    const record: StateTransition = {
      from: currentState,
      to: targetState,
      timestamp: new Date(),
      reason: context?.reason,
      actor: context?.actor,
    };

    this.logger.log(
      JSON.stringify({
        event: 'state_transition',
        from: currentState,
        to: targetState,
        installment_id: context?.installment_id,
        reason: context?.reason,
        actor: context?.actor,
        timestamp: record.timestamp.toISOString(),
      }),
    );

    return record;
  }

  /**
   * Check if a transition is valid without executing it.
   */
  canTransition(
    currentState: PaymentState,
    targetState: PaymentState,
  ): boolean {
    const allowed = VALID_TRANSITIONS[currentState];
    return !!allowed && allowed.includes(targetState);
  }

  /**
   * Get all valid target states from a given state.
   */
  getValidTransitions(currentState: PaymentState): PaymentState[] {
    return VALID_TRANSITIONS[currentState] ?? [];
  }
}
