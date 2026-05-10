# Staging Provisioning Runbook

## 1. Purpose

This runbook tells an operator how to create the first real, production-isolated staging environment for KoreField Academy Phase 3A diagnostic onboarding validation.

It is intentionally conservative:

- It does not use production services for validation.
- It does not enable learner-facing AI features by default.
- It does not automate raw SQL migration `0018`.
- It does not assume Terraform staging resources are live.
- It does not provision backend or AI-service hosting from this repository.

Phase 3A remains code-ready but staging validation incomplete until this runbook and the Phase 3A validation runbook in `docs/AI_GUARDRAILS.md` both pass.

## 2. Current Status

Evidence from the repository and live verification:

- Current commit when this runbook was written: `e05b260d52fdab8fb86e507d479f6925ebb97c86`.
- Frontend staging workflow exists: `.github/workflows/deploy-vercel-academy-staging.yml`.
- CD workflow has been updated so manual staging deploys are not blocked by skipped `deploy-dev`.
- No GitHub Environment named `staging` was proven to exist.
- No live staging frontend URL was proven.
- No live staging backend URL was proven.
- No live staging AI-service URL was proven.
- No live staging `DATABASE_URL` was proven.
- Terraform has staging definitions, but no live AWS resources were verified.
- Backend and AI services both have Dockerfiles.
- AI services expose `GET /health`.
- Backend exposes `GET /health` as an unauthenticated process liveness check.
- Workers are SQS consumers and are not required for the Phase 3A diagnostic onboarding smoke tests.
- Redis is used by AI tutor/cap/cache paths, but Phase 3A diagnostic onboarding does not require Redis and Redis failures are designed to fail open in later tutor paths.

## 3. Final Recommended Staging Stack

| Component                | Recommended choice                               | Why                                                                                                                          |
| ------------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Frontend                 | Separate Vercel staging project                  | Matches current frontend deployment direction while isolating production.                                                    |
| Backend                  | Render Web Service from `backend/Dockerfile`     | Docker-compatible, public HTTPS URL, service logs, env vars, health checks, and manual control are a good fit for this repo. |
| AI services              | Render Web Service from `ai-services/Dockerfile` | Same operational model as backend, supports independent restart/stop for AI failure testing.                                 |
| PostgreSQL               | Neon staging project/database                    | Standard Postgres connection string, SSL, low-friction isolated staging DB, good fit for manual `psql` migration.            |
| Redis                    | Skip initially                                   | Not required for Phase 3A diagnostic onboarding validation.                                                                  |
| Workers                  | Skip initially                                   | Phase 3A does not require SQS workers; run later when testing async email/certificate/payment workflows.                     |
| Raw SQL migration `0018` | Manual first                                     | Keeps database mutation explicit and auditable before production enablement.                                                 |
| Feature flags            | All off by default                               | Required by AI guardrails and rollback strategy.                                                                             |

Acceptable fallback stack:

- Frontend: separate Vercel staging project.
- Backend and AI services: Fly.io apps from Dockerfiles.
- Database: Supabase Postgres or Render Postgres.

Use the fallback only if Render is not available to the business owner or if an existing approved provider account already exists elsewhere.

## 4. Accounts / Access Required

The operator must have:

- GitHub admin access to `martinktay/korefield-energy-technology`.
- Ability to create GitHub Environments, environment secrets, and environment variables.
- Vercel access with permission to create a separate staging project.
- Render access with permission to create web services.
- Neon access with permission to create a staging Postgres project/database.
- A staging-only OpenAI API key with budget controls.
- Access to provider logs for Vercel, Render backend, Render AI service, and Neon/Postgres.
- Local or hosted `psql` access to apply and verify migration `0018`.

Information only the business owner/operator can provide:

- Final staging domain names, if custom domains are desired.
- Provider account/team IDs.
- Staging OpenAI key and spend cap.
- Whether GitHub staging deployments require one or more reviewers.
- Whether backend/AI service staging should auto-deploy from `main` or remain manual for the first validation.

## 5. What Must Be Created Manually

