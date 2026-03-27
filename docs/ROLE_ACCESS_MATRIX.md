# Role Access Matrix — KoreField Academy

## Platform Roles

| Role | MFA Required | Portal Access |
|------|-------------|---------------|
| SuperAdmin | Yes | Super Admin Portal (full platform intelligence) |
| Admin | No | Admin Portal (user/enrollment/curriculum/payment/certificate management) |
| Instructor | Yes | Instructor Portal (cohort management, grading, content authoring) |
| Assessor | Yes | Assessor Dashboard (pod supervision, certification approval) |
| Learner | No | Learner Dashboard (progress, pods, payments, certificates) |
| CorporatePartner | Yes | Corporate Portal (sponsored learners, billing, hiring pipeline) |
| FinanceAdmin | Yes | Admin Portal (financial operations subset) |
| DevOpsEngineer | Yes | Infrastructure operations access |

## Endpoint Access by Role

### Auth Endpoints
| Endpoint | SuperAdmin | Admin | Instructor | Assessor | Learner | CorporatePartner |
|----------|-----------|-------|-----------|----------|---------|-----------------|
| POST /auth/register | — | — | — | — | ✅ | — |
| POST /auth/login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POST /auth/mfa/verify | ✅ | — | ✅ | ✅ | — | ✅ |
| GET /auth/me | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Enrollment Endpoints
| Endpoint | SuperAdmin | Admin | Instructor | Assessor | Learner |
|----------|-----------|-------|-----------|----------|---------|
| POST /enrollment/register | — | — | — | — | ✅ |
| POST /enrollment/onboard | — | — | — | — | ✅ |
| POST /enrollment/tracks/{TRK-*}/enroll | — | — | — | — | ✅ |
| GET /enrollment/progress | — | — | — | — | ✅ |
| POST /enrollment/gates/{PGT-*}/evaluate | — | — | — | ✅ | — |

### Payment Endpoints
| Endpoint | SuperAdmin | Admin | Learner |
|----------|-----------|-------|---------|
| GET /payment/pricing/{TRK-*} | ✅ | ✅ | ✅ |
| POST /payment/checkout | — | — | ✅ |
| POST /payment/installments/{IST-*}/pause | — | ✅ | ✅ |
| GET /payment/status | ✅ | ✅ | ✅ |

### Certification Endpoints
| Endpoint | SuperAdmin | Admin | Assessor | Learner | Public |
|----------|-----------|-------|----------|---------|--------|
| POST /certification/capstone/{CPS-*}/submit | — | — | — | ✅ | — |
| POST /certification/capstone/{CPS-*}/evaluate | — | — | ✅ | — | — |
| GET /certification/certificates/{KFCERT-*}/verify | — | — | — | — | ✅ |
| POST /certification/certificates/{CRT-*}/revoke | — | ✅ | — | — | — |

### AI Agent Endpoints
| Endpoint | SuperAdmin | Instructor | Assessor | Learner |
|----------|-----------|-----------|----------|---------|
| POST /ai/tutor/lesson | — | — | — | ✅ |
| POST /ai/tutor/summarize | — | — | — | ✅ |
| POST /ai/feedback/analyze | — | — | — | ✅ |
| POST /ai/dropout/evaluate | — | — | ✅ | — |
| GET /ai/dropout/risk/{LRN-*} | — | — | ✅ | — |
| POST /ai/career/guidance | — | — | — | ✅ |
| GET /ai/faculty/cohort-analytics/{ENR-*} | — | ✅ | — | — |
| GET /ai/faculty/review-queue/{USR-*} | — | — | ✅ | — |
| GET /ai/faculty/pod-health/{POD-*} | — | — | ✅ | — |
| POST /ai/faculty/validate-certification/{LRN-*} | — | — | ✅ | — |
| POST /ai/executive/market-report | ✅ | — | — | — |
| GET /ai/executive/market-alerts | ✅ | — | — | — |
| POST /ai/executive/pricing-recommendation | ✅ | — | — | — |
| GET /ai/executive/expansion-opportunities | ✅ | — | — | — |
| GET /ai/executive/academic-analytics | ✅ | — | — | — |

## Data Scope Rules

| Role | Data Access Scope |
|------|------------------|
| Learner | Own profile, own enrollments, own progress, own pod, own payments, own certificates |
| Instructor | Assigned cohorts, grading queue, lesson schedules, student flags, pod visibility |
| Assessor | Assigned pods and learners, submissions, professionalism scores, certification controls |
| Admin | All users, enrollments, curriculum, payments, certificates (management operations) |
| SuperAdmin | Platform-wide aggregated metrics, revenue, enrollment, academic, AI, market intelligence |
| CorporatePartner | Own sponsored learners and cohorts only |
