# Prompt Engineering Standard — KoreField Academy

## Prompt Storage
- All production prompts stored in `ai-services/prompts/`
- Version-controlled with PMV-* identifiers
- Separated from application code

## Prompt Lifecycle

### 1. Development
- Write prompt with clear purpose, expected input/output, and constraints
- Include system instructions, role definition, and output format specification
- Document limitations and edge cases

### 2. Evaluation
- Test against curated evaluation dataset before deployment
- Record relevance, accuracy, and safety results
- Compare against previous version metrics

### 3. Review and Approval
- Change review required before production deployment
- Approval process documented per prompt

### 4. Deployment
- Deploy with version identifier (PMV-*)
- Previous version retained for rollback
- LangSmith tracing enabled on all deployed prompts

### 5. Monitoring
- Track failure rates per prompt version
- Track latency per prompt version
- Compare versions for quality regression
- Alert on degradation thresholds

## Prompt Design Rules

1. Every prompt must have a defined purpose and scope
2. System instructions must include agent constraints (see AI_GUARDRAILS.md)
3. Output format must be structured (JSON preferred for programmatic consumption)
4. Prompts must include safety instructions (no fabrication, no harmful content)
5. Confidence indicators required on outputs where applicable
6. Prompts must be idempotent — same input produces consistent output structure
7. Token budget awareness — prompts designed within model context limits

## Agent-Specific Prompt Requirements

| Agent | Special Requirements |
|-------|---------------------|
| Tutor Agent | Must cite curriculum content, adaptive pacing instructions |
| Feedback Agent | Structured output (strengths, improvements, rubric alignment), confidence indicator |
| Dropout Risk Agent | Signal weighting instructions, threshold definitions |
| Market Intelligence Agent | Source citation required, confidence scoring, no unsupported claims |
| Certification Validation Agent | Step-by-step verification instructions, blocking condition reporting |
