# Employability Tracking — KoreField Academy

## Overview

KoreField Academy tracks learner employability signals from enrollment through certification and into the hiring pipeline. This data serves three audiences: learners (career guidance), corporate partners (hiring decisions), and Super Admins (platform effectiveness metrics).

## Learner Career Profile

Built progressively as the learner advances:

| Signal | Source | When Captured |
|--------|--------|---------------|
| Professional background | Onboarding form | Registration |
| Learning goals | Onboarding form | Registration |
| Track specialization | Enrollment | Track enrollment |
| Module completion history | Progress Engine | Ongoing |
| Performance gate scores | Assessment Engine | Each gate |
| Pod role and contributions | Pod system | Ongoing |
| Professionalism scores | Assessor | Ongoing |
| Capstone project summary | Certification | Capstone submission |
| Capstone defense result | Certification | Defense evaluation |
| Assessor recommendation | Assessor | Certification approval |
| Certificate earned | Certification | Issuance |
| Skill-gap analysis | Career Support Agent | On request |

## Career Support Agent Integration

The Career Support Agent (`POST /ai/career/guidance`) provides:
- Skill-gap analysis based on track progress vs job market requirements
- Job market alignment: which roles match the learner's completed track and scores
- Suggested focus areas for improving employability
- Industry trend awareness relevant to the learner's track

## Hiring Pipeline (Corporate Portal)

Corporate Partners with sponsored cohorts can view:
- Certified learners from their cohort
- Track specialization and level of achievement
- Capstone project results and quality indicators
- Assessor recommendations and professionalism scores
- Pod role experience (e.g., "served as AI Engineer in pod for 6 months")

## Super Admin Metrics

Employability-related metrics available in Super Admin Portal:
- Certification throughput by track (how many learners certified per period)
- Time-to-certification by track (average duration from enrollment to certificate)
- Corporate partner hiring conversion rates (certified → hired, where data available)
- Track demand signals correlated with hiring trends (from Market Intelligence Agent)

## Privacy

- Learner career data is owned by the learner
- Corporate Partners see only their sponsored learners' data
- No learner data shared with third parties without consent
- Compliant with GDPR, NDPR, and applicable data protection regulations
