# Student (Learner) Portal — KoreField Academy

## Overview

The Learner Dashboard is the primary interface for all enrolled learners. It provides progress tracking, lesson access, pod collaboration, payment management, and certificate visibility.

## Dashboard Sections

### 1. Progress Overview
- Enrolled tracks with current level/module and completion percentage per track
- Module timeline: completed (green), in-progress (blue), locked (grey), upcoming (outline)
- Next recommended lesson per track
- Progress indicators update within 60 seconds of module completion

### 2. Upcoming Activities
- Scheduled lab sessions with dates, times, joining instructions
- Pending assessments with due dates
- Upcoming performance gates
- Deadline alerts

### 3. Pod Information
- Current pod composition: member names, roles, recent activity
- Pod workspace link (messaging, file sharing, video conferencing)
- Pod deliverable tracking: prototype, documentation, governance checklist, sprint reviews, presentation
- Peer review submissions and received reviews

### 4. Payment Status
- Outstanding balances and upcoming installments
- Payment plan details (full/2-pay/3-pay)
- Grace period warnings
- Access pause notifications
- Pause/resume controls for voluntary payment pause

### 5. Certificates
- Earned certificates with CRT-* IDs and KFCERT-* verification codes
- Certificate readiness status: which of the 6 conditions are met/outstanding
- Capstone status: locked → unlocked → in-progress → submitted → evaluated
- Download link for issued certificate PDFs

### 6. AI Features
- AI Tutor access for lesson delivery and hints
- Assignment Feedback Agent results on submissions
- Dropout Risk score (visible to learner as engagement indicators)
- Career Support Agent for skill-gap analysis and guidance

## Key Pages

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard Home | `/learner/` | Overview of all enrolled tracks, upcoming activities |
| Track Progress | `/learner/tracks/{TRK-*}` | Detailed progress for a specific track |
| Lesson View | `/learner/lessons/{LSN-*}` | AI Avatar lesson delivery (Learn/Practice/Apply tabs) |
| Lab View | `/learner/labs/{LAB-*}` | Coding practice environment |
| Pod Workspace | `/learner/pods/{POD-*}` | Pod collaboration tools |
| Payments | `/learner/payments` | Payment status, installments, pause/resume |
| Certificates | `/learner/certificates` | Earned and pending certificates |
| Profile | `/learner/profile` | Personal info, onboarding data, preferences |

## Onboarding Flow
1. Registration form: email, password
2. Email verification
3. Onboarding: country, professional background, learning goals
4. Track recommendations based on goals/background
5. Auto-enrollment in AI Foundation School
6. AI Foundation School progress view (5 module cards)
7. On Foundation completion: paid Track catalog displayed
