# AI Guardrails — KoreField Academy

## Core Principle

All AI agents in the KoreField Academy ecosystem are advisory only. They assist humans but cannot override human decisions, fabricate data, modify curriculum, or bypass payment/certification gates.

## Hard Constraints (Non-Negotiable)

### What Agents CANNOT Do
1. **No curriculum modification** — Agents cannot create, edit, delete, or reorder tracks, levels, modules, or lessons
2. **No certificate issuance/approval** — Agents cannot issue, approve, or revoke certificates
3. **No payment bypass** — Agents cannot waive, reduce, or override payment requirements
4. **No assessor decision override** — Agents cannot override assessor pass/fail decisions, professionalism scores, or certification approvals
5. **No autonomous entity creation** — Agents cannot create tracks, levels, modules, pods, or enrollments
6. **No data fabrication** — Agents cannot generate fake learner performance data, scores, or progress records
7. **No cross-boundary data access** — Learner agents access only learner data, faculty agents only faculty data, executive agents only super admin data

## Input Protection

### Prompt Injection Protection
- All agent input paths have prompt injection protection middleware
- Malicious input patterns are detected and blocked before reaching the LLM
- Blocked attempts are logged with full context

### Input Validation
- All inputs validated against expected schemas before processing
- Unexpected input types rejected with structured error responses

## Output Safety

### Output Filtering
- All agent outputs screened for harmful, biased, or policy-violating content
- Filtered outputs replaced with safe fallback responses
- Filtering events logged for review

### Confidence Scoring
- Every agent output includes a confidence indicator
- Unsupported claims are rejected (especially Market Intelligence Agent)
- Low-confidence outputs flagged for human review

## Execution Controls

### Tool Registry
- Agents can only invoke pre-approved tools from a controlled registry
- No arbitrary code execution or system access
- Tool invocations logged with parameters and results

### Sandboxing
- Agent execution runs in isolated runtime environments
- Restricted system, network, and filesystem access
- Resource limits enforced per execution

### Rate Limiting
- Per-agent rate limits on LLM API calls
- Per-user rate limits on AI tool execution
- Circuit breaker patterns for LLM API calls, retrieval calls, and external data calls

### Graceful Degradation
- On agent failure: meaningful fallback responses returned
- No silent failures — all errors logged and surfaced
- Users informed when AI features are temporarily unavailable

## Observability

### Logging
- All model usage events logged: agent identity, input/output summary, token consumption, timestamp
- All workflow state transitions logged for debugging and audit
- Failure logs include: reason, affected agent, workflow step, input context

### Tracing (LangSmith)
- All agent workflows traced through LangSmith
- Input params, intermediate steps, output results, execution duration captured
- 90-day trace retention in production

### Cost Tracking
- Token consumption tracked per agent per time period
- Cost attribution per agent type
- Budget alerts on threshold breach

## Role-Based Agent Access

| Agent Category | Accessible By | Data Scope |
|---------------|---------------|------------|
| Learner agents (Tutor, Feedback, Dropout, Career) | Learners | Own learner data only |
| Faculty agents (Instructor Insight, Assessor Support, Cert Validation) | Instructors, Assessors | Assigned cohort/pod data |
| Executive agents (Market, Pricing, Expansion, Academic) | Super Admin only | Platform-wide aggregated data |

## Phase 1 Feature Flags and Environment Wiring

Phase 1 adds safety wiring only. These flags must remain off in production until the related learner-facing, instructor-facing, or corporate-facing capability has passed staging QA, cost checks, human-override checks, and rollback validation.

| Capability | Frontend env var | Production default |
|------------|------------------|--------------------|
| AI diagnostic onboarding | `NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING` | `false` |
| Contextual lesson tutor | `NEXT_PUBLIC_FEATURE_AI_LESSON_TUTOR` | `false` |
| AI-assisted submission feedback | `NEXT_PUBLIC_FEATURE_AI_SUBMISSION_FEEDBACK` | `false` |
| Adaptive next-step recommendations | `NEXT_PUBLIC_FEATURE_AI_ADAPTIVE_RECOMMENDATIONS` | `false` |
| Instructor AI insights | `NEXT_PUBLIC_FEATURE_AI_INSTRUCTOR_INSIGHTS` | `false` |
| Corporate/school cohort AI insights | `NEXT_PUBLIC_FEATURE_AI_CORPORATE_COHORT_INSIGHTS` | `false` |
| Low-data mode | `NEXT_PUBLIC_FEATURE_LOW_DATA_MODE` | `false` |
| Offline progress sync | `NEXT_PUBLIC_FEATURE_OFFLINE_PROGRESS_SYNC` | `false` |

