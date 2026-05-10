# Staging Environment Setup

This document prepares KoreField Academy for a production-isolated Phase 3A staging validation. It does not provision infrastructure, deploy services, or enable learner-facing AI features by itself.

Phase 3A diagnostic onboarding is code-ready, but it is not production-ready to enable until an isolated staging environment passes the Phase 3A validation runbook in `docs/AI_GUARDRAILS.md`.

## Current Staging Status

The live staging verification pass found no proven usable live staging environment:

- No GitHub Environment named `staging` was present.
- No staging frontend URL was proven.
- No staging backend URL was proven.
- No staging AI-service URL was proven.
- No staging `DATABASE_URL` was proven.
- Terraform contains staging definitions, but no live AWS staging resources were verified.

## Required GitHub Environment

Create a GitHub Environment named `staging`. It must remain isolated from production and must not reuse production secrets, production databases, production Vercel projects, or production AI-service URLs.

Recommended protection rules:

- Require manual approval before deployments.
- Restrict deployment branches to `main` or an approved staging branch.
- Keep admins from bypassing reviews unless there is an incident response reason.
- Keep production environment secrets unavailable to the `staging` environment.

### Required Secrets

| Secret                                          | Used by                   | Purpose                                                                        |
| ----------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------ |
| `STAGING_DATABASE_URL`                          | backend, manual migration | Secret staging PostgreSQL connection string. Never expose client-side.         |
| `STAGING_BACKEND_JWT_SECRET`                    | backend                   | Staging-only JWT signing secret.                                               |
| `STAGING_PAYMENT_WEBHOOK_SECRET`                | backend                   | Staging-only webhook secret if backend startup requires payment configuration. |
| `STAGING_OPENAI_API_KEY` or `KF_OPENAI_API_KEY` | AI services               | Staging-only, budget-limited OpenAI key.                                       |
| `STAGING_LANGSMITH_API_KEY`                     | AI services               | Optional staging tracing key.                                                  |
| `STAGING_VERCEL_TOKEN`                          | frontend staging workflow | Token for the separate Vercel staging project.                                 |
| `STAGING_VERCEL_ORG_ID`                         | frontend staging workflow | Vercel org/team ID for staging.                                                |
| `STAGING_VERCEL_PROJECT_ID`                     | frontend staging workflow | Project ID for the separate Vercel staging frontend project.                   |

### Required Variables

| Variable                                           | Value                             | Public? | Purpose                                                      |
| -------------------------------------------------- | --------------------------------- | ------- | ------------------------------------------------------------ |
| `STAGING_VERCEL_DEPLOY_ENABLED`                    | `false` until ready, then `true`  | No      | Enables the manual staging Vercel workflow.                  |
| `STAGING_FRONTEND_URL`                             | staging frontend URL              | Yes     | GitHub deployment URL and backend CORS origin.               |
| `STAGING_BACKEND_URL`                              | staging backend URL               | Yes     | Backend API base URL.                                        |
| `STAGING_AI_SERVICES_URL`                          | staging AI-service URL            | Yes     | AI services base URL.                                        |
| `NEXT_PUBLIC_API_URL`                              | same as `STAGING_BACKEND_URL`     | Yes     | Browser-visible frontend backend URL.                        |
| `NEXT_PUBLIC_AI_SERVICES_URL`                      | same as `STAGING_AI_SERVICES_URL` | Yes     | Canonical browser-visible AI-service URL.                    |
| `NEXT_PUBLIC_FEATURE_AI_DIAGNOSTIC_ONBOARDING`     | `false`                           | Yes     | Must remain off by default. Turn on only during smoke tests. |
| `NEXT_PUBLIC_FEATURE_AI_LESSON_TUTOR`              | `false`                           | Yes     | Must remain off.                                             |
| `NEXT_PUBLIC_FEATURE_AI_SUBMISSION_FEEDBACK`       | `false`                           | Yes     | Must remain off.                                             |
| `NEXT_PUBLIC_FEATURE_AI_ADAPTIVE_RECOMMENDATIONS`  | `false`                           | Yes     | Must remain off.                                             |
| `NEXT_PUBLIC_FEATURE_AI_INSTRUCTOR_INSIGHTS`       | `false`                           | Yes     | Must remain off.                                             |
| `NEXT_PUBLIC_FEATURE_AI_CORPORATE_COHORT_INSIGHTS` | `false`                           | Yes     | Must remain off.                                             |
| `NEXT_PUBLIC_FEATURE_LOW_DATA_MODE`                | `false`                           | Yes     | Must remain off unless separately validated.                 |
| `NEXT_PUBLIC_FEATURE_OFFLINE_PROGRESS_SYNC`        | `false`                           | Yes     | Must remain off unless separately validated.                 |
| `KF_ENVIRONMENT`                                   | `staging`                         | No      | AI-service environment label.                                |
| `KF_DEBUG`                                         | `false`                           | No      | AI-service debug mode.                                       |
| `KF_CORS_ORIGINS`                                  | `["https://<staging-frontend>"]`  | No      | AI-service CORS allowlist.                                   |
| `NODE_ENV`                                         | `staging`                         | No      | Backend runtime environment.                                 |
| `FRONTEND_URL`                                     | same as `STAGING_FRONTEND_URL`    | No      | Backend CORS, email links, and callbacks.                    |

## Frontend Staging on Vercel

Frontend staging must use a separate Vercel project from production. The production workflow in `.github/workflows/deploy-vercel-academy.yml` deploys to production and must not be reused for staging.

The staging workflow is `.github/workflows/deploy-vercel-academy-staging.yml`.

Safety behavior:

