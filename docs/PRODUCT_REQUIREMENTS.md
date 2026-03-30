# Product Requirements — KoreField Academy

## AI-Native Platform Identity

KoreField Academy is an AI-native, build-first, outcome-driven academy — not a passive LMS or video course platform. AI is the primary teaching mechanism, not an add-on feature.

**Core Principles:**
1. Learners build real projects with AI assistance, not just consume content
2. AI agents deliver lessons, provide feedback, and guide progression — human assessors supervise and validate
3. Every AI interaction is structured and bounded (action-based, not unlimited chat) to protect unit economics
4. The platform adapts to each learner's goals, pace, and performance through AI-driven personalization
5. All AI outputs are advisory — they cannot override human decisions, fabricate data, or bypass gates

## Platform Scope

KoreField Academy is a full-stack applied AI learning platform encompassing:

- **AI Avatar Learning**: Structured lessons delivered by AI-driven virtual teaching agents powered by RAG-based Tutor Agent (LangChain)
- **AI-Guided Build Flow**: Learners declare project goals during onboarding; AI generates personalized learning emphasis and project milestones within the structured curriculum
- **AI-Assisted Lab**: In-browser coding with AI Tutor providing contextual hints, error explanations, and build guidance (structured actions, not open chat)
- **AI Feedback Loop**: Assignment Feedback Agent analyzes submissions within 60 seconds with structured strengths/improvements/rubric alignment
- **Instructor-Led Labs**: Human instructors lead lab sessions, review submissions, and provide feedback within 7 calendar days
- **Pod-Based Collaboration**: Learners are assigned to multidisciplinary delivery teams (pods) simulating real-world project roles
- **Assessor Supervision**: Human assessors serve as performance reviewers, pod supervisors, professionalism coaches, and industry realism validators
- **Performance-Gated Progression**: Learners must pass Performance Gates at each Module/Level boundary (max 2 reassessment attempts)
- **Capstone Defense**: Final project + panel defense (2+ assessors) required for certification
- **Region-Aware Pricing**: Pricing Intelligence Engine computes amounts based on billing country, purchasing power, track type, scholarships, campaigns, and payment plans

## Core User Journeys

### Learner Journey
1. Register → verify email → complete onboarding (country, background, goals, project interest)
2. Auto-enroll in AI Foundation School (free, mandatory, AI-lite)
3. Complete Foundation modules → unlock paid Track catalog
4. Browse upcoming cohorts for chosen track → enroll in a specific cohort (pay per cohort, region-adjusted, installment plans available)
5. Cohort starts → get assigned to a Pod with role based on enrolled track
6. Progress through modules: AI Avatar lessons → labs → assessments → performance gates
7. Collaborate in Pod: exercises, projects, peer reviews, deliverables
8. Pass all gates → unlock capstone → submit → defend before panel
9. Meet all 6 eligibility conditions → receive verifiable certificate
10. Post-cohort: 30-day career support window with AI Career Agent, then AI access ends

### Certification Eligibility (All 6 Required)
1. AI Foundation School complete
2. All Track levels complete (Beginner + Intermediate + Advanced)
3. Pod deliverables submitted (prototype, documentation, governance checklist, sprint reviews, presentation)
4. Capstone passed (defense with 2+ assessors)
5. Assessor approved
6. Payment cleared

**Blocked if ANY condition unmet** — no attendance-only certificates.

## Portal Types

| Portal | Audience | Key Capabilities |
|--------|----------|-----------------|
| Learner Dashboard | Learners | Progress tracking, pod info, payments, certificates, AI tutor |
| Instructor Portal | Instructors | Cohort management, grading queue, lesson scheduling, content authoring |
| Assessor Dashboard | Assessors | Pod supervision, submission review, professionalism scoring, certification approval (within Instructor Portal) |
| Admin Portal | Admins | User/enrollment/curriculum/payment/certificate management |
| Super Admin Portal | Super Admins | Revenue, enrollment, academic, platform, AI, and market intelligence |
| Corporate Portal | Corporate Partners | Sponsored learner tracking, billing, hiring pipeline (future, feature-flagged) |


## Cohort-Based Pricing Model

### How Cohorts Work

Learners enroll in a specific cohort for their chosen Track Pathway. Each cohort has a fixed start date, enrollment window, cohort size (typically 30-50 learners), and duration (12-16 weeks for a full Beginner → Intermediate → Advanced track). Pricing is per-cohort enrollment, not per-module or per-feature.

**Cohort Lifecycle:**
1. Enrollment window opens (2-4 weeks before cohort start)
2. Learners enroll and pay (full or installment plan, region-adjusted)
3. Cohort starts → pods formed → assessors assigned
4. Active learning period (12-16 weeks) with AI-native features active
5. Capstone + certification
6. Cohort closes → post-cohort career support window (30 days)