Accepted truthy values are `true`, `1`, `yes`, and `on`. Missing, misspelled, or unsupported values are treated as off.

### Canonical AI Service URLs

`NEXT_PUBLIC_AI_SERVICES_URL` is the canonical browser-visible frontend variable for the FastAPI AI services base URL.

| Environment | Expected value |
|-------------|----------------|
| Local frontend | `http://localhost:8000` |
| Staging frontend | Staging AI services URL |
| Production frontend | Production AI services URL |

`NEXT_PUBLIC_AI_URL` is deprecated and accepted only as a temporary compatibility alias when `NEXT_PUBLIC_AI_SERVICES_URL` is absent. New deployments must use `NEXT_PUBLIC_AI_SERVICES_URL`.

Backend AI services continue to use server-side secrets and configuration such as `OPENAI_API_KEY`, LangSmith settings, Redis, database, queue, and infrastructure variables. Browser-exposed `NEXT_PUBLIC_*` values must never contain secrets.

### Staging Verification

Before enabling any AI-native flag outside local development:

1. Confirm `NEXT_PUBLIC_AI_SERVICES_URL` points to the correct staging AI services base URL.
2. Confirm all Phase 1 flags are off by default in the staging frontend.
3. Run frontend unit tests and build.
4. Smoke test existing learner registration, onboarding, lesson, progress, instructor, and corporate pages with AI services unavailable.
5. Confirm ordinary learning flows still work and no AI failure blocks progress.

### Rollback Behavior

If AI services fail, time out, or exceed budget limits, disable the related feature flag immediately. Existing non-AI learner, instructor, and corporate flows must remain available. AI client failures should be treated as recoverable by callers unless a future feature explicitly requires human-supervised handling.

## Phase 2 Frontend AI Client Wiring

Phase 2 adds typed frontend client contracts and operational safety for existing backend AI endpoints. It does not enable any learner-facing AI product behavior. All learner, instructor, and corporate AI-native flags remain off by default until the related Phase 3 or Phase 4 feature has passed staging QA and cost review.

### Frontend-Relevant Endpoint Map

| Endpoint | Purpose | Request shape | Response shape | Access assumption | Metering/cost implication | Frontend readiness |
|----------|---------|---------------|----------------|-------------------|---------------------------|--------------------|
| `POST /ai/tutor/lesson` | RAG lesson explanation and hints | `learner_id`, `module_id`, `lesson_id`, `query`, optional `learner_tier`, `cohort_id`, `checkpoint_responses` | `explanation`, `key_concepts`, `confidence`, `pacing`, `retrieval_hits`, `telemetry` | Learner scope; caller must only send the learner's own context | AI cap check, tutor cache, LLM metering via AWE records | Ready as an inert typed client only; UI remains disabled |
| `POST /ai/tutor/summarize` | Lesson recap summarization | `learner_id`, `lesson_id`, `lesson_content` | `summary`, `key_takeaways`, `confidence`, `telemetry` | Learner scope; caller must only summarize authorized lesson content | LLM call; backend telemetry returned, metering depends on invocation metadata | Ready as an inert typed client only |
| `POST /ai/feedback/analyze` | Structured submission feedback | `learner_id`, `submission_id`, `assessment_id`, `submission_content`, optional `rubric` | `strengths`, `improvements`, `rubric_alignment`, `overall_score`, `confidence`, `processing_time_ms`, `telemetry` | Learner/instructor workflow; AI feedback is advisory and not final grading | Higher-cost feedback model path; 60s backend SLA | Ready as an inert typed client only; human review UI not built yet |
| `POST /ai/dropout/evaluate` | Compute dropout risk and possible intervention recommendation | `learner_id`, `enrollment_id`, engagement `signals` | `record_id`, `risk_score`, `risk_level`, `intervention_triggered`, optional recommendation, `signals_summary`, `telemetry` | Instructor/faculty scope, not ordinary learner UI | May run LangGraph intervention and write DB records; LLM fallback possible for intervention | Typed client available for future controlled dashboards, not learner-facing use |
| `GET /ai/dropout/risk/{learner_id}` | Retrieve latest dropout risk score | path `learner_id` | same dropout risk response | Instructor/faculty scope; caller must enforce cohort assignment | DB read; no new LLM call | Typed client available for future controlled dashboards |
| `POST /ai/career/guidance` | Skill-gap and career guidance | `learner_id`, `track_id`, optional completed modules, interests, project interest, Foundation Module 2 flag | `skill_gaps`, `suggested_focus_areas`, `job_market_alignment`, optional `learning_emphasis`, `confidence`, `telemetry` | Learner scope for own guidance; instructor/admin use requires role checks | LLM call with fallback text; AWE metering through `career_support` agent type | Ready as an inert typed client only |

