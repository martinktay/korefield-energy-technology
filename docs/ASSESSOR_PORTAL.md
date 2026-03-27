# Assessor Portal — KoreField Academy

## Overview

The Assessor Dashboard provides tools for pod supervision, submission review, professionalism scoring, certification approval, and learner intervention. Assessors are the quality gatekeepers of the platform.

## Dashboard Sections

### 1. Assigned Pods and Learners
- List of assigned pods with member names, progress, submission statuses
- Professionalism scores per learner
- Collaboration metrics per pod
- Upcoming deadlines

### 2. Submission Review
- Submission review interface with grade and feedback recording
- Milestone review queue: pending submissions across assigned pods, ordered by date
- Auto-escalation: unreviewed submissions escalated after 10 calendar days
- AI Feedback Agent results displayed alongside submissions for reference

### 3. Pod Monitoring
- Activity logs per pod
- Communication frequency tracking
- Task contribution per member
- Early warning indicators for pod dysfunction (from Assessor Support Agent)

### 4. Professionalism Scoring
Five dimensions scored per learner:
1. Communication
2. Accountability
3. Collaboration
4. Documentation
5. Learning discipline

### 5. Conflict Resolution
- Interface for managing pod conflicts
- Mediation tools and documentation
- Escalation path to admin if unresolved

### 6. Capstone and Certification Controls
- Capstone readiness validation: confirm learner is ready for capstone
- Certification approval/withhold controls
- Formal recommendation recording (approve or withhold with reason)
- Certification Validation Agent results for reference

### 7. Intervention Tools
- Request resubmission on any deliverable
- Flag underperformance with documented evidence
- Trigger remediation plan: specify areas for improvement and deadline
- Block certification approval until standards met

## Key Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/instructor/assessor/` | Pod overview, review queue, alerts |
| Pod Detail | `/instructor/assessor/pods/{POD-*}` | Pod activity, member progress |
| Review Queue | `/instructor/assessor/reviews` | Submission grading and feedback |
| Professionalism | `/instructor/assessor/professionalism` | Scoring interface |
| Certification | `/instructor/assessor/certification` | Approval/withhold controls |

## Assessor Responsibilities Summary

| Responsibility | Description |
|---------------|-------------|
| Performance Reviewer | Grade submissions, evaluate gate readiness |
| Pod Supervisor | Monitor collaboration, contribution balance |
| Professionalism Coach | Score and guide professional development |
| Industry Realism Validator | Ensure deliverables meet industry standards |
| Certification Gatekeeper | Approve or withhold certification eligibility |
