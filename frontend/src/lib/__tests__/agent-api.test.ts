import { describe, expect, it, vi } from "vitest";

import {
  AiServiceError,
  AiServiceTimeoutError,
  agentFetch,
  analyzeSubmissionFeedback,
  deliverTutorLesson,
  evaluateDropoutRisk,
  generateDiagnosticOnboarding,
  getCareerGuidance,
  getLearnerDropoutRisk,
  generateStrategyReport,
  isAiServiceRecoverableError,
  resolveAiServicesBaseUrl,
  summarizeTutorLesson,
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

  it("posts typed tutor lesson requests to the backend tutor endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        explanation: "Use clear inputs and outputs.",
        key_concepts: ["prompt design"],
        confidence: "high",
        pacing: "standard",
        retrieval_hits: 3,
        telemetry: { workflow: "tutor_lesson", status: "completed", duration_ms: 15, trace_id: "AWE-1" },
      }),
    } as Response));

    await deliverTutorLesson(
      {
        learner_id: "LRN-001",
        module_id: "MOD-001",
        lesson_id: "LSN-001",
        query: "Explain prompts",
        learner_tier: "foundation",
      },
      "learner",
      "LRN-001",
      { env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" }, fetcher },
    );

    expect(fetcher).toHaveBeenCalledWith(
      "https://ai.example.com/ai/tutor/lesson",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-user-role": "learner",
          "x-user-id": "LRN-001",
        }),
        body: JSON.stringify({
          learner_id: "LRN-001",
          module_id: "MOD-001",
          lesson_id: "LSN-001",
          query: "Explain prompts",
          learner_tier: "foundation",
        }),
      }),
    );
  });

  it("posts typed diagnostic onboarding requests to the backend diagnostic endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        learner_id: "LRN-001",
        starting_level: "beginner",
        recommended_track: "AI Engineering and Intelligent Systems",
        recommended_path: "AI Foundation School",
        weak_area_tags: ["ai_vocabulary"],
        rationale: "Foundation first fits your current goals.",
        focus_areas: ["AI basics"],
        confidence: "medium",
        source: "ai",
        created_at: "2026-05-10T00:00:00Z",
        telemetry: { workflow: "diagnostic_onboarding", status: "completed", duration_ms: 20, trace_id: "AWE-4" },
      }),
    } as Response));

    const response = await generateDiagnosticOnboarding(
      {
        learner_id: "LRN-001",
        country: "Nigeria",
        learner_role: "Student",
        prior_coding_background: "beginner",
        prior_ai_background: "none",
        learning_goals: ["Build AI applications"],
        project_interest: "A farm advisory assistant",
        preferred_pace: "steady",
        diagnostic_answers: [
          { question_id: "concepts", answer: "I know prompts" },
        ],
      },
      "learner",
      "LRN-001",
      { env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" }, fetcher },
    );

    expect(response.source).toBe("ai");
    expect(fetcher).toHaveBeenCalledWith(
      "https://ai.example.com/ai/onboarding/diagnostic",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "x-user-role": "learner",
          "x-user-id": "LRN-001",
        }),
        body: JSON.stringify({
          learner_id: "LRN-001",
          country: "Nigeria",
          learner_role: "Student",
          prior_coding_background: "beginner",
          prior_ai_background: "none",
          learning_goals: ["Build AI applications"],
          project_interest: "A farm advisory assistant",
          preferred_pace: "steady",
          diagnostic_answers: [
            { question_id: "concepts", answer: "I know prompts" },
          ],
        }),
      }),
    );
  });

  it("posts typed tutor summarize requests to the backend summarize endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        summary: "Short recap",
        key_takeaways: ["One idea"],
        confidence: "medium",
        telemetry: { workflow: "tutor_summarize", status: "completed", duration_ms: 10, trace_id: "AWE-2" },
      }),
    } as Response));

    const response = await summarizeTutorLesson(
      {
        learner_id: "LRN-001",
        lesson_id: "LSN-001",
        lesson_content: "Lesson body",
      },
      "learner",
      "LRN-001",
      { env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" }, fetcher },
    );

    expect(response.summary).toBe("Short recap");
    expect(fetcher).toHaveBeenCalledWith(
      "https://ai.example.com/ai/tutor/summarize",
      expect.objectContaining({ body: JSON.stringify({
        learner_id: "LRN-001",
        lesson_id: "LSN-001",
        lesson_content: "Lesson body",
      }) }),
    );
  });

  it("posts typed submission feedback requests to the backend feedback endpoint", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        submission_id: "SUB-001",
        strengths: [{ area: "Clarity", description: "Clear structure" }],
        improvements: [{ area: "Evidence", suggestion: "Add examples", priority: "medium" }],
        rubric_alignment: [{ criterion: "accuracy", score: 0.8, notes: "Mostly correct" }],
        overall_score: 0.78,
        confidence: "medium",
        processing_time_ms: 120,
        telemetry: { workflow: "feedback_analyze", status: "completed", duration_ms: 120, trace_id: "AWE-3" },
      }),
    } as Response));

    await analyzeSubmissionFeedback(
      {
        learner_id: "LRN-001",
        submission_id: "SUB-001",
        assessment_id: "ASM-001",
        submission_content: "My project",
        rubric: { criteria: ["accuracy"] },
      },
      "learner",
      "LRN-001",
      { env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" }, fetcher },
    );

    expect(fetcher).toHaveBeenCalledWith(
      "https://ai.example.com/ai/feedback/analyze",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          learner_id: "LRN-001",
          submission_id: "SUB-001",
          assessment_id: "ASM-001",
          submission_content: "My project",
          rubric: { criteria: ["accuracy"] },
        }),
      }),
    );
  });

  it("supports dropout risk lookup with GET and no request body", async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        record_id: "DRS-001",
        learner_id: "LRN-001",
        risk_score: 0.42,
        risk_level: "medium",
        intervention_triggered: false,
        signals_summary: { login_frequency: 3, submission_timeliness: 0.8, average_score: 0.7, pod_participation: 0.6 },
        telemetry: { workflow: "dropout_risk_lookup", status: "completed" },
      }),
    } as Response));

    await getLearnerDropoutRisk(
      "LRN-001",
      "instructor",
      "USR-010",
      { env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" }, fetcher },
    );

    expect(fetcher).toHaveBeenCalledWith(
      "https://ai.example.com/ai/dropout/risk/LRN-001",
      expect.not.objectContaining({ body: expect.any(String) }),
    );
    expect(fetcher).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("posts dropout evaluation and career guidance requests to their existing endpoints", async () => {
    const fetcher = vi.fn(async (url: string) => ({
      ok: true,
      status: 200,
      json: async () => url.includes("/dropout/")
        ? {
          record_id: "DRS-001",
          learner_id: "LRN-001",
          risk_score: 0.2,
          risk_level: "low",
          intervention_triggered: false,
          signals_summary: { login_frequency: 5, submission_timeliness: 0.9, average_score: 0.8, pod_participation: 0.7 },
          telemetry: { workflow: "dropout_evaluate", status: "completed", duration_ms: 20 },
        }
        : {
          learner_id: "LRN-001",
          track_id: "TRK-001",
          skill_gaps: [],
          suggested_focus_areas: ["Labs"],
          job_market_alignment: "Emerging fit",
          learning_emphasis: "Practice applied labs",
          confidence: "medium",
          telemetry: { workflow: "career_guidance", status: "completed", duration_ms: 25 },
        },
    } as Response));

    await evaluateDropoutRisk(
      {
        learner_id: "LRN-001",
        enrollment_id: "ENR-001",
        signals: {
          login_frequency: 5,
          submission_timeliness: 0.9,
          average_score: 0.8,
          pod_participation: 0.7,
        },
      },
      "instructor",
      "USR-010",
      { env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" }, fetcher },
    );
    await getCareerGuidance(
      {
        learner_id: "LRN-001",
        track_id: "TRK-001",
        completed_modules: ["MOD-001"],
        career_interests: "AI operations",
      },
      "learner",
      "LRN-001",
      { env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" }, fetcher },
    );

    expect(fetcher).toHaveBeenCalledWith("https://ai.example.com/ai/dropout/evaluate", expect.any(Object));
    expect(fetcher).toHaveBeenCalledWith("https://ai.example.com/ai/career/guidance", expect.any(Object));
  });

  it("retries recoverable failures with bounded exponential backoff", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({ detail: "unavailable" }) } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ ok: true }) } as Response);
    const sleep = vi.fn(async () => undefined);

    await agentFetch<{ ok: boolean }>("/ai/tutor/lesson", {}, "learner", "LRN-001", {
      env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" },
      fetcher,
      maxRetries: 2,
      retryBaseDelayMs: 100,
      sleep,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(100);
  });

  it("does not retry non-recoverable 4xx failures", async () => {
    const fetcher = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({ detail: "invalid" }),
    } as Response));

    await expect(
      agentFetch("/ai/tutor/lesson", {}, "learner", "LRN-001", {
        env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" },
        fetcher,
        maxRetries: 2,
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("emits observability events for success and failure with latency and classification", async () => {
    const events: unknown[] = [];
    const successFetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response));
    const failureFetcher = vi.fn(async () => ({
      ok: false,
      status: 429,
      json: async () => ({ detail: "rate limited" }),
    } as Response));

    await agentFetch("/ai/tutor/lesson", {}, "learner", "LRN-001", {
      env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" },
      fetcher: successFetcher,
      onEvent: (event) => events.push(event),
      endpointName: "tutor.lesson",
    });
    await expect(
      agentFetch("/ai/tutor/lesson", {}, "learner", "LRN-001", {
        env: { NEXT_PUBLIC_AI_SERVICES_URL: "https://ai.example.com" },
        fetcher: failureFetcher,
        onEvent: (event) => events.push(event),
        endpointName: "tutor.lesson",
        maxRetries: 0,
      }),
    ).rejects.toBeInstanceOf(AiServiceError);

    expect(events).toEqual([
      expect.objectContaining({
        endpointName: "tutor.lesson",
        path: "/ai/tutor/lesson",
        ok: true,
        durationMs: expect.any(Number),
        recoverable: false,
      }),
      expect.objectContaining({
        endpointName: "tutor.lesson",
        path: "/ai/tutor/lesson",
        ok: false,
        status: 429,
        recoverable: true,
        durationMs: expect.any(Number),
      }),
    ]);
  });
});
