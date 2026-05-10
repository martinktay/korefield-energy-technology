/** @file agent-api.ts — Typed API client for AI service endpoints. */

const DEFAULT_AI_BASE_URL = "http://localhost:8000";
const DEFAULT_AI_TIMEOUT_MS = 12_000;
const DEFAULT_AI_MAX_RETRIES = 1;
const DEFAULT_AI_RETRY_BASE_DELAY_MS = 250;

type AgentEnv = Record<string, string | undefined>;
type AgentFetch = typeof fetch;
type AgentMethod = "GET" | "POST";
type AgentSleep = (delayMs: number) => Promise<void>;

export interface AiServiceClientEvent {
  endpointName: string;
  path: string;
  method: AgentMethod;
  attempt: number;
  maxRetries: number;
  durationMs: number;
  ok: boolean;
  recoverable: boolean;
  timedOut: boolean;
  status?: number;
  traceId?: string;
  errorName?: string;
}

export interface AgentRequestOptions {
  env?: AgentEnv;
  fetcher?: AgentFetch;
  method?: AgentMethod;
  timeoutMs?: number;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  sleep?: AgentSleep;
  endpointName?: string;
  traceId?: string;
  onEvent?: (event: AiServiceClientEvent) => void;
}

export class AiServiceError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "AiServiceError";
  }

  get isRecoverable(): boolean {
    return this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

export class AiServiceNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiServiceNetworkError";
  }
}

export class AiServiceTimeoutError extends Error {
  constructor(url: string) {
    super(`AI service request timed out: ${url}`);
    this.name = "AiServiceTimeoutError";
  }
}

export function resolveAiServicesBaseUrl(env: AgentEnv = process.env): string {
  return env.NEXT_PUBLIC_AI_SERVICES_URL || env.NEXT_PUBLIC_AI_URL || DEFAULT_AI_BASE_URL;
}

