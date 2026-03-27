# Assessment Engine — KoreField Academy

## Overview

The Assessment Engine handles all evaluation activities: automated grading of code exercises, manual grading by instructors/assessors, rubric-based scoring, and submission lifecycle management.

## Assessment Types

| Type | Grading | Environment | Grader |
|------|---------|-------------|--------|
| Code Exercise (CEX-*) | Automated | Script/Notebook/SQL/Terminal | Test cases |
| Quiz | Automated | Web form | Answer key |
| Lab Submission | Manual | Any | Instructor (7-day window) |
| Pod Deliverable | Manual | File upload | Assessor |
| Peer Review | Manual | Web form | Pod members |
| Capstone Defense | Manual | Presentation | Panel of 2+ assessors |
| Performance Gate | Automated + Manual | Varies | Threshold score |

## Submission Lifecycle

```
Created (SUB-*) → Submitted → Under Review → Graded → [Feedback Available]
                                    ↓
                              [Resubmission Requested] → Resubmitted → Under Review → Graded
```

### States
- `draft` — learner working, auto-saved
- `submitted` — learner clicked Submit, locked for editing
- `under_review` — assigned to grader (instructor/assessor/automated)
- `graded` — score and feedback recorded
- `resubmission_requested` — assessor requested changes
- `resubmitted` — learner resubmitted after feedback

## Automated Grading (Code Exercises)

### Script Mode
1. Learner submits code via `POST /content/exercises/{CEX-*}/execute`
2. Code executed in sandboxed backend
3. Instructor-defined test cases run against output
4. Results: pass/fail per test case, expected vs actual on failure
5. Score computed from test case pass rate
6. Execution limits: 10-second timeout, memory limit per exercise

### Notebook Mode
1. Learner submits notebook state
2. All code cells re-executed in clean kernel
3. Output cells compared against expected outputs
4. Rubric criteria checked (e.g., "DataFrame has 5 columns", "plot contains legend")

### SQL Workspace
1. Learner submits query
2. Query executed against sandboxed PostgreSQL
3. Result set compared against instructor-defined expected output
4. Grading: exact match, row-order-independent match, or partial credit

### Terminal Mode
1. Learner submits (terminal history + file states captured)
2. File system state compared against expected state
3. Script output validated against expected output

## Manual Grading

### Instructor Grading (Lab Submissions)
- Instructor has 7 calendar days to review and provide written feedback
- Grading queue: `GET /ai/faculty/review-queue/{USR-*}` prioritizes by submission age, learner risk, deadlines
- Auto-escalation: unreviewed submissions escalated after 10 calendar days

### Assessor Grading (Pod Deliverables, Professionalism)
- Assessor reviews pod deliverables: prototype, documentation, governance checklist, sprint reviews, presentation
- Professionalism scoring across 5 dimensions: communication, accountability, collaboration, documentation, learning discipline
- Assessor can request resubmission, flag underperformance, trigger remediation

### Capstone Defense Grading
- Panel of 2+ assessors
- Scheduled within 14 days of submission
- Pass/fail with written feedback
- One resubmission allowed within 30 days on failure

## Rubric System

Each assessment has an associated rubric (stored in Assessment.rubric field):
- Rubric criteria with point values
- Criteria mapped to checklist items in the UI
- Auto-graded criteria update in real-time as test cases pass
- Manual criteria scored by instructor/assessor

## AI-Assisted Grading

- Assignment Feedback Agent (`POST /ai/feedback/analyze`) provides structured feedback within 60 seconds
- Feedback includes: strengths, improvements, rubric alignment, confidence indicator
- AI feedback is advisory — does not replace instructor/assessor grade
- Feedback visible to both learner and assigned instructor/assessor

## Anti-Cheating Measures

- Submission pattern monitoring (timing anomalies, behavioral indicators)
- AI-generated assignment detection (flag suspected AI-generated submissions)
- Pod project plagiarism scanning (compare against other pods and external sources)
- Assessment mode in coding environment: autocompletion and external paste disabled
