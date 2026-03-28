/** @file agent-api.ts — Typed API client for executive AI agent endpoints. */

const AI_BASE = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:8000";

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

async function agentFetch<T>(
  path: string,
  body: unknown,
  userRole: string,
  userId: string,
): Promise<T> {
  const res = await fetch(`${AI_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-role": userRole,
      "x-user-id": userId,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = res.status === 403
      ? "Access restricted to Super Admin role"
      : `Report generation failed (${res.status})`;
    const err = new Error(msg);
    (err as Error & { status: number }).status = res.status;
    throw err;
  }
  return res.json();
}

// --- Endpoint functions ---

export async function generateStrategyReport(
  params: StrategyReportRequest = {},
  userRole = "super-admin",
  userId = "",
): Promise<AgentReportResponse> {
  return agentFetch<AgentReportResponse>(
    "/ai/executive/strategy-report",
    params,
    userRole,
    userId,
  );
}

export async function generateGrowthReport(
  params: GrowthReportRequest = {},
  userRole = "super-admin",
  userId = "",
): Promise<AgentReportResponse> {
  return agentFetch<AgentReportResponse>(
    "/ai/executive/growth-report",
    params,
    userRole,
    userId,
  );
}

export async function generateProductReport(
  params: ProductReportRequest = {},
  userRole = "super-admin",
  userId = "",
): Promise<AgentReportResponse> {
  return agentFetch<AgentReportResponse>(
    "/ai/executive/product-report",
    params,
    userRole,
    userId,
  );
}

export async function generateWorkforceReport(
  params: WorkforceReportRequest = {},
  userRole = "super-admin",
  userId = "",
): Promise<AgentReportResponse> {
  return agentFetch<AgentReportResponse>(
    "/ai/executive/workforce-report",
    params,
    userRole,
    userId,
  );
}
