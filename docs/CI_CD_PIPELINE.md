# CI/CD Pipeline — KoreField Academy

## Overview
GitHub Actions for all CI/CD automation. pnpm for TypeScript workloads, uv for Python.

## CI Pipeline (`.github/workflows/ci.yml`)
Triggered on every PR.

### Steps
1. Lint all workloads (backend, frontend, ai-services, workers)
2. Run unit tests (backend: pnpm test, ai-services: uv run pytest)
3. Run integration tests (backend: pnpm test:e2e)
4. Build container images for all 4 workloads
5. Scan container images — block on critical/high-severity vulnerabilities
6. Terraform plan review for infrastructure changes

## CD Pipeline (`.github/workflows/cd.yml`)

### Dev Environment
- Auto-deploy on merge to main
- No approval gate required

### Staging Environment
- Explicit approval gate required
- Identical artifacts from dev build

### Production Environment
- Explicit approval gate required
- Identical artifacts from staging
- Zero-downtime ECS Fargate deployment with automated rollback

### Environment Promotion Discipline
```
dev → staging → production
```
- Same container images promoted through environments
- Only config/scale values differ (via Terraform tfvars)

## Deployment Strategy
- Zero-downtime ECS Fargate deployments
- Automated rollback on health check failure
- Health check endpoints: readiness + liveness probes on all services

## Infrastructure Changes
- Terraform plan required before staging/production applies
- Plan review as part of CI pipeline
- Remote backend with state locking

## Container Security
- Image vulnerability scanning before deployment
- Critical/high-severity vulnerabilities block deployment pipeline
