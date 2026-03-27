# Market Intelligence Agent — KoreField Academy

## Overview
Executive-side AI agent restricted to Super Admin access. Provides grounded external strategic intelligence through live web-grounded search, competitor analysis, and market monitoring.

## Access Control
- Super Admin role ONLY
- All queries logged with AQR-* records: requesting Super Admin identity, query params, timestamp, query type
- All workflows traced through LangSmith

## Capabilities

### 1. Market Reports (`POST /ai/executive/market-report`)
Multi-step LangGraph workflow:
- Web-grounded search via LangChain
- Competitor pricing intelligence
- AI hiring trend analysis
- Geography expansion analysis
- Policy and regulation monitoring

### 2. Market Alerts (`GET /ai/executive/market-alerts`)
- Time-sensitive market change alerts
- Prioritized by recency and relevance

### 3. Track Relevance Scoring
Composite score combining:
- Hiring trends (job posting volumes, skill demand)
- Enrollment demand
- Waitlist growth
- Skill demand signals

## Output Types
- Executive reports
- Alerts
- Pricing comparisons
- Trend summaries
- Opportunity signals

## Quality Controls
- Confidence score assigned to every output
- Unsupported claims rejected — no fabrication permitted
- Source citations required for all factual claims
- Outputs reviewed against guardrails before delivery

## Audit Trail
- Every query creates an AQR-* record
- Records include: requesting user, query parameters, timestamp, query type
- Full LangSmith trace for every workflow execution
