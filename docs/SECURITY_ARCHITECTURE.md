# Security Architecture — KoreField Academy

## Authentication

- OAuth 2.0 + OpenID Connect via Passport.js in NestJS
- JWT-based session control with token hash stored in Session table
- Email verification required before account activation
- Duplicate email detection with password recovery option

## Multi-Factor Authentication (MFA)

TOTP-based MFA required for privileged roles:
- SuperAdmin, Instructor, Assessor, CorporatePartner, FinanceAdmin, DevOpsEngineer

Learner and Admin roles do not require MFA by default.

## Role-Based Access Control (RBAC)

**8 Roles:** SuperAdmin, Admin, Instructor, Assessor, Learner, CorporatePartner, FinanceAdmin, DevOpsEngineer

RBAC enforced at three layers:
1. API layer — NestJS Guards on endpoints
2. Service layer — Business logic permission checks
3. Database layer — Prisma row-level security

Least-privilege principle: each role can only access permitted endpoints and data.

## Data Classification

| Tier | Data Types | Access Controls |
|------|-----------|----------------|
| Highly Sensitive | Identity, payment, certificates, scores | Encrypted at rest, strict RBAC, audit logged |
| Moderate | Analytics, pod messages, feedback | RBAC-controlled, logged |
| Public | Marketing content, track catalog | No auth required |

## Transport Security

- TLS 1.2+ for all data in transit
- HSTS headers on all web endpoints
- CORS allowlist restricting to trusted domains only

## API Security

- Rate limiting on all public-facing endpoints (API Gateway + edge layer)
- Request signature validation for inbound webhooks
- JWT validation middleware rejecting missing, expired, or malformed tokens

## Payment Security

- PCI DSS-compliant payment gateway (tokenized storage only, no raw card data)
- Webhook signature verification for payment provider callbacks
- Payment state machine with auditable transitions
- Fraud monitoring: unusual volumes, mismatched billing, rapid successive attempts

## Abuse Detection

- Anti-cheating: submission pattern monitoring, timing anomalies, behavioral indicators
- AI-generated assignment detection: flag suspected AI-generated submissions
- Pod project plagiarism scanning: compare against other pods and external sources
- Behavioral anomaly detection: irregular logins, rapid assessment completion, multi-session
- Suspicious login detection: geographic impossibility, rapid credential failures, unusual devices
- API anomaly detection: unusual request volumes, abnormal endpoint patterns, scraping
- All threat alerts routed to centralized monitoring

## Encryption

- At rest: RDS, Redis, S3, SQS all encrypted
- In transit: TLS 1.2+ everywhere
- Secrets Manager for credentials with automated rotation

## Container Security

- Container image vulnerability scanning before deployment
- Critical/high-severity vulnerabilities block deployment

## Compliance

- GDPR, NDPR, UK DPA, CCPA/CPRA
- Awareness of UAE PDPL and China PIPL for future expansion
- NIST AI RMF and FTC AI Enforcement alignment

## Backup and Disaster Recovery

- Automated daily database snapshots
- Backups stored in geographically separate AWS region
- RTO: 4 hours, RPO: 30 minutes (production)
- Periodic backup verification via automated restore tests
- IaC recovery templates for full platform reconstruction
