# LangSmith Observability — KoreField Academy

## Purpose
LangSmith provides observability, evaluation, and debugging for all AI agent workflows.

## Tracing

### What Gets Traced
- All agent workflow executions (AWE-* records)
- Input parameters
- Intermediate steps (each LangGraph node, each LangChain call)
- Output results
- Execution duration (ms)
- Token usage per call
- Retrieval hit counts (RAG operations)

### Trace Retention
- Production: 90-day retention
- Staging/Dev: configurable, shorter retention

### Trace Correlation
- Each trace linked to AWE-* workflow execution record
- langsmith_trace_id stored in AgentWorkflowExecution table
- Distributed trace ID propagated across frontend → backend → AI services → workers

## Prompt Debugging

### Metrics Tracked
- Failure rates per prompt version
- Latency per prompt version (avg, p50, p95, p99)
- Version-to-version quality comparisons
- Token consumption per prompt

### Debugging Workflow
1. Identify failing prompt via failure rate alert
2. Open LangSmith trace for failed execution
3. Inspect input, intermediate steps, output
4. Compare with successful executions of same prompt version
5. Iterate on prompt, evaluate, deploy new version

## Workflow Evaluation

### Quality Metrics
- Response relevance (does the output address the input?)
- Response accuracy (is the output factually correct?)
- Response safety (does the output comply with guardrails?)
- End-to-end success rate per workflow type
- Latency distribution per workflow type

### Evaluation Pipeline
- Curated evaluation datasets per agent type
- Automated evaluation runs before prompt deployment
- Results recorded in PromptVersion (PMV-*) evaluation_results field

## Failure Monitoring

### Failure Logging
Every failure logged with:
- Reason for failure
- Affected agent type
- Workflow step where failure occurred
- Input context (sanitized)
- Timestamp

### Alerting
- Operations team notified on agent failures
- Alert thresholds configurable per agent type
- Circuit breaker patterns prevent cascade failures

## Cost Tracking

- Token consumption tracked per agent per time period
- Cost attribution per agent type
- Rate limiting: per-agent and per-user limits on LLM API calls
- Budget alerts on threshold breach
