# AWS Infrastructure — KoreField Academy

## Cloud Platform: AWS

All infrastructure managed via Terraform with modular configs aligned to service boundaries.

## Core Services

| Service | Purpose | Terraform Module |
|---------|---------|-----------------|
| ECS Fargate | Serverless container orchestration (4 workloads) | `infrastructure/modules/ecs/` |
| RDS PostgreSQL | Relational data storage | `infrastructure/modules/rds/` |
| ElastiCache Redis | Caching and session management | `infrastructure/modules/redis/` |
| S3 | Object storage (assets, uploads, backups, certificates) | `infrastructure/modules/s3/` |
| SQS | Async message queuing (5 queues + 5 DLQs) | `infrastructure/modules/sqs/` |
| Secrets Manager | Credentials, API keys with automated rotation | `infrastructure/modules/secrets/` |
| CloudWatch | Logging, metrics, alarms, dashboards | `infrastructure/modules/monitoring/` |
| VPC | Network segmentation, subnets, security groups | `infrastructure/modules/vpc/` |

## External Services (Not on AWS)
- Cloudflare Stream — all video content hosting and delivery
- Payment Gateway — PCI DSS-compliant tokenized payment processing
- LLM Provider APIs — AI model inference
- LangSmith — AI workflow tracing and evaluation

## ECS Fargate Workloads

| Workload | Service | Autoscaling | Notes |
|----------|---------|-------------|-------|
| Frontend | Next.js SSR | Horizontal | Serves all portal types |
| Backend API | NestJS | Horizontal | Core business logic |
| AI Services | FastAPI | Horizontal | Isolated to prevent resource contention |
| Workers | TypeScript SQS consumers | Horizontal | One process per queue |

## Network Architecture
- VPC with public/private subnets
- Public-facing services, internal services, data stores in separate tiers
- NAT gateway for outbound traffic from private subnets
- Security groups per service tier
- Network-level isolation between dev, staging, production

## Encryption
- At rest: RDS, Redis, S3, SQS all encrypted
- In transit: TLS 1.2+ everywhere
- Secrets Manager with automated rotation schedules

## Monitoring and Alarms
- API error rates
- Queue depth and processing rate
- DB connection saturation
- Memory/CPU utilization
- Structured logging: timestamp, service name, trace ID, log level, message

## Environment Configurations
```
infrastructure/envs/
├── dev.tfvars
├── staging.tfvars
└── production.tfvars
```
- Identical definitions, differing only in scale/config
- Resource tagging: environment, service name, cost centre, owner
- Budget alerts per environment and service

## Disaster Recovery
- RTO: 4 hours, RPO: 30 minutes (production)
- Automated daily database snapshots
- Backups in geographically separate AWS region
- IaC recovery templates for full platform reconstruction
- Periodic backup verification via automated restore tests
