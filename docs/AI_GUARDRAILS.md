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
