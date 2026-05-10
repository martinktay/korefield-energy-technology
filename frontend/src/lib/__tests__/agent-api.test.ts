import { describe, expect, it, vi } from "vitest";

import {
  AiServiceError,
  AiServiceTimeoutError,
  agentFetch,
  generateStrategyReport,
  isAiServiceRecoverableError,
  resolveAiServicesBaseUrl,
} from "../agent-api";

describe("agent-api AI service wiring", () => {
  it("uses NEXT_PUBLIC_AI_SERVICES_URL as the canonical base URL", () => {
    expect(
      resolveAiServicesBaseUrl({
        NEXT_PUBLIC_AI_SERVICES_URL: "https://ai-services.staging.example.com",
        NEXT_PUBLIC_AI_URL: "https://deprecated.example.com",
      }),
    ).toBe("https://ai-services.staging.example.com");
  });

  it("accepts NEXT_PUBLIC_AI_URL only as a deprecated compatibility alias", () => {
    expect(
      resolveAiServicesBaseUrl({
        NEXT_PUBLIC_AI_URL: "https://legacy-ai.example.com",
      }),
    ).toBe("https://legacy-ai.example.com");
  });

  it("falls back to the local AI service URL when no env var is set", () => {
    expect(resolveAiServicesBaseUrl({})).toBe("http://localhost:8000");
  });

  it("sends report requests to the resolved AI services base URL", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        report_id: "AQR-001",
        sections: [],
        overall_confidence: 0.9,
        aqr_record_id: "AQR-001",
        workflow_steps_executed: 1,
        telemetry: {
          workflow: "strategy",
          status: "completed",
          duration_ms: 10,
          steps_executed: 1,
          model: "gpt-4o-mini",
          trace_id: "trace-1",
          langsmith_project: "test",
        },
      }),
    } as Response));

    await generateStrategyReport(
      {},
      "super-admin",
      "USR-001",
      {
        env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" },
        fetcher,
      },
    );

    expect(fetcher).toHaveBeenCalledWith(
      "https://ai.example.com/ai/executive/strategy-report",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "x-user-role": "super-admin",
          "x-user-id": "USR-001",
        }),
      }),
    );
  });

  it("classifies AI service 5xx failures as recoverable for caller fallbacks", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ detail: "temporarily unavailable" }),
    } as Response));

    await expect(
      agentFetch("/ai/executive/strategy-report", {}, "super-admin", "USR-001", {
        env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" },
        fetcher,
      }),
    ).rejects.toMatchObject({ status: 503 });

    try {
      await agentFetch("/ai/executive/strategy-report", {}, "super-admin", "USR-001", {
        env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" },
        fetcher,
      });
    } catch (err) {
      expect(err).toBeInstanceOf(AiServiceError);
      expect(isAiServiceRecoverableError(err)).toBe(true);
    }
  });

  it("times out AI service calls so learner flows can fall back", async () => {
    const fetcher = vi.fn(
      () =>
        new Promise<Response>((_resolve, reject) => {
          setTimeout(() => reject(new DOMException("Aborted", "AbortError")), 5);
        }),
    );

    await expect(
      agentFetch("/ai/executive/strategy-report", {}, "super-admin", "USR-001", {
        env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" },
        fetcher,
        timeoutMs: 1,
      }),
    ).rejects.toBeInstanceOf(AiServiceTimeoutError);
  });
});
