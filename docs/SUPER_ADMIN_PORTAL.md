# Super Admin Portal — KoreField Academy

## Overview

The Super Admin Portal is the intelligence command center for senior Academy leadership. It provides aggregated metrics across revenue, enrollment, academic quality, platform health, AI agent performance, and market intelligence. All dashboards use pre-aggregated metrics from the batch analytics worker — never live transactional queries.

## Dashboard Categories

### 1. Revenue Intelligence
- Revenue aggregated by day/week/month/year
- Revenue by region (geographic heatmap)
- Revenue by track
- Overdue balances
- Installment completion rate
- Payment plan distribution (full vs 2-pay vs 3-pay)

### 2. Enrollment Intelligence
- Active learners count
- New enrollments by track and region
- Foundation-to-paid conversion rate
- Dropout rates by track and level
- Waitlist volume per track
- Market heatmap by region (enrollment density)

### 3. Academic Quality Intelligence
- Performance gate pass rates by track and level
- Remediation counts by track (module repeats)
- Certification volume by track
- Pod productivity metrics (deliverable completion rates)
- Assessor workload metrics (submissions per assessor, review turnaround)

### 4. Platform Performance
- Concurrent users
- API latency: average, p95, error rate
- Queue health: depth, processing rate, failed jobs per queue
- System uptime
- Video usage metrics (Cloudflare Stream)
- Payment gateway health

### 5. AI Agent Intelligence
- Workflow volume by agent type
- LangSmith trace counts by agent
- Failure counts and rates by agent and workflow type
- Learner-side metrics: tutor interactions, lesson deliveries, feedback events, dropout interventions, career sessions
- Faculty-side metrics: insight requests, review assists, validation executions
- Executive-side metrics: market reports, pricing recommendations, expansion assessments
- Prompt debugging: failure rates, latency, version comparisons

### 6. Market Intelligence (Super Admin Exclusive)
- Competitor pricing display (from Market Intelligence Agent)
- Track demand signals: search volume trends, waitlist growth, enrollment inquiries
- Hiring trend display: job posting volumes, skill demand, role emergence patterns
- Policy/regulation alerts feed
- Expansion opportunity indicators: underserved regions, waitlist-to-enrollment ratios
- Track relevance scores with contributing factors
- Executive reports, trend summaries, opportunity signals with confidence scores
- Market alerts feed: prioritized by recency and relevance

## Data Source

All Super Admin dashboards consume pre-aggregated metrics from:
- Batch analytics worker (SQS: `analytics` queue)
- Redis cache: `dashboard:superadmin:*` keys with 10-minute TTL
- Never direct database queries against transactional tables

## Key Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard Home | `/super-admin/` | High-level KPIs across all categories |
| Revenue | `/super-admin/revenue` | Revenue breakdowns and trends |
| Enrollment | `/super-admin/enrollment` | Enrollment analytics and heatmap |
| Academic | `/super-admin/academic` | Quality metrics and certification throughput |
| Platform | `/super-admin/platform` | System health and performance |
| AI Agents | `/super-admin/ai` | Agent performance and observability |
| Market | `/super-admin/market` | Market intelligence and expansion signals |

## Access Control
- Super Admin role only (MFA required)
- All market intelligence queries logged with AQR-* records
- Executive agent access restricted to this portal