export function isAiServiceRecoverableError(error: unknown): boolean {
  return (
    error instanceof AiServiceTimeoutError ||
    error instanceof AiServiceNetworkError ||
    (error instanceof AiServiceError && error.isRecoverable)
  );
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function buildRetryDelay(baseDelayMs: number, attempt: number): number {
  return baseDelayMs * 2 ** Math.max(0, attempt - 1);
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" && error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function emitClientEvent(
  options: AgentRequestOptions,
  event: Omit<AiServiceClientEvent, "endpointName" | "traceId">,
): void {
  options.onEvent?.({
    endpointName: options.endpointName ?? event.path,
    traceId: options.traceId,
    ...event,
  });
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

// --- Shared response types (mirror Pydantic models) ---

export interface ReportSection {
  title: string;
  content: string;
  confidence: number;
  sources: string[];
}

export interface ReportTelemetry {
  workflow: string;
  status: string;
  duration_ms: number;
  steps_executed: number;
  model: string;
  trace_id: string;
  langsmith_project: string;
}

export interface AgentReportResponse {
  report_id: string;
  sections: ReportSection[];
  overall_confidence: number;
  aqr_record_id: string;
  workflow_steps_executed: number;
  telemetry: ReportTelemetry;
}

export type AiConfidence = "high" | "medium" | "low";
export type LearnerTier = "foundation" | "cohort";
export type TutorPacing = "standard" | "slower" | "faster";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type PriorityLevel = "high" | "medium" | "low";
export type SkillLevel = "none" | "beginner" | "intermediate" | "advanced";

export interface AiAgentTelemetry {
  workflow: string;
  status: string;
  duration_ms?: number;
  retrieval_hits?: number;
  model?: string;
  trace_id?: string;
  cache_hit?: boolean;
  error?: string;
  intervention_triggered?: boolean;
  [key: string]: unknown;
}

export interface TutorLessonRequest {
  learner_id: string;
  module_id: string;
  lesson_id: string;
  query: string;
  learner_tier?: LearnerTier | string;
  cohort_id?: string | null;
  checkpoint_responses?: Array<Record<string, unknown>> | null;
}

export interface TutorLessonResponse {
  explanation: string;
  key_concepts: string[];
  confidence: AiConfidence | string;
  pacing: TutorPacing | string;
  retrieval_hits: number;
  telemetry: AiAgentTelemetry;
}

export interface TutorSummarizeRequest {
  learner_id: string;
  lesson_id: string;
  lesson_content: string;
}

export interface TutorSummarizeResponse {
  summary: string;
  key_takeaways: string[];
  confidence: AiConfidence | string;
  telemetry: AiAgentTelemetry;
}

export interface FeedbackRequest {
  learner_id: string;
  submission_id: string;
  assessment_id: string;
  submission_content: string;
  rubric?: Record<string, unknown> | null;
}

export interface FeedbackStrength {
  area: string;
  description: string;
}

export interface FeedbackImprovement {
  area: string;
  suggestion: string;
  priority: PriorityLevel | string;
}

export interface RubricAlignment {
  criterion: string;
  score: number;
  notes: string;
}

export interface FeedbackResponse {
  submission_id: string;
  strengths: FeedbackStrength[];
  improvements: FeedbackImprovement[];
  rubric_alignment: RubricAlignment[];
  overall_score: number;
  confidence: AiConfidence | string;
  processing_time_ms: number;
  telemetry: AiAgentTelemetry;
}

export interface EngagementSignals {
  login_frequency: number;
  submission_timeliness: number;
  average_score: number;
  pod_participation: number;
}

export interface DropoutEvaluateRequest {
  learner_id: string;
  enrollment_id: string;
  signals: EngagementSignals;
}

export interface DropoutRiskResponse {
  record_id: string;
  learner_id: string;
  risk_score: number;
  risk_level: RiskLevel | string;
  intervention_triggered: boolean;
  intervention_recommendation?: string | null;
  signals_summary: EngagementSignals;
  telemetry: AiAgentTelemetry;
}

export interface CareerGuidanceRequest {
  learner_id: string;
  track_id: string;
  completed_modules?: string[];
  career_interests?: string;
  project_interest?: string | null;
  foundation_module_2_complete?: boolean;
}

export interface SkillGap {
  skill: string;
  current_level: SkillLevel | string;
  target_level: Exclude<SkillLevel, "none"> | string;
  priority: PriorityLevel | string;
}

export interface CareerGuidanceResponse {
  learner_id: string;
  track_id: string;
  skill_gaps: SkillGap[];
  suggested_focus_areas: string[];
  job_market_alignment: string;
  learning_emphasis?: string | null;
  confidence: AiConfidence | string;
  telemetry: AiAgentTelemetry;
}

// --- Per-endpoint request types ---

export interface StrategyReportRequest {
  focus_areas?: string[];
  tracks?: string[];
}

export interface GrowthReportRequest {
  channels?: string[];
  regions?: string[];
}

export interface ProductReportRequest {
  feature_categories?: string[];
  user_segments?: string[];
}

export interface WorkforceReportRequest {
  skill_domains?: string[];
  regions?: string[];
}

// --- Helper ---

export async function agentFetch<T>(
  path: string,
  body: unknown,
  userRole: string,
  userId: string,
  options: AgentRequestOptions = {},
): Promise<T> {
  const baseUrl = resolveAiServicesBaseUrl(options.env);
  const url = `${baseUrl}${path}`;
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_AI_TIMEOUT_MS;
  const method = options.method ?? "POST";
  const maxRetries = Math.max(0, options.maxRetries ?? DEFAULT_AI_MAX_RETRIES);
  const retryBaseDelayMs = options.retryBaseDelayMs ?? DEFAULT_AI_RETRY_BASE_DELAY_MS;
  const wait = options.sleep ?? sleep;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-user-role": userRole,
        "x-user-id": userId,
      };
      if (options.traceId) {
        headers["x-trace-id"] = options.traceId;
      }

      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (method !== "GET" && body !== undefined) {
        init.body = JSON.stringify(body);
      }

      const res = await fetcher(url, init);
      const durationMs = Date.now() - startedAt;

      if (!res.ok) {
        let responseBody: unknown;
        try {
          responseBody = await res.json();
        } catch {
          responseBody = undefined;
        }

        const msg = res.status === 403
          ? "Access restricted to Super Admin role"
          : `AI service request failed (${res.status})`;
        const error = new AiServiceError(msg, res.status, responseBody);
        const recoverable = isAiServiceRecoverableError(error);

        emitClientEvent(options, {
          path,
          method,
          attempt,
          maxRetries,
          durationMs,
          ok: false,
          recoverable,
          timedOut: false,
          status: res.status,
          errorName: error.name,
        });

        if (recoverable && attempt < maxRetries) {
          await wait(buildRetryDelay(retryBaseDelayMs, attempt + 1));
          continue;
        }

        throw error;
      }

      emitClientEvent(options, {
        path,
        method,
        attempt,
        maxRetries,
        durationMs,
        ok: true,
        recoverable: false,
        timedOut: false,
        status: res.status,
      });

      return parseJsonResponse<T>(res);
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      const error = err instanceof AiServiceError
        ? err
        : isAbortError(err)
          ? new AiServiceTimeoutError(url)
          : new AiServiceNetworkError(
            err instanceof Error ? err.message : "AI service request failed",
          );
      const recoverable = isAiServiceRecoverableError(error);

      if (!(err instanceof AiServiceError)) {
        emitClientEvent(options, {
          path,
          method,
          attempt,
          maxRetries,
          durationMs,
          ok: false,
          recoverable,
          timedOut: error instanceof AiServiceTimeoutError,
          status: error instanceof AiServiceError ? error.status : undefined,
          errorName: error.name,
        });
      }

      if (recoverable && attempt < maxRetries) {
        await wait(buildRetryDelay(retryBaseDelayMs, attempt + 1));
        continue;
      }

      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  throw new AiServiceNetworkError("AI service request failed after retries");
}

// --- Endpoint functions ---

export async function generateStrategyReport(
  params: StrategyReportRequest = {},
  userRole = "super-admin",
  userId = "",
  options?: AgentRequestOptions,
): Promise<AgentReportResponse> {
  return agentFetch<AgentReportResponse>(
    "/ai/executive/strategy-report",
    params,
    userRole,
    userId,
    options,
  );
}

export async function deliverTutorLesson(
  params: TutorLessonRequest,
  userRole = "learner",
  userId = params.learner_id,
  options?: AgentRequestOptions,
): Promise<TutorLessonResponse> {
  return agentFetch<TutorLessonResponse>(
    "/ai/tutor/lesson",
    params,
    userRole,
    userId,
    { endpointName: "tutor.lesson", ...options },
  );
}

export async function summarizeTutorLesson(
  params: TutorSummarizeRequest,
  userRole = "learner",
  userId = params.learner_id,
  options?: AgentRequestOptions,
): Promise<TutorSummarizeResponse> {
  return agentFetch<TutorSummarizeResponse>(
    "/ai/tutor/summarize",
    params,
    userRole,
    userId,
    { endpointName: "tutor.summarize", ...options },
  );
}

export async function analyzeSubmissionFeedback(
  params: FeedbackRequest,
  userRole = "learner",
  userId = params.learner_id,
  options?: AgentRequestOptions,
): Promise<FeedbackResponse> {
  return agentFetch<FeedbackResponse>(
    "/ai/feedback/analyze",
    params,
    userRole,
    userId,
    { endpointName: "feedback.analyze", timeoutMs: 60_000, ...options },
  );
}

export async function evaluateDropoutRisk(
  params: DropoutEvaluateRequest,
  userRole = "instructor",
  userId = "",
  options?: AgentRequestOptions,
): Promise<DropoutRiskResponse> {
  return agentFetch<DropoutRiskResponse>(
    "/ai/dropout/evaluate",
    params,
    userRole,
    userId,
    { endpointName: "dropout.evaluate", ...options },
  );
}

export async function getLearnerDropoutRisk(
  learnerId: string,
  userRole = "instructor",
  userId = "",
  options?: AgentRequestOptions,
): Promise<DropoutRiskResponse> {
  return agentFetch<DropoutRiskResponse>(
    `/ai/dropout/risk/${encodeURIComponent(learnerId)}`,
    undefined,
    userRole,
    userId,
    { endpointName: "dropout.risk", method: "GET", ...options },
  );
}

export async function getCareerGuidance(
  params: CareerGuidanceRequest,
  userRole = "learner",
  userId = params.learner_id,
  options?: AgentRequestOptions,
): Promise<CareerGuidanceResponse> {
  return agentFetch<CareerGuidanceResponse>(
    "/ai/career/guidance",
    params,
    userRole,
    userId,
    { endpointName: "career.guidance", ...options },
  );
}

export async function generateGrowthReport(
  params: GrowthReportRequest = {},
  userRole = "super-admin",
  userId = "",
  options?: AgentRequestOptions,
): Promise<AgentReportResponse> {
  return agentFetch<AgentReportResponse>(
    "/ai/executive/growth-report",
    params,
    userRole,
    userId,
    options,
  );
}

export async function generateProductReport(
  params: ProductReportRequest = {},
  userRole = "super-admin",
  userId = "",
  options?: AgentRequestOptions,
): Promise<AgentReportResponse> {
  return agentFetch<AgentReportResponse>(
    "/ai/executive/product-report",
    params,
    userRole,
    userId,
    options,
  );
}

export async function generateWorkforceReport(
  params: WorkforceReportRequest = {},
  userRole = "super-admin",
  userId = "",
  options?: AgentRequestOptions,
): Promise<AgentReportResponse> {
  return agentFetch<AgentReportResponse>(
    "/ai/executive/workforce-report",
    params,
    userRole,
    userId,
    options,
  );
}
