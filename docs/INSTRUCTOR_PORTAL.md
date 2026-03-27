# Instructor Portal — KoreField Academy

## Overview

The Instructor Portal is the operational dashboard for instructors managing cohorts, grading submissions, scheduling labs, authoring content, and monitoring learner performance.

## Dashboard Sections

### 1. Assigned Cohorts
- List of assigned cohorts: name, track, level, learner count, status
- Quick access to cohort detail view

### 2. Grading Queue
- Pending submissions ordered by submission date
- Notification on new submission arrival
- Submission detail: learner name, assessment type, submitted date, status
- Grade and feedback recording interface
- AI Feedback Agent results displayed alongside submission for reference

### 3. Lesson Delivery Schedule
- Upcoming labs, review sessions
- Dates, times, associated modules
- Session management: schedule, reschedule, cancel

### 4. Learner Risk Flags
- Learners with concerning scores or submission patterns
- Shows: learner name, track, flagged metric (low scores, late submissions, inactivity)
- Powered by Instructor Insight Agent cohort analytics

### 5. Pod Visibility
- Pod composition for assigned cohorts
- Member roles, recent pod activity
- Pod health indicators from Assessor Support Agent

## Content Authoring

### Module Management
- Create/edit modules, lessons, labs, assessments
- Module publishing workflow with version tracking
- Content versioning: changes to published modules don't affect in-progress learners

### Content Types
- Text lessons (rich text editor)
- Video lessons (Cloudflare Stream URL input)
- Interactive code exercises (starter code, test cases, language selection, time/memory limits)
- Quizzes (multiple choice, short answer)
- Downloadable resources (file upload)

### Coding Exercise Authoring
- Define starter code with read-only/editable sections
- Define automated test cases (input → expected output)
- Select execution mode: Script, Notebook, SQL Workspace, Terminal
- Set language: Python, JavaScript, SQL, Bash
- Configure time limit and memory limit
- Configure assessment mode options (disable autocompletion, disable paste)

## Key Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard | `/instructor/` | Cohort overview, grading queue, schedule |
| Cohort Detail | `/instructor/cohorts/{id}` | Learner list, performance, pod info |
| Grading | `/instructor/grading` | Submission review and feedback |
| Content Author | `/instructor/content` | Module/lesson/assessment creation |
| Schedule | `/instructor/schedule` | Lab session management |

## Lab Session Management
- Schedule sessions with date, time, module association
- Enrolled learners notified 48 hours in advance
- Record sessions, make recordings available within 24 hours
- Async lab work submission for learners who miss sessions
- 7-day review window for instructor feedback on submissions