Create these manually before Phase 3A validation:

1. GitHub Environment named `staging`.
2. Separate Vercel project for frontend staging.
3. Render web service for backend staging.
4. Render web service for AI-service staging.
5. Neon staging Postgres database.
6. Staging-only secrets and variables listed in this runbook.
7. Staging logs access for each service.

Do not create or modify production resources while following this runbook.

## 6. GitHub Environment `staging` Setup

Create a GitHub Environment:

```text
Repository -> Settings -> Environments -> New environment -> staging
```

Recommended protection:

- Required reviewers: enabled.
- Deployment branches: restrict to `main` or an approved staging branch.
- Admin bypass: disable unless the business owner explicitly approves emergency bypass.

Add these environment secrets:

```text
STAGING_DATABASE_URL=<secret Neon pooled or direct PostgreSQL URL>
STAGING_BACKEND_JWT_SECRET=<staging-only random secret>
STAGING_PAYMENT_WEBHOOK_SECRET=<staging-only dummy or sandbox secret>
STAGING_OPENAI_API_KEY=<staging-only budget-limited OpenAI key>
STAGING_LANGSMITH_API_KEY=<optional staging LangSmith key>
STAGING_VERCEL_TOKEN=<Vercel token for staging project deploy>
STAGING_VERCEL_ORG_ID=<Vercel org/team ID>
STAGING_VERCEL_PROJECT_ID=<Vercel staging project ID>
```

Add these environment variables:

```text
STAGING_VERCEL_DEPLOY_ENABLED=false
STAGING_FRONTEND_URL=https://<staging-frontend>
STAGING_BACKEND_URL=https://<staging-backend>
STAGING_AI_SERVICES_URL=https://<staging-ai-service>
NEXT_PUBLIC_API_URL=https://<staging-backend>
NEXT_PUBLIC_AI_SERVICES_URL=https://<staging-ai-service>
NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING=false
NEXT_PUBLIC_FEATURE_AI_LESSON_TUTOR=false
NEXT_PUBLIC_FEATURE_AI_SUBMISSION_FEEDBACK=false
NEXT_PUBLIC_FEATURE_AI_ADAPTIVE_RECOMMENDATIONS=false
NEXT_PUBLIC_FEATURE_AI_INSTRUCTOR_INSIGHTS=false
NEXT_PUBLIC_FEATURE_AI_CORPORATE_COHORT_INSIGHTS=false
NEXT_PUBLIC_FEATURE_LOW_DATA_MODE=false
NEXT_PUBLIC_FEATURE_OFFLINE_PROGRESS_SYNC=false
KF_ENVIRONMENT=staging
KF_DEBUG=false
KF_CORS_ORIGINS=["https://<staging-frontend>"]
NODE_ENV=staging
FRONTEND_URL=https://<staging-frontend>
```

Pass checkpoint:

- GitHub Environment `staging` exists.
- No production secrets are copied into staging.
- `STAGING_VERCEL_DEPLOY_ENABLED=false`.
- All `NEXT_PUBLIC_FEATURE_*` variables are `false`.

Fail checkpoint:

- Any production database URL, production AI-service URL, production Vercel project ID, or production OpenAI key is used.

## 7. Vercel Staging Project Setup

Create a separate Vercel project:

```text
Project name: korefield-academy-staging
Framework: Next.js
Root directory: frontend
Build command: pnpm run build
Install command: pnpm install
Output directory: .next
```

Set Vercel project environment variables:

```text
NEXT_PUBLIC_API_URL=https://<staging-backend>
NEXT_PUBLIC_AI_SERVICES_URL=https://<staging-ai-service>
NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING=false
NEXT_PUBLIC_FEATURE_AI_LESSON_TUTOR=false
NEXT_PUBLIC_FEATURE_AI_SUBMISSION_FEEDBACK=false
NEXT_PUBLIC_FEATURE_AI_ADAPTIVE_RECOMMENDATIONS=false
NEXT_PUBLIC_FEATURE_AI_INSTRUCTOR_INSIGHTS=false
NEXT_PUBLIC_FEATURE_AI_CORPORATE_COHORT_INSIGHTS=false
NEXT_PUBLIC_FEATURE_LOW_DATA_MODE=false
NEXT_PUBLIC_FEATURE_OFFLINE_PROGRESS_SYNC=false
NEXT_TELEMETRY_DISABLED=1
```

