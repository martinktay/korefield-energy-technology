/** @file agent-api.ts — Typed API client for AI service endpoints. */

const DEFAULT_AI_BASE_URL = "http://localhost:8000";
const DEFAULT_AI_TIMEOUT_MS = 12_000;

type AgentEnv = Record<string, string | undefined>;
type AgentFetch = typeof fetch;

export interface AgentRequestOptions {
  env?: AgentEnv;
  fetcher?: AgentFetch;
  timeoutMs?: number;
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetcher(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": userRole,
        "x-user-id": userId,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

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
      throw new AiServiceError(msg, res.status, responseBody);
    }

    return res.json();
  } catch (err) {
    if (err instanceof AiServiceError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new AiServiceTimeoutError(url);
    }
    throw new AiServiceNetworkError(
      err instanceof Error ? err.message : "AI service request failed",
    );
  } finally {
    clearTimeout(timer);
  }
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
