/**
 * @file ai-workflow.ts — AI workflow execution worker.
 * Consumes messages from the ai-workflow SQS queue, forwards requests to the
 * AI services FastAPI layer via HTTP, tracks AWE-* execution status in the
 * database, and handles failures with retry + DLQ routing.
 * Runs as a standalone process on ECS Fargate.
 */
import { SqsConsumer, ParsedMessage } from './base/sqs-consumer';
import { getPrisma } from './services/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AiWorkflowPayload {
  /** AWE-* prefixed workflow execution ID. */
  workflowExecutionId: string;
  /** Agent category: 'learner' | 'faculty' | 'executive'. */
  agentType: string;
  /** Specific workflow/endpoint: e.g. 'tutor', 'strategy-report'. */
  workflowType: string;
  /** Arbitrary input parameters forwarded to the AI service endpoint. */
  inputParams: Record<string, unknown>;
}

interface AiServiceResponse {
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Endpoint mapping
// ---------------------------------------------------------------------------

/**
 * Map agentType + workflowType to the AI services REST endpoint path.
 *
 * Learner routes:   /ai/tutor/*,  /ai/learner/*
 * Faculty routes:   /ai/faculty/*
 * Executive routes: /ai/executive/*
 */
function resolveEndpoint(agentType: string, workflowType: string): string {
  const agentPrefixes: Record<string, string> = {
    learner: '/ai',
    faculty: '/ai/faculty',
    executive: '/ai/executive',
  };

  const prefix = agentPrefixes[agentType];
  if (!prefix) {
    throw new Error(`Unknown agent type: "${agentType}"`);
  }

  // Learner agents use /ai/<workflowType> (e.g. /ai/tutor/lesson)
  // Faculty/executive agents use /ai/<category>/<workflowType>
  if (agentType === 'learner') {
    return `${prefix}/${workflowType}`;
  }
  return `${prefix}/${workflowType}`;
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const AI_SERVICES_URL = process.env.AI_SERVICES_URL ?? 'http://localhost:8000';

export class AiWorkflowWorker extends SqsConsumer<AiWorkflowPayload> {
  protected async processMessage(message: ParsedMessage<AiWorkflowPayload>): Promise<void> {
    const { workflowExecutionId, agentType, workflowType, inputParams } = message.body;
    const prisma = getPrisma();
    const startedAt = Date.now();

    this.log('info', `Executing AI workflow ${workflowExecutionId} [${agentType}/${workflowType}]`);

    // 1. Mark execution as running
    await this.upsertExecution(prisma, workflowExecutionId, {
      agent_type: agentType,
      workflow_type: workflowType,
      status: 'running',
      started_at: new Date(),
    });

    // 2. Forward to AI services via REST
    const endpoint = resolveEndpoint(agentType, workflowType);
    const url = `${AI_SERVICES_URL}${endpoint}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputParams),
      });
    } catch (err) {
      const errorMsg = (err as Error).message;
      this.log('error', `Network error calling AI services at ${url}: ${errorMsg}`);

      await this.upsertExecution(prisma, workflowExecutionId, {
        status: 'failed',
        error_message: `Network error: ${errorMsg}`,
        duration_ms: Date.now() - startedAt,
      });

      // Re-throw so SQS retries via base class backoff
      throw err;
    }

    // 3. Handle non-2xx responses
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unable to read response body');
      const errorMsg = `AI services returned ${response.status}: ${errorBody.slice(0, 500)}`;
      this.log('error', `${errorMsg} [${workflowExecutionId}]`);

      await this.upsertExecution(prisma, workflowExecutionId, {
        status: 'failed',
        error_message: errorMsg,
        duration_ms: Date.now() - startedAt,
      });

      // 4xx = permanent failure (bad request), don't retry
      if (response.status >= 400 && response.status < 500) {
        this.log('warn', `Permanent failure (${response.status}) — will not retry`);
        return;
      }

      // 5xx = transient, re-throw for SQS retry
      throw new Error(errorMsg);
    }

    // 4. Parse successful response and update execution record
    const result: AiServiceResponse = await response.json();
    const durationMs = Date.now() - startedAt;

    await this.upsertExecution(prisma, workflowExecutionId, {
      status: 'completed',
      output: JSON.stringify(result),
      duration_ms: durationMs,
      langsmith_trace_id: (result.trace_id as string) ?? null,
      completed_at: new Date(),
    });

    this.log('info', `Completed AI workflow ${workflowExecutionId} in ${durationMs}ms`);
  }

  /**
   * Create or update an AWE-* workflow execution record.
   * Uses raw SQL upsert since the AgentWorkflowExecution model may not be
   * in the Prisma schema yet — falls back gracefully if the table doesn't exist.
   */
  private async upsertExecution(
    prisma: any,
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    try {
      const setClauses = Object.entries(data)
        .map(([key]) => `"${key}" = $${key}`)
        .join(', ');

      // Use $executeRawUnsafe for flexibility with the AWE tracking table
      const columns = ['id', ...Object.keys(data)];
      const values = [id, ...Object.values(data)];

      await prisma.$executeRawUnsafe(
        `INSERT INTO agent_workflow_executions (${columns.map((c) => `"${c}"`).join(', ')})
         VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')})
         ON CONFLICT (id) DO UPDATE SET ${Object.keys(data).map((k, i) => `"${k}" = $${i + 2}`).join(', ')}`,
        ...values,
      );
    } catch (err) {
      // Table may not exist yet — log and continue (non-fatal)
      this.log('warn', `Failed to update execution record ${id}: ${(err as Error).message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Standalone startup
// ---------------------------------------------------------------------------

if (require.main === module) {
  const worker = new AiWorkflowWorker({
    queueName: 'ai-workflow',
    queueUrl: process.env.AI_WORKFLOW_QUEUE_URL ?? '',
    dlqUrl: process.env.AI_WORKFLOW_DLQ_URL ?? '',
  });

  worker.start();
}