**What the cohort fee includes:**
- Full AI Avatar lesson delivery across all 3 levels (Beginner + Intermediate + Advanced)
- AI Tutor access throughout the cohort (structured hints, error explanations, build guidance)
- AI Assignment Feedback on every submission (within 60 seconds)
- AI Dropout Risk monitoring with assessor intervention
- AI Career Support Agent access (skill-gap analysis, job market alignment)
- Pod collaboration workspace with AI-assisted pod health monitoring
- Human assessor supervision, professionalism coaching, and certification review
- Instructor-led lab sessions with 7-day feedback window
- Capstone defense with 2+ assessor panel
- Verifiable certificate on completion

### AI Feature Access by Tier

| Feature | Foundation (Free, Pre-Cohort) | Cohort Enrollment (Paid) | Post-Cohort (30 days) |
|---------|-------------------------------|--------------------------|----------------------|
| AI Avatar Lessons | Foundation modules only (12 modules) | Full track curriculum | Read-only access to completed lessons |
| AI Tutor Hints | 10 hints/day cap | 50 hints/day cap | 5 hints/day (review only) |
| Assignment Feedback Agent | Not available | Full access on every submission | Not available |
| Career Support Agent | Not available | Full access | 1 final career report |
| Dropout Risk Monitoring | Active (backend, drives conversion) | Active + visible to learner + assessor | Not applicable |
| AI Code Review in Lab | Not available | Structured actions per exercise | Not available |
| Cohort-Level AI Reports | Not applicable | Instructor Insight + Assessor Support agents active | Final cohort performance report |

### Cohort AI Budget Model

Each cohort has a pre-calculated AI cost budget based on cohort size and duration. This makes AI costs predictable and protectable.

**Budget Formula:**
```
Cohort AI Budget = cohort_size × avg_ai_calls_per_learner_per_week × cost_per_call × cohort_weeks
```

**Reference Numbers (per cohort of 40 learners, 14 weeks):**

| AI Feature | Calls/Learner/Week | Cost/Call | Weekly Cost | Cohort Total |
|------------|-------------------|-----------|-------------|--------------|
| Tutor Hints (gpt-4o-mini) | 10 | $0.005 | $2.00 | $28 |
| Feedback Analysis (gpt-4o) | 3 | $0.03 | $3.60 | $50 |
| Dropout Risk Eval | 1 | $0.01 | $0.40 | $6 |
| Career Support | 0.5 | $0.02 | $0.40 | $6 |
| Code Execution (compute) | 8 | $0.002 | $0.64 | $9 |
| Cohort-Level Reports (shared) | — | — | $1.00 | $14 |
| **Total per cohort** | | | **$8.04/week** | **$113** |

**AI cost as % of revenue:** At $300-1,500/learner (region-adjusted), a 40-learner cohort generates $12,000-60,000 in revenue. AI cost of ~$113 is 0.2-0.9% of revenue. Even at the lowest regional pricing, AI costs are well under 5% of cohort revenue.

**Foundation School (pre-cohort, free):**
- 12 modules, ~2-3 weeks to complete
- 10 AI tutor hints/day using gpt-4o-mini ($0.005/call)
- Estimated cost per Foundation learner: $1-3 total
- At 20% conversion to paid cohort, the acquisition cost is $5-15 per paying learner — acceptable

### Unit Economics Safeguards

1. **Structured AI actions over unlimited chat** — All AI interactions are bounded: specific endpoints with defined input/output schemas. No open-ended conversational AI.
2. **Per-user daily caps within cohort** — 50 AI tutor hints/day per learner. Prevents any single learner from consuming a disproportionate share of the cohort AI budget.
3. **Response caching** — Common tutor queries cached in Redis (15-min TTL, keyed by module + query hash). Learners in the same cohort asking similar questions hit cache instead of LLM.
4. **Cohort-level AI features amortized** — Instructor Insight, Assessor Support, and Academic Performance agents run per-cohort (not per-learner). One AI analysis serves 30-50 learners.
5. **Async batch processing** — Executive reports, dropout evaluations, and analytics run as async SQS jobs. Smooths cost spikes across the cohort duration.
6. **Model tiering by value** — Tutor hints: gpt-4o-mini (cheap, fast). Feedback analysis + executive reports: gpt-4o (higher quality, justified by value). Foundation School: cheapest tier only.
7. **Circuit breaker** — LLM failures trigger circuit breaker (5 failures → 30s cooldown) preventing cascading retry costs.
8. **Foundation AI ceiling** — Foundation School AI usage capped at ~$3/learner total. Beyond that, tutor responses come from cache only.
9. **Post-cohort AI wind-down** — After cohort closes, AI features reduce to minimal (5 hints/day for 30 days, then access ends). No indefinite AI cost tail.

### Super Admin Cohort Economics Dashboard

The Super Admin Portal must surface per-cohort:
- Cohort revenue (total enrolled × price per learner, adjusted for region/installments)
- Cohort AI cost (actual LLM spend for the cohort period)
- Cohort gross margin (revenue minus AI cost, infrastructure, assessor cost)
- AI cost per active learner within the cohort
- AI cost per track (which tracks consume the most LLM tokens)
- Cohort completion rate and certification throughput
- Foundation → Cohort conversion rate
- AI cache hit rate (higher = better cost efficiency)
- Dropout Risk Agent intervention count and success rate
- LLM token consumption trend across cohort weeks (expect peak at weeks 3-5, taper at end)