### Frontend Client Policy

`frontend/src/lib/agent-api.ts` is the shared frontend AI service client. It resolves the AI services base URL from `NEXT_PUBLIC_AI_SERVICES_URL`, with `NEXT_PUBLIC_AI_URL` accepted only as a deprecated compatibility alias.

The client provides bounded retry and fallback semantics:

1. Retry only recoverable failures: timeout, network failure, HTTP `408`, HTTP `429`, and HTTP `5xx`.
2. Do not retry non-recoverable `4xx` validation, authorization, or guardrail failures.
3. Default retry behavior is one retry with exponential backoff; callers can lower or disable retries for latency-sensitive paths.
4. All timeouts are bounded. Feedback analysis uses a longer timeout because the backend endpoint has a 60-second SLA.
5. AI client errors must be caught by future feature callers and converted into non-blocking fallback UI. Ordinary learner progress must never depend on AI success.

### Observability Hook Contract

The frontend client accepts an optional `onEvent` callback. It emits lightweight request events with:

- endpoint name and path
- HTTP method
- attempt number and retry limit
- request duration in milliseconds
- success/failure status
- recoverable/non-recoverable classification
- timeout classification
- HTTP status where available
- optional trace ID passthrough via `x-trace-id`

This hook is intentionally vendor-neutral. Future analytics, tracing, or cost dashboards should consume these events without duplicating backend AWE metering. Backend model usage, token estimates, model routing, and estimated cost remain owned by `ai-services/agents/llm_factory.py` and persisted as AWE records.

### Remaining Before Phase 3

Phase 2 does not add UI, feature rollout, learner-visible tutor behavior, AI diagnostic onboarding, AI feedback rendering, adaptive recommendations, or instructor/corporate intelligence. Before Phase 3 starts, each caller must still define:

1. Exact feature flag gate.
2. Non-AI fallback content and user messaging.
3. Human-review or override path where required.
4. Cost quota behavior for the relevant learner tier or cohort.
5. Mobile and low-bandwidth behavior for the visible feature.

## Phase 3A Diagnostic Onboarding

Phase 3A enables a learner-visible diagnostic onboarding flow only when `NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING` is explicitly enabled. The existing rule-based onboarding flow remains the default and must continue to work when the flag is off.

### Behavior

When the flag is on, onboarding collects a small mobile-friendly signal set:

- country
- learner role or professional background
- learning goals
- prior coding background
- prior AI background
- optional project interest
- preferred pace
- three lightweight baseline diagnostic answers

The diagnostic produces a learner-readable summary:

- recommended starting point
- recommended track/path
- plain-language rationale
- first focus areas
- weak-area tags
- confidence

The diagnostic is advisory only. It cannot change curriculum, certify ability, decide employment readiness, bypass Foundation School, or override a human instructor/admin decision.

### Backend Endpoints

| Endpoint | Purpose | Failure behavior |
|----------|---------|------------------|
| `POST /ai/onboarding/diagnostic` | Generates the structured diagnostic result using the low-cost diagnostic model route and existing learner guardrails | Returns a structured fallback result when the LLM is unavailable or returns invalid JSON; rejects unsafe prompt-injection input |
| `POST /enrollment/diagnostic-results` | Persists the diagnostic result for later tutor/recommendation phases | Best-effort from the frontend; persistence failure must not block onboarding completion |

