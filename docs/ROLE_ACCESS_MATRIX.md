# Role Access Matrix — KoreField Academy

## Platform Roles

| Role | MFA Required | Portal Access |
|------|-------------|---------------|
| SuperAdmin | Yes | Super Admin Portal (full platform intelligence) |
| Admin | No | Admin Portal (user/enrollment/curriculum/payment/certificate/recruitment management) |
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

### Recruitment Endpoints
| Endpoint | SuperAdmin | Admin | Public |
|----------|-----------|-------|--------|
| POST /careers/apply | — | — | ✅ |
| GET /careers/applications | ✅ | ✅ | — |
| GET /careers/applications/{APP-*} | ✅ | ✅ | — |
| PATCH /careers/applications/{APP-*}/status | ✅ | ✅ | — |
| GET /careers/applications/{APP-*}/cv | ✅ | ✅ | — |
| GET /careers/pipeline | ✅ | ✅ | — |

### Notification Endpoints
| Endpoint | SuperAdmin | Admin | Instructor | Learner |
|----------|-----------|-------|-----------|---------|
| GET /notifications | ✅ | ✅ | ✅ | ✅ |
| GET /notifications/unread-count | ✅ | ✅ | ✅ | ✅ |
| PATCH /notifications/{NTF-*}/read | ✅ | ✅ | ✅ | ✅ |
| POST /notifications/mark-all-read | ✅ | ✅ | ✅ | ✅ |
| POST /notifications/push/subscribe | ✅ | ✅ | ✅ | ✅ |
| POST /notifications/broadcast | ✅ | — | — | — |

### Content Endpoints
| Endpoint | SuperAdmin | Admin | Instructor | Learner | Public |
|----------|-----------|-------|-----------|---------|--------|
| GET /content/tracks | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /content/tracks/{TRK-*} | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /content/tracks/{TRK-*}/curriculum | ✅ | ✅ | ✅ | ✅ | — |
| POST /content/modules | ✅ | ✅ | ✅ | — | — |
| PUT /content/modules/{MOD-*} | ✅ | ✅ | ✅ | — | — |
| POST /content/lessons | ✅ | ✅ | ✅ | — | — |
| PUT /content/lessons/{LSN-*} | ✅ | ✅ | ✅ | — | — |
| DELETE /content/lessons/{LSN-*} | ✅ | ✅ | ✅ | — | — |
| GET /content/lessons/{LSN-*} | ✅ | ✅ | ✅ | ✅ | — |
| GET /content/modules/{MOD-*}/lessons | ✅ | ✅ | ✅ | ✅ | — |
| POST /content/assessments | ✅ | ✅ | ✅ | — | — |
| PUT /content/assessments/{ASM-*} | ✅ | ✅ | ✅ | — | — |
| DELETE /content/assessments/{ASM-*} | ✅ | ✅ | ✅ | — | — |
| POST /content/upload/presign | ✅ | ✅ | ✅ | — | — |
| POST /content/labs | ✅ | ✅ | ✅ | — | — |
| POST /content/exercises | ✅ | ✅ | ✅ | — | — |
| GET /content/foundation | ✅ | ✅ | ✅ | ✅ | — |

### AI Agent Endpoints
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
| Admin | All users, enrollments, curriculum, payments, certificates, recruitment pipeline (management operations) |
| SuperAdmin | Platform-wide aggregated metrics, revenue, enrollment, academic, AI, market intelligence |
| CorporatePartner | Own sponsored learners and cohorts only |
