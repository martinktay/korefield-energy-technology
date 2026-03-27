# Corporate Partner Portal — KoreField Academy

## Overview

The Corporate Portal is an external-facing dashboard for organisations that sponsor learners. It provides visibility into sponsored cohort performance, billing management, and hiring pipeline access. This portal is feature-flagged and can be deferred for post-MVP launch.

## Feature Flag

All Corporate Portal routes are gated behind a feature flag:
- Flag key: `corporate_portal_enabled`
- Default: `false` (disabled)
- When disabled: Corporate Partner users see a "Coming Soon" page
- When enabled: Full portal functionality available

## Dashboard Sections

### 1. Sponsored Learner Management
- View sponsored learners: name, enrolled track, current level, progress percentage
- Filter by track, level, status
- Learner detail view with full progress timeline

### 2. Cohort Performance Summaries
- Average scores across sponsored cohort
- Completion rates by track
- Certification rates
- Performance gate pass rates
- Comparison against platform-wide averages

### 3. Billing Interface
- Sponsorship costs breakdown
- Payment history
- Outstanding balances
- Invoice downloads (PDF)
- Payment plan details for sponsored learners

### 4. Hiring Pipeline
- Certified learners from sponsored cohort
- Track specializations per learner
- Capstone results and project summaries
- Assessor recommendations and professionalism scores
- Export learner profiles for hiring review

## Access Control

- CorporatePartner role only (MFA required)
- Data access restricted to own sponsored learners and cohorts only
- Cannot view other corporate partners' data
- Cannot view platform-wide metrics (that's Super Admin only)
- Cannot modify learner enrollments, grades, or certifications

## Key Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/corporate/` | Cohort overview, key metrics |
| Learners | `/corporate/learners` | Sponsored learner list and detail |
| Performance | `/corporate/performance` | Cohort analytics and comparisons |
| Billing | `/corporate/billing` | Invoices, payments, balances |
| Hiring | `/corporate/hiring` | Certified learner pipeline |