### Persisted Fields

Diagnostic results are stored in `learner_diagnostic_results` with:

- learner ID
- profile signals
- diagnostic answers
- starting level
- recommended track
- recommended path
- weak-area tags
- rationale
- focus areas
- confidence
- source: `ai` or `fallback`
- telemetry JSON
- created timestamp
- override-ready fields: `override_active`, `override_by`, `override_reason`, `override_at`

### Fallback and Offline Resilience

If the AI service times out, returns a recoverable failure, exceeds budget/capacity, or is disabled, the frontend creates a rule-based fallback result and lets the learner continue. Draft diagnostic answers are saved in browser `localStorage` under a versioned key so a refresh or short connection drop does not wipe the form on the same device.

### Cost and Quota Notes

The diagnostic is a single bounded request at onboarding completion. The AI service routes `diagnostic_onboarding` to `gpt-4o-mini` through `llm_factory.py` and uses existing AWE metering when an LLM call succeeds. There is no open-ended conversation, no background polling, and no unlimited retry loop.

### Remaining Before AI-Native Claim Readiness

Phase 3A alone supports an "AI-assisted diagnostic onboarding" claim only where the flag is live and verified. The Academy still must ship contextual lesson tutor help, AI-assisted submission feedback, adaptive next-step recommendations, instructor intelligence, cohort intelligence, cost dashboards, human override workflows, and production low-bandwidth validation before claiming a fully AI-native learner experience.


## Unit Economics Safeguards (Cohort-Based)

### Cost Control Architecture

AI interactions are designed as structured actions (not unlimited conversational AI) within a cohort-bounded container. Each cohort has a pre-calculated AI budget, making costs predictable and protectable.

| Control | Implementation | Purpose |
|---------|---------------|---------|
| Per-user daily caps | Redis counters: 50 hints/day (cohort), 10/day (Foundation) | Prevent individual cost spikes within cohort budget |
| Response caching | Redis cache on tutor queries (15-min TTL, keyed by module+query hash) | Learners in same cohort asking similar questions hit cache |
| Model tiering | gpt-4o-mini for hints, gpt-4o for feedback/reports | Match model cost to value delivered |
| Cohort-level amortization | Instructor Insight, Assessor Support, Academic Performance agents run per-cohort | One AI analysis serves 30-50 learners |
| Async processing | SQS queues for executive reports, dropout evaluations, analytics | Smooth cost spikes across cohort duration |
| Circuit breaker | 5 failures → 30s cooldown → half-open probe | Prevent cascading retry costs |
| Foundation ceiling | ~$3/learner total for Foundation School | Protect pre-conversion economics |
| Post-cohort wind-down | AI features reduce to 5 hints/day for 30 days, then end | No indefinite AI cost tail |
| Token budgets | Per-agent token limits per request (tutor: 1K output, feedback: 2K output) | Bound per-request cost |

### What Is NOT Allowed for Cost Reasons

1. **No unlimited conversational AI** — Learners cannot have open-ended chat sessions with AI agents. All interactions are action-based with defined inputs and bounded outputs.
2. **No real-time AI code generation** — AI provides hints and error explanations, not full code generation. Prevents unbounded token usage during coding sessions.
3. **No AI-generated curriculum** — Curriculum is instructor-authored and version-controlled. AI personalizes emphasis and pacing within the existing curriculum.
4. **No AI access outside cohort window** — After the 30-day post-cohort grace period, AI features are fully deactivated. Learners must re-enroll in a new cohort for continued AI access.
5. **No Foundation access to premium AI** — Assignment Feedback Agent, Career Support Agent, and AI Code Review are cohort-only features.

### Cohort-Level Metering and Observability

- Every LLM call logged as AWE-* with token count, model used, latency, cost estimate, and cohort_id
- Daily aggregation job computes per-cohort AI cost and per-learner AI cost within cohort
- Super Admin Cohort Economics dashboard surfaces: cohort revenue, AI cost, gross margin, cache hit rate, completion rate
- Alerts trigger when cohort AI spend exceeds 120% of pre-calculated budget
- Weekly cohort AI cost report emailed to Super Admin
