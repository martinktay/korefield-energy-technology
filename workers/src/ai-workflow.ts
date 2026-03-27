import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';

interface AiWorkflowPayload {
  workflowExecutionId: string;
  agentType: string;
  workflowType: string;
  inputParams: Record<string, unknown>;
}

class AiWorkflowWorker extends SqsConsumer<AiWorkflowPayload> {
  protected async processMessage(message: ParsedMessage<AiWorkflowPayload>): Promise<void> {
    const { workflowExecutionId, agentType, workflowType } = message.body;
    this.log('info', `Executing AI workflow ${workflowExecutionId} [${agentType}/${workflowType}]`);

    // TODO: Forward to AI services via REST, track AWE-* execution status
  }
}

const worker = new AiWorkflowWorker({
  queueName: 'ai-workflow',
  queueUrl: process.env.AI_WORKFLOW_QUEUE_URL ?? '',
  dlqUrl: process.env.AI_WORKFLOW_DLQ_URL ?? '',
});

worker.start();
