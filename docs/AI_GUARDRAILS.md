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
