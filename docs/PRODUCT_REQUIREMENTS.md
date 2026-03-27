# Product Requirements — KoreField Academy

## Platform Scope

KoreField Academy is a full-stack applied AI learning platform encompassing:

- **AI Avatar Learning**: Structured lessons delivered by AI-driven virtual teaching agents powered by RAG-based Tutor Agent (LangChain)
- **Instructor-Led Labs**: Human instructors lead lab sessions, review submissions, and provide feedback within 7 calendar days
- **Pod-Based Collaboration**: Learners are assigned to multidisciplinary delivery teams (pods) simulating real-world project roles
- **Assessor Supervision**: Human assessors serve as performance reviewers, pod supervisors, professionalism coaches, and industry realism validators
- **Performance-Gated Progression**: Learners must pass Performance Gates at each Module/Level boundary (max 2 reassessment attempts)
- **Capstone Defense**: Final project + panel defense (2+ assessors) required for certification
- **Region-Aware Pricing**: Pricing Intelligence Engine computes amounts based on billing country, purchasing power, track type, scholarships, campaigns, and payment plans

## Core User Journeys

### Learner Journey
1. Register → verify email → complete onboarding (country, background, goals)
2. Auto-enroll in Foundation School (free, mandatory)
3. Complete 5 Foundation modules → unlock paid Track catalog
4. Enroll in full Track Pathway (Beginner + Intermediate + Advanced)
5. Get assigned to a Pod with role based on enrolled track
6. Progress through modules: AI Avatar lessons → labs → assessments → performance gates
7. Collaborate in Pod: exercises, projects, peer reviews, deliverables
8. Pass all gates → unlock capstone → submit → defend before panel
9. Meet all 6 eligibility conditions → receive verifiable certificate

### Certification Eligibility (All 6 Required)
1. Foundation School complete
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
