# Database Schema — KoreField Academy

## Custom ID Convention

All entities use domain-prefixed custom IDs: `{PREFIX}-{UNIQUE_SEGMENT}`. Certificate verification codes use `KFCERT-{YEAR}-{ALPHANUMERIC}`.

| Prefix | Entity | Example |
|--------|--------|---------|
| USR | User | USR-8a2f4c |
| LRN | Learner | LRN-7f3a2b |
| TRK | Track | TRK-ai-eng-001 |
| LVL | Level | LVL-trk1-beg |
| MOD | Module | MOD-5k9x2m |
| LSN | Lesson | LSN-3p7q1r |
| ASM | Assessment | ASM-6t4w8n |
| LAB | Lab Session | LAB-2j5v9c |
| ENR | Enrollment | ENR-4m8b3f |
| POD | Pod | POD-1a6d7e |
| PDM | Pod Member | PDM-9h2k5g |
| WTL | Waitlist Entry | WTL-3c7f1b |
| FND | Foundation Progress | FND-5e9a4d |
| PGT | Performance Gate | PGT-2g6j8k |
| GTA | Gate Attempt | GTA-7m1p3q |
| PAY | Payment Plan | PAY-4r8s2t |
| IST | Installment | IST-6u1v5w |
| PRC | Pricing Config | PRC-3x7y9z |
| CMP | Campaign | CMP-8a2b4c |
| SCH | Scholarship | SCH-5d9e1f |
| CPS | Capstone | CPS-2g6h3j |
| DEF | Capstone Defense | DEF-7k1m4n |
| CRT | Certificate | CRT-9x4k7m |
| CEL | Certification Eligibility | CEL-3p8q2r |
| SUB | Submission | SUB-6s1t5u |
| CEX | Coding Exercise | CEX-4v8w2x |
| CVR | Content Version | CVR-7y1z3a |
| AWE | Agent Workflow Execution | AWE-5b9c4d |
| AQR | Agent Query | AQR-2e6f8g |
| PMV | Prompt Version | PMV-3h7j1k |
| DRS | Dropout Risk Score | DRS-9m4n6p |
| SES | Session | SES-1q5r8s |
| ROL | Role | ROL-admin |
| CBN | Country Band | CBN-ng-tier2 |

## Domain Models

### Auth Domain

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| User | id (USR-*), email, password_hash, role, mfa_enabled, mfa_secret, email_verified, status, created_at | Base identity |
| Session | id (SES-*), user_id (USR-*), jwt_token_hash, expires_at, created_at | JWT session tracking |
| Role | id (ROL-*), name, permissions[] | RBAC role definitions |

**Roles enum:** SuperAdmin, Admin, Instructor, Assessor, Learner, CorporatePartner, FinanceAdmin, DevOpsEngineer

### Enrollment Domain

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| Learner | id (LRN-*), user_id (USR-*), country, professional_background, learning_goals, onboarding_complete | Learner profile |
| Track | id (TRK-*), name, description, status (available/waitlisted), estimated_duration | Learning pathway |
| Level | id (LVL-*), track_id (TRK-*), tier (beginner/intermediate/advanced), sequence | Progression tier |
| Module | id (MOD-*), level_id (LVL-*), title, sequence, version, published | Learning unit |
| Enrollment | id (ENR-*), learner_id (LRN-*), track_id (TRK-*), status, enrolled_at | Track enrollment |
| FoundationProgress | id (FND-*), learner_id (LRN-*), module_statuses[], completed, completed_at | Foundation tracking |
| PerformanceGate | id (PGT-*), module_id (MOD-*), threshold_score, max_attempts (2) | Gate definition |
| GateAttempt | id (GTA-*), gate_id (PGT-*), learner_id (LRN-*), score, passed, attempt_number | Gate attempt |
| Pod | id (POD-*), track_id (TRK-*), assessor_id (USR-*), status, activated_at | Delivery team |
| PodMember | id (PDM-*), pod_id (POD-*), learner_id (LRN-*), role, assigned_at | Pod role assignment |
| WaitlistEntry | id (WTL-*), learner_id (LRN-*), track_id (TRK-*), position, joined_at, enrollment_deadline | Waitlist queue |

### Payment Domain

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| PricingConfig | id (PRC-*), track_id (TRK-*), base_price, floor_price, ceiling_price, effective_from | Base pricing |
| CountryBand | id (CBN-*), country_code, purchasing_power_band, multiplier | Regional multiplier |
| PaymentPlan | id (PAY-*), enrollment_id (ENR-*), plan_type (full/2-pay/3-pay), total_amount, currency, status | Payment plan |
| Installment | id (IST-*), plan_id (PAY-*), sequence, amount, due_date, paid_at, status, grace_period_end | Installment |
| Campaign | id (CMP-*), name, discount_type, discount_value, active_from, active_to | Promotions |
| Scholarship | id (SCH-*), learner_id (LRN-*), adjustment_amount, approved_by, approved_at | Scholarships |

### Content Domain

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| Lesson | id (LSN-*), module_id (MOD-*), title, content_type, sequence, version | Lesson within module |
| Assessment | id (ASM-*), module_id (MOD-*), title, rubric, max_score, type | Assessment definition |
| LabSession | id (LAB-*), module_id (MOD-*), instructor_id (USR-*), scheduled_at, recording_url, status | Lab session |
| CodingExercise | id (CEX-*), lesson_id/assessment_id, starter_code, test_cases[], language, time_limit, memory_limit | Code exercise |
| Submission | id (SUB-*), learner_id (LRN-*), assessment_id/exercise_id, content, score, submitted_at | Learner submission |
| ContentVersion | id (CVR-*), module_id (MOD-*), version_number, published_at, content_snapshot | Module versioning |

### Certification Domain

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| Capstone | id (CPS-*), learner_id, track_id, status (locked/unlocked/submitted/evaluated), result, feedback | Capstone project |
| CapstoneDefense | id (DEF-*), capstone_id, panel_assessor_ids[], scheduled_at, result (pass/fail), feedback | Defense session |
| Certificate | id (CRT-*), learner_id, track_id, verification_code (KFCERT-*), issued_at, status (active/revoked) | Certificate |
| CertificationEligibility | id (CEL-*), learner_id, track_id, foundation_complete, levels_complete, pod_deliverables_complete, capstone_passed, assessor_approved, payment_cleared, eligible | Eligibility check |

### AI Agent Domain

| Entity | Key Fields | Notes |
|--------|-----------|-------|
| AgentWorkflowExecution | id (AWE-*), agent_type, workflow_type, input_params, output, status, langsmith_trace_id, duration_ms | Workflow record |
| AgentQuery | id (AQR-*), agent_type, requesting_user_id, query_params, timestamp | Audit log |
| PromptVersion | id (PMV-*), agent_type, prompt_key, version, content, evaluation_results, deployed_at | Prompt versions |
| DropoutRiskScore | id (DRS-*), learner_id, score, signals, computed_at | Risk assessment |

## Key Relationships

- User → Learner (1:1 via user_id)
- Track → Level → Module (hierarchical)
- Module → Lesson, Assessment, LabSession, CodingExercise
- Enrollment → Track, Learner
- Pod → PodMember → Learner
- PerformanceGate → Module, GateAttempt → Learner
- PaymentPlan → Enrollment → Installment
- Certificate → Learner, Track
