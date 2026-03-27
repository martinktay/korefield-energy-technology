# System Architecture — KoreField Academy

## High-Level Architecture

Four independently deployable workloads on AWS ECS Fargate:

1. **Frontend** — Next.js 14+ App Router, serves all portal types
2. **Backend API** — NestJS, core business logic, REST APIs
3. **AI Services** — Python FastAPI, LangChain/LangGraph agents (isolated to prevent resource contention)
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