Set GitHub Environment secrets for the workflow:

```text
STAGING_VERCEL_TOKEN
STAGING_VERCEL_ORG_ID
STAGING_VERCEL_PROJECT_ID
```

The staging workflow is manual:

```text
.github/workflows/deploy-vercel-academy-staging.yml
```

It deploys only when:

```text
STAGING_VERCEL_DEPLOY_ENABLED=true
confirm_staging_deploy=true
```

For first setup, leave:

```text
STAGING_VERCEL_DEPLOY_ENABLED=false
```

Pass checkpoint:

- The staging project is separate from the production Vercel project.
- The staging project does not use `academy.korefield.com`.
- Feature flags are all off.

## 8. Backend Staging Host Setup

Recommended host: Render Web Service.

Evidence fit:

- `backend/Dockerfile` exists.
- Backend listens on `PORT` from env or defaults to `3000`; set `PORT=3001`.
- Backend requires `DATABASE_URL`.
- Backend currently uses an in-memory cache stub, not Redis, for startup.
- SQS queue URLs are optional for Phase 3A but may produce logged failures if unrelated email/payment flows are exercised.

Create service manually:

```text
Service type: Web Service
Name: korefield-academy-backend-staging
Source: GitHub repo
Root directory: backend
Runtime: Docker
Branch: main
Auto-deploy: off for first validation
Public URL: enabled
```

Set environment variables:

```text
DATABASE_URL=<staging Neon PostgreSQL URL>
PORT=3001
NODE_ENV=staging
JWT_SECRET=<staging-only random secret>
JWT_EXPIRATION_SECONDS=3600
PAYMENT_WEBHOOK_SECRET=<staging-only dummy or sandbox secret>
FRONTEND_URL=https://<staging-frontend>
EMAIL_QUEUE_URL=
EMAIL_DLQ_URL=
PAYMENT_EVENTS_QUEUE_URL=
```

Health-check expectation:

```bash
curl -s https://<staging-backend>/health
```

Expected JSON includes:

```json
{
  "status": "healthy",
  "service": "backend",
  "timestamp": "<ISO-8601 timestamp>"
}
```

This is a lightweight liveness check only. It proves the backend process can respond over HTTPS; it does not verify database readiness. Add a separate `/ready` endpoint later if staging or production operations require DB dependency checks.

Suggested public URL shape:

```text
https://korefield-academy-backend-staging.onrender.com
```

Pass checkpoint:

```bash
curl -i https://<staging-backend>/health
```

Expected:

- Service returns HTTP `200`.
- Response contains `status=healthy` and `service=backend`.
- Logs are visible in the provider dashboard.
- Backend can connect to staging PostgreSQL.

## 9. AI-Service Staging Host Setup

Recommended host: Render Web Service.

Evidence fit:

- `ai-services/Dockerfile` exists.
- AI services bind to `0.0.0.0:8000`.
- AI services expose `GET /health`.
- Diagnostic onboarding endpoint is `POST /ai/onboarding/diagnostic`.
- Phase 3A diagnostic does not require Redis.

Create service manually:

```text
Service type: Web Service
Name: korefield-academy-ai-staging
Source: GitHub repo
Root directory: ai-services
Runtime: Docker
Branch: main
Auto-deploy: off for first validation
Public URL: enabled
```

Set environment variables:

```text
KF_ENVIRONMENT=staging
KF_DEBUG=false
KF_APP_VERSION=0.1.0
KF_CORS_ORIGINS=["https://<staging-frontend>"]
KF_OPENAI_API_KEY=<staging-only budget-limited key>
KF_DEFAULT_MODEL=gpt-4o-mini
KF_LANGSMITH_TRACING_ENABLED=false
KF_LANGSMITH_PROJECT=korefield-academy-staging
KF_LANGSMITH_API_KEY=<optional staging key>
KF_DATABASE_URL=<staging database URL if needed later>
KF_REDIS_URL=redis://localhost:6379
```

