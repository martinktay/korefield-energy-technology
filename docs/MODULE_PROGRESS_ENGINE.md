# Module Progress Engine — KoreField Academy

## Overview

The Module Progress Engine controls how learners advance through the curriculum. Progression is strictly performance-gated — no time-based or attendance-based advancement.

## Progression Hierarchy

```
AI Foundation School (5 modules, free, mandatory)
    ↓ (all 5 complete)
Track Pathway Enrollment (paid)
    ↓
Beginner Level
    Module 1 → Performance Gate → Module 2 → ... → Level Gate
        ↓ (level gate passed)
Intermediate Level
    Module 1 → Performance Gate → Module 2 → ... → Level Gate
        ↓ (level gate passed)
Advanced Level
    Module 1 → Performance Gate → Module 2 → ... → Level Gate
        ↓ (all advanced gates passed + assessor validates readiness)
Capstone Unlocked
```

## Performance Gate Evaluation

### Gate Types
- **Module Gate**: End of each module within a level
- **Level Gate**: End of each level (Beginner → Intermediate → Advanced)

### Evaluation Logic
```
POST /enrollment/gates/{PGT-*}/evaluate

Input: learner_id, gate_id, submission_data
Process:
  1. Score submission against gate threshold (PGT-*.threshold_score)
  2. Record GateAttempt (GTA-*) with score, passed flag, attempt_number
  3. If passed → unlock next module/level
  4. If failed → check attempt_number against max_attempts (2)
     - If attempts < 2 → allow reassessment, provide feedback
     - If attempts = 2 → require module repeat
Output: { passed, score, feedback, next_action }
```

### Attempt Rules
- Max 2 attempts per gate
- Each attempt recorded as GTA-* with score and timestamp
- On first failure: feedback provided, reassessment offered
- On second failure: module repeat required (learner must redo the module)
- On module repeat: attempt counter resets for that gate

## Unlock Sequences

| Event | Unlocks |
|-------|---------|
| Foundation module N complete | Foundation module N+1 |
| All 5 Foundation modules complete | Paid Track catalog |
| Track enrollment confirmed + payment | Beginner Level, Module 1 |
| Module gate passed | Next module in same level |
| Level gate passed (Beginner) | Intermediate Level, Module 1 |
| Level gate passed (Intermediate) | Advanced Level, Module 1 |
| All Advanced gates passed + assessor readiness | Capstone |
| Capstone defense passed | Certificate eligibility check |

## Progress Tracking

### API
- `GET /enrollment/progress` — returns learner progress across all enrolled tracks
- Response includes: current level, current module, completion percentage per track, gate results

### Caching
- Progress cached in Redis: `progress:{LRN-*}:{TRK-*}` with 2-minute TTL
- Dashboard updates within 60 seconds of module completion

### Progress States per Module
- `locked` — prerequisites not met
- `available` — unlocked, not started
- `in_progress` — started, not completed
- `completed` — all lessons/assessments done, gate passed
- `repeat_required` — gate failed after max attempts, must redo