- It runs only by `workflow_dispatch`.
- It deploys only when `STAGING_VERCEL_DEPLOY_ENABLED=true`.
- The manual input `confirm_staging_deploy` must be set to `true`.
- It uses `STAGING_VERCEL_TOKEN`, `STAGING_VERCEL_ORG_ID`, and `STAGING_VERCEL_PROJECT_ID`.
- It forces all Phase 1 AI-native feature flags to `false` by default.

Manual Vercel setup required:

1. Create a separate Vercel project for staging.
2. Link that project to `frontend/`.
3. Set staging project environment variables:

```text
NEXT_PUBLIC_API_URL=<staging backend URL>
NEXT_PUBLIC_AI_SERVICES_URL=<staging AI-service URL>
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

Do not add production URLs, production Vercel project IDs, or production feature flags to the staging project.

## Backend Staging Requirements

No backend staging host is provisioned by this repo change. A future staging host must support:

- Deploying the `backend/` application or `backend/Dockerfile`.
- Public HTTPS URL reachable from the staging frontend.
- Access to a separate staging PostgreSQL database.
- Environment variables/secrets:

```text
DATABASE_URL=<staging PostgreSQL URL>
PORT=3001
NODE_ENV=staging
JWT_SECRET=<staging-only secret>
JWT_EXPIRATION_SECONDS=3600
PAYMENT_WEBHOOK_SECRET=<staging-only secret if required>
FRONTEND_URL=<staging frontend URL>
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

This is a process liveness check only. It does not verify database readiness; add a future `/ready` endpoint if operations require dependency-level readiness.

Logging expectation:

- Request failures.
- Authentication failures.
- Diagnostic result persistence failures.
- Migration command output when migrations are run.

CORS expectation:

- Allow the staging frontend origin.
- Do not allow production-only origins unless intentionally testing production-like routing in a staging-only stack.

## AI-Service Staging Requirements

No AI-service staging host is provisioned by this repo change. A future staging host must support:

- Deploying `ai-services/` or `ai-services/Dockerfile`.
- Public HTTPS URL reachable from the staging frontend.
- A staging-only, budget-limited OpenAI key.
- Staging logs for timeout, fallback, rate-limit, and guardrail behavior.
- Environment variables/secrets:

```text
KF_ENVIRONMENT=staging
KF_DEBUG=false
KF_APP_VERSION=<current app version>
KF_CORS_ORIGINS=["<staging frontend URL>"]
KF_OPENAI_API_KEY=<staging-only budget-limited key>
KF_DEFAULT_MODEL=gpt-4o-mini
KF_LANGSMITH_TRACING_ENABLED=false
KF_LANGSMITH_PROJECT=korefield-academy-staging
```

Health-check expectation:

```text
GET /health
```

Phase 3A success endpoint:

```text
POST /ai/onboarding/diagnostic
```

Safe AI-unavailable fallback testing must be possible without touching production. Use one of these staging-only approaches:

- Temporarily set the staging frontend `NEXT_PUBLIC_AI_SERVICES_URL` to an unavailable staging target.
- Temporarily stop or disable only the staging AI-service.
- Temporarily revoke only the staging AI key.

Do not simulate AI failure by changing production AI-service configuration.

## CD Workflow Behavior

Before this preparation, `.github/workflows/cd.yml` had `deploy-staging` depend on both `build` and `deploy-dev`. Because `deploy-dev` only runs on push events, a manual `workflow_dispatch` staging deploy could be skipped when `deploy-dev` was skipped.

After this preparation:

- `deploy-staging` depends only on `build`.
- Manual staging deployment can proceed without a skipped `deploy-dev` job.
- `deploy-production` still depends on `deploy-staging`, so production remains gated behind staging.

This workflow still assumes AWS/ECS credentials and resources if used. The current repo change does not prove those resources exist and does not provision them.

## Manual Migration 0018

`pnpm prisma migrate deploy` does not apply `db/migrations/0018_learner_diagnostic_results.sql` because that file is outside Prisma's migration directory. For the first Phase 3A staging validation, keep the raw SQL migration manual and capture the command output as validation evidence.

Apply in staging only:

```bash
psql "$STAGING_DATABASE_URL" -f db/migrations/0018_learner_diagnostic_results.sql
```

Verify:

```sql
SELECT to_regclass('public.learner_diagnostic_results') AS diagnostic_table;

SELECT indexname
FROM pg_indexes
WHERE tablename = 'learner_diagnostic_results'
ORDER BY indexname;

SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'learner_diagnostic_results'
ORDER BY ordinal_position;
```

Expected:

- `diagnostic_table` returns `learner_diagnostic_results`.
- Indexes include `idx_learner_diagnostic_results_learner_id` and `idx_learner_diagnostic_results_created_at`.
- Required diagnostic fields exist, including `starting_level`, `recommended_path`, `weak_area_tags`, `confidence`, `source`, and `telemetry`.

Production application of this migration requires separate approval after staging passes.

Future work should choose one canonical strategy:

- Convert raw SQL migrations into Prisma migrations where Prisma owns the table.
- Or add a guarded manual SQL migration workflow with explicit operator confirmation and migration drift checks.

## Phase 3A Validation Gates

Before Phase 3A can be called production-ready:

1. Staging frontend exists and uses a separate Vercel project.
2. Staging backend exists and uses a separate database.
3. Staging AI service exists and uses staging-only AI credentials.
4. Migration `0018` is applied to staging and verified.
5. AI-service dependency sync and pytest pass in a network-capable environment.
6. Flag OFF smoke test passes.
7. Flag ON + AI success smoke test passes.
8. Flag ON + AI unavailable/fallback smoke test passes.
9. 360px mobile sanity smoke test passes.

If any gate remains incomplete, Phase 3A remains code-ready but staging validation incomplete.