For Phase 3A, Redis can remain absent. The diagnostic endpoint does not depend on Redis. Future tutor/cap/cache validation should add a staging Redis instance before Phase 3B/3C rollout.

Suggested public URL shape:

```text
https://korefield-academy-ai-staging.onrender.com
```

Pass checkpoint:

```bash
curl -s https://<staging-ai-service>/health
```

Expected JSON includes:

```json
{
  "status": "healthy",
  "service": "ai-services",
  "environment": "staging"
}
```

Safe AI-unavailable fallback test options:

1. Temporarily set Vercel staging `NEXT_PUBLIC_AI_SERVICES_URL` to `https://ai-staging-unavailable.invalid`.
2. Or stop only the staging AI-service.
3. Or revoke only the staging AI API key.

Never test AI failure by changing production AI-service configuration.

## 10. Staging PostgreSQL Setup

Recommended provider: Neon.

Create:

```text
Project: korefield-academy-staging
Database: korefield_academy
Role/user: korefield_staging
Region: choose the closest region to the backend host where available
SSL: required
```

Use a pooled connection string if the service host uses short-lived or bursty connections. Use a direct connection string only where the host network supports it and connection counts are low.

Required secret:

```text
STAGING_DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

Pass checkpoint:

```bash
psql "$STAGING_DATABASE_URL" -c "select current_database(), current_user;"
```

Expected:

- Database is `korefield_academy` or the operator-approved staging database.
- User is the staging user.
- Host is not production.

## 11. Optional Redis / Workers Decision

Redis:

- Skip initially for Phase 3A.
- Add before validating tutor usage caps, tutor response caching, or Phase 3B tutor behavior.
- If added later, use a staging-only managed Redis instance and set `KF_REDIS_URL`.

Workers:

- Skip initially for Phase 3A.
- Add only when validating async email, certificates, payment events, analytics, or AI workflow queues.
- Workers require staging SQS-like queues or an approved provider equivalent.

Pass checkpoint:

- Phase 3A onboarding can complete without Redis and workers.

Fail checkpoint:

- Backend or AI service cannot boot without Redis/workers. If that happens, stop and document the startup error before provisioning extra services.

## 12. Required Environment Variables and Secrets

Frontend public variables:

```text
NEXT_PUBLIC_API_URL=https://<staging-backend>
NEXT_PUBLIC_AI_SERVICES_URL=https://<staging-ai-service>
NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING=false
NEXT_PUBLIC_FEATURE_AI_LESSON_TUTOR=false
NEXT_PUBLIC_FEATURE_AI_SUBMISSION_FEEDBACK=false
NEXT_PUBLIC_FEATURE_AI_ADAPTIVE_RECOMMENDATIONS=false
NEXT_PUBLIC_FEATURE_AI_INSTRUCTOR_INSIGHTS=false
NEXT_PUBLIC_FEATURE_AI_CORPORATE_COHORT_INSIGHTS=false
NEXT_PUBLIC_FEATURE_LOW_DATA_MODE=false
NEXT_PUBLIC_FEATURE_OFFLINE_PROGRESS_SYNC=false
NEXT_TELEMETRY_DISABLED=1
```

Backend secrets/vars:

```text
DATABASE_URL=<staging PostgreSQL URL>
PORT=3001
NODE_ENV=staging
JWT_SECRET=<staging-only secret>
JWT_EXPIRATION_SECONDS=3600
PAYMENT_WEBHOOK_SECRET=<staging-only secret>
FRONTEND_URL=https://<staging-frontend>
```

AI-service secrets/vars:

```text
KF_ENVIRONMENT=staging
KF_DEBUG=false
KF_APP_VERSION=0.1.0
KF_CORS_ORIGINS=["https://<staging-frontend>"]
KF_OPENAI_API_KEY=<staging-only budget-limited key>
KF_DEFAULT_MODEL=gpt-4o-mini
KF_LANGSMITH_TRACING_ENABLED=false
KF_LANGSMITH_PROJECT=korefield-academy-staging
```

GitHub staging secrets:

```text
STAGING_DATABASE_URL
STAGING_BACKEND_JWT_SECRET
STAGING_PAYMENT_WEBHOOK_SECRET
STAGING_OPENAI_API_KEY
STAGING_LANGSMITH_API_KEY
STAGING_VERCEL_TOKEN
STAGING_VERCEL_ORG_ID
STAGING_VERCEL_PROJECT_ID
```

## 13. URL Naming Recommendation

Use predictable staging names:

```text
Frontend: https://academy-staging.korefield.com
Backend:  https://api-academy-staging.korefield.com
AI:       https://ai-academy-staging.korefield.com
```

If custom domains are not ready, use provider URLs:

```text
Frontend: https://korefield-academy-staging.vercel.app
Backend:  https://korefield-academy-backend-staging.onrender.com
AI:       https://korefield-academy-ai-staging.onrender.com
```

Do not use:

```text
https://academy.korefield.com
production backend URL
production AI-service URL
production database host
```

## 14. Cost-Control Measures

Use the smallest sensible staging resources:

- Keep frontend on separate Vercel staging project.
- Use one small backend web service.
- Use one small AI-service web service.
- Use one isolated staging PostgreSQL database.
- Skip Redis initially.
- Skip workers initially.
- Disable auto-deploy for first validation.
- Use a staging-only OpenAI key with a hard budget cap.
- Keep all AI feature flags off by default.
- Stop or scale down staging services outside validation windows if the provider supports it.
- Keep log retention modest but long enough to capture validation evidence.

Do not create:

- Multi-AZ RDS for first Phase 3A validation.
- ECS desired count `2` for every service unless AWS staging is explicitly selected later.
- Redis or SQS queues until a validation path requires them.
- Production-like custom domains before provider URLs pass smoke tests.

## 15. Safe Provisioning Order

Follow this order:

1. Create GitHub Environment `staging`.
2. Create Neon staging Postgres database.
3. Create Render backend staging service, but do not route production traffic to it.
4. Create Render AI-service staging service.
5. Create separate Vercel staging project.
6. Wire staging URLs into GitHub and Vercel variables.
7. Confirm all feature flags are `false`.
8. Deploy backend staging manually.
9. Deploy AI-service staging manually.
10. Deploy frontend staging manually.
11. Apply migration `0018` to staging only.
12. Run the Phase 3A validation runbook.

Stop if any step accidentally points to production.

## 16. First Deployment Order

Backend first:

```bash
curl -i https://<staging-backend>
```

AI-service second:

```bash
curl -s https://<staging-ai-service>/health
```

Frontend third:

```text
GitHub Actions -> Deploy Academy Staging - Vercel -> Run workflow
confirm_staging_deploy=true
```

Migration after backend DB connectivity is proven:

```bash
psql "$STAGING_DATABASE_URL" -f db/migrations/0018_learner_diagnostic_results.sql
```

## 17. Exact Prerequisites Before Running the Phase 3A Validation Runbook

These must all be true:

- GitHub Environment `staging` exists.
- Vercel staging project exists and is separate from production.
- Backend staging service has a public HTTPS URL.
- AI-service staging service has a public HTTPS URL.
- Staging Postgres database exists.
- `STAGING_DATABASE_URL` is known and verified.
- `NEXT_PUBLIC_API_URL` points to staging backend.
- `NEXT_PUBLIC_AI_SERVICES_URL` points to staging AI service.
- `NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING=false`.
- Migration `0018` has not been applied to production.
- Operator has access to Vercel, backend, AI-service, and database logs.
- AI-service tests can run in a network-capable environment:

```bash
cd ai-services
UV_CACHE_DIR=.uv-cache uv sync --group dev
UV_CACHE_DIR=.uv-cache uv run pytest tests/test_learner_agents.py -q
```

## 18. What Must Remain OFF by Default

These must remain `false` before the smoke-test step that explicitly turns on Phase 3A:

```text
NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING=false
NEXT_PUBLIC_FEATURE_AI_LESSON_TUTOR=false
NEXT_PUBLIC_FEATURE_AI_SUBMISSION_FEEDBACK=false
NEXT_PUBLIC_FEATURE_AI_ADAPTIVE_RECOMMENDATIONS=false
NEXT_PUBLIC_FEATURE_AI_INSTRUCTOR_INSIGHTS=false
NEXT_PUBLIC_FEATURE_AI_CORPORATE_COHORT_INSIGHTS=false
NEXT_PUBLIC_FEATURE_LOW_DATA_MODE=false
NEXT_PUBLIC_FEATURE_OFFLINE_PROGRESS_SYNC=false
```

Only `NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING` may be set to `true` during the Phase 3A staging smoke test. Turn it back to `false` immediately if validation fails.

## 19. What Not To Do

Do not:

- Use production database credentials.
- Use production Vercel project IDs.
- Use production backend or AI-service URLs.
- Use production OpenAI keys.
- Enable Phase 3A by default.
- Start Phase 3B.
- Provision Redis or workers before Phase 3A proves it needs them.
- Apply migration `0018` to production.
- Run fallback testing by breaking production AI services.
- Claim Phase 3A is production-ready before all validation gates pass.

## 20. Final Checklist

Before Phase 3A validation:

- [ ] GitHub Environment `staging` created.
- [ ] GitHub staging secrets added.
- [ ] GitHub staging variables added.
- [ ] Separate Vercel staging project created.
- [ ] Vercel staging env vars added.
- [ ] Backend staging service created.
- [ ] AI-service staging service created.
- [ ] Staging Postgres database created.
- [ ] `STAGING_DATABASE_URL` verified with `psql`.
- [ ] Backend `/health` returns `status=healthy`.
- [ ] AI-service `/health` returns `status=healthy`.
- [ ] Frontend staging URL loads.
- [ ] All AI feature flags are off by default.
- [ ] Migration `0018` applied to staging only.
- [ ] Migration verification SQL passed.
- [ ] AI-service pytest passed in a network-capable environment.
- [ ] Operator can access frontend, backend, AI-service, and database logs.
- [ ] Phase 3A validation runbook is ready to execute.

If every item is checked, proceed to the Phase 3A validation runbook in `docs/AI_GUARDRAILS.md`.

If any item remains unchecked, Phase 3A remains code-ready but staging validation incomplete.

## Provider Decision Guide

### Backend Staging Options

| Option             | Operational fit                                                    | Ease of deployment                                                       | Lowest-cost suitability                                          | Observability/logging             | Production isolation            | AI-failure testing                                    | Main risks                                                              | Recommendation                       |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------------------------- | --------------------------------- | ------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------ |
| Render Web Service | Strong fit: Dockerfile, public HTTPS URL, env vars, health checks. | High. Connect repo and root `backend`.                                   | Good for a small always-on staging backend.                      | Dashboard logs and deploy events. | Separate service and env vars.  | Indirect; backend stays running while AI URL changes. | `/health` is liveness only; add `/ready` later if DB checks are needed. | Recommended.                         |
| Railway            | Good Docker/service fit.                                           | High. CLI/dashboard deploys and logs.                                    | Good for small staging.                                          | Logs available in dashboard/CLI.  | Separate project/service.       | Indirect; backend independent.                        | Less repo-specific evidence than Render.                                | Acceptable fallback.                 |
| Fly.io             | Good Docker fit.                                                   | Medium. Needs app config and flyctl setup.                               | Good for small VM-style apps.                                    | Logs and Machines observability.  | Separate app.                   | Indirect; backend independent.                        | More operator setup than Render.                                        | Fallback if Fly is already approved. |
| AWS App Runner/ECS | Existing Terraform points toward AWS/ECS.                          | Medium to low for first staging because live AWS resources are unproven. | Likely overbuilt for Phase 3A if using full ECS/RDS/Redis stack. | CloudWatch when configured.       | Strong if separate account/env. | Indirect; can stop AI service.                        | More setup, IAM, ingress, cost, and workflow risk.                      | Defer unless AWS is mandated.        |

### AI-Service Staging Options

| Option             | Operational fit                                       | Ease of deployment                         | Lowest-cost suitability                                             | Observability/logging             | Production isolation              | AI-failure testing                                       | Main risks                                                              | Recommendation                       |
| ------------------ | ----------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------- | --------------------------------- | --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------ |
| Render Web Service | Strong fit: Dockerfile, FastAPI, `/health`, env vars. | High. Connect repo and root `ai-services`. | Good for one small staging service.                                 | Dashboard logs and deploy events. | Separate service and staging key. | Strong: stop service, change URL, or revoke staging key. | Needs staging OpenAI budget discipline.                                 | Recommended.                         |
| Railway            | Good Docker/FastAPI fit.                              | High.                                      | Good for small staging.                                             | Logs available.                   | Separate service.                 | Strong.                                                  | Less repo-specific evidence than Render.                                | Acceptable fallback.                 |
| Fly.io             | Good Docker fit.                                      | Medium.                                    | Good for small app.                                                 | Logs/Machines.                    | Separate app.                     | Strong.                                                  | More setup.                                                             | Fallback if Fly is already approved. |
| AWS App Runner/ECS | Works with containers.                                | Medium to low initially.                   | Overbuilt for first validation unless AWS is already paid/standard. | CloudWatch.                       | Strong.                           | Strong.                                                  | Current Terraform staging is unverified and no public URLs were proven. | Defer.                               |

### PostgreSQL Staging Options

| Option            | Operational fit                                            | Ease of deployment       | Lowest-cost suitability                | Observability/logging     | Production isolation       | AI-failure testing | Main risks                                               | Recommendation                |
| ----------------- | ---------------------------------------------------------- | ------------------------ | -------------------------------------- | ------------------------- | -------------------------- | ------------------ | -------------------------------------------------------- | ----------------------------- |
| Neon              | Strong: standard Postgres URL, SSL, pooled/direct options. | High.                    | Good for isolated staging database.    | Dashboard and SQL access. | Separate project/database. | N/A.               | Operator must choose correct pooled/direct URL for host. | Recommended.                  |
| Render Postgres   | Strong if backend/AI are also on Render.                   | High.                    | Good if consolidating provider.        | Render dashboard.         | Separate database.         | N/A.               | Provider lock-in with services.                          | Acceptable fallback.          |
| Supabase Postgres | Strong: standard Postgres, pooler options.                 | High.                    | Good if already using Supabase.        | Dashboard and SQL editor. | Separate project.          | N/A.               | Must choose correct pooler/direct mode for Prisma.       | Acceptable fallback.          |
| AWS RDS           | Strong production-style Postgres.                          | Medium to low initially. | Likely overbuilt for Phase 3A staging. | CloudWatch/RDS metrics.   | Strong.                    | N/A.               | Cost/ops overhead, live staging AWS unproven.            | Defer unless AWS is mandated. |

Official docs consulted:

- Render Web Services: https://render.com/docs/web-services
- Render environment variables: https://render.com/docs/configure-environment-variables
- Render health checks: https://render.com/docs/health-checks
- Render logs: https://render.com/docs/logging
- Railway deploys and variables: https://docs.railway.com/cli/deploying and https://docs.railway.com/variables
- Fly.io Docker deployments and deploys: https://fly.io/docs/languages-and-frameworks/dockerfile/ and https://fly.io/docs/apps/deploy/
- Neon connection strings: https://neon.com/docs/get-started-with-neon/connect-neon
- Supabase connection strings: https://supabase.com/docs/reference/postgres/connection-strings
- Vercel deploy and environment variables: https://vercel.com/docs/cli/deploy and https://vercel.com/docs/projects/environment-variables
- AWS App Runner environment variables: https://docs.aws.amazon.com/apprunner/latest/dg/env-variable.html
