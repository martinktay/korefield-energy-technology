# System Architecture — KoreField Academy

## High-Level Architecture

Four independently deployable workloads on AWS ECS Fargate:

1. **Frontend** — Next.js 14+ App Router, serves all portal types
2. **Backend API** — NestJS, core business logic, REST APIs
3. **AI Services** — Python FastAPI, LangChain/LangGraph agents (8 executive, 3 faculty, 4 learner — isolated to prevent resource contention)
4. **Background Workers** — TypeScript SQS consumers for async operations

## Service Communication

| From | To | Method |
|------|----|--------|
| Frontend | Backend API | REST over HTTPS (JWT-authenticated) |
| Backend API | AI Services | REST over HTTPS (internal service mesh) |
| Backend API | Workers | Async via SQS queues |
| AI Services | LLM Providers | HTTPS API calls with circuit breakers and rate limiting |
| AI Services | LangSmith | Trace emission over HTTPS |
| All services | PostgreSQL | Connection-pooled SQL |
| All services | Redis | Cache reads/writes |
| Frontend | Cloudflare Stream | Direct video playback (no AWS proxy) |

## Data Layer

| Service | Purpose |
|---------|---------|
| RDS PostgreSQL | Primary relational data store for all domain entities |
| ElastiCache Redis | Caching (catalog, pricing, sessions, progress, dashboard metrics) |
| S3 | Object storage (static assets, uploads, backups, certificates) |
| SQS | Async message queuing (5 queues + 5 DLQs) |
| Secrets Manager | Credentials, API keys, encryption keys with automated rotation |

## SQS Queues

| Queue | Purpose | DLQ |
|-------|---------|-----|
| `cert-generation` | Certificate PDF generation | `cert-generation-dlq` |
| `ai-workflow` | Long-running AI agent workflows | `ai-workflow-dlq` |
| `analytics` | Batch metric pre-aggregation | `analytics-dlq` |
| `notifications` | Email/push notification delivery | `notifications-dlq` |
| `payment-events` | Scheduled installment processing | `payment-events-dlq` |

## Caching Strategy (Redis)

| Key Pattern | TTL | Data |
|-------------|-----|------|
| `catalog:tracks` | 15 min | Track catalog listing |
| `track:{TRK-*}:detail` | 15 min | Track detail with curriculum |
| `pricing:{TRK-*}:{country}` | 5 min | Computed pricing |
| `session:{USR-*}` | JWT expiry | Active session |
| `progress:{LRN-*}:{TRK-*}` | 2 min | Learner progress |
| `dashboard:superadmin:*` | 10 min | Pre-aggregated metrics |

## Environment Strategy

Three isolated environments: dev, staging, production
- Identical Terraform definitions, differing only in scale/config
- Network-level and IAM-level isolation between environments
- Zero-downtime ECS Fargate deployments with automated rollback

## Architectural Rules

- Services communicate via API contracts or SQS — no direct DB sharing
- Each service owns its data exclusively
- Long-running ops route through workers via SQS
- High-read endpoints cached via Redis
- Super Admin dashboards use pre-aggregated metrics, not live queries
- Video content served from Cloudflare Stream — never proxied through AWS
- All entities use domain-prefixed custom IDs (never auto-increment or raw UUIDs)


## AI Cost Metering (Cohort-Level)

Every LLM invocation is tracked for cohort-level cost attribution and optimization:

| Metric | Source | Storage | Aggregation |
|--------|--------|---------|-------------|
| Token count (input + output) | LLM response metadata | AWE-* record | Daily per-cohort rollup |
| Model used | llm_factory.py | AWE-* record | Per-agent breakdown |
| Latency (ms) | Agent telemetry | AWE-* record | P50/P95/P99 per agent |
| Estimated cost ($) | Token count × model pricing | AWE-* record | Daily/weekly per cohort |
| Cohort ID | Enrollment → cohort mapping | AWE-* record | Per-cohort totals |
| Cache hit/miss | Redis cache layer | CloudWatch metric | Hourly per cohort |
| Circuit breaker state | circuit_breaker.py | CloudWatch metric | Real-time |

### Cohort Cost Attribution Flow

```
LLM Call → llm_factory.invoke_llm() → circuit_breaker.call()
    ↓
AWE-* record created with:
  - agent_type, workflow_type
  - learner_id, cohort_id (derived from enrollment)
  - token_count_input, token_count_output
  - model_name, latency_ms
  - estimated_cost_usd
    ↓
Daily aggregation worker (analytics queue):
  - SUM(estimated_cost_usd) GROUP BY cohort_id → per-cohort daily cost
  - SUM(estimated_cost_usd) GROUP BY cohort_id, learner_id → per-learner within cohort
  - SUM(estimated_cost_usd) GROUP BY agent_type → per-agent daily cost
  - Compare actual vs budgeted per cohort → alert if >120% budget
    ↓
Super Admin Cohort Economics Dashboard:
  - Cohort revenue vs AI cost vs gross margin
  - AI cost per active learner within cohort
  - Cohort AI budget utilization (actual/budgeted %)
  - Cache hit rate trends (higher = better efficiency)
  - Foundation → Cohort conversion cost (Foundation AI spend / conversions)
  - Week-over-week AI consumption curve per cohort
```
