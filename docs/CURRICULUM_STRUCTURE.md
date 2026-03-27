# Curriculum Structure — KoreField Academy

## Two-Layer Architecture

### Layer 1 — Foundation School (Free, Mandatory)

Every registered learner is auto-enrolled in Foundation School upon account activation. No payment required. Must be completed before accessing any paid Track Pathway.

**5 Foundation Modules:**

| # | Module | Topics |
|---|--------|--------|
| 1 | AI Literacy and Future of Work | What AI is and is not, predictive vs generative AI, narrow vs frontier AI, human-AI collaboration, future of work realities |
| 2 | AI Fluency and Prompt Intelligence | Zero-shot prompting, few-shot prompting, role prompting, structured output prompting, prompt evaluation, basic chain-of-thought awareness |
| 3 | Systems Awareness | APIs, cloud basics, data pipelines, databases, cybersecurity awareness |
| 4 | Governance and Responsible AI | Bias and fairness, privacy awareness, GDPR, NDPR, CCPA/CPRA, NIST AI RMF, FTC AI Enforcement, responsible AI, hallucination awareness |
| 5 | Professional Discipline | Communication, accountability, collaboration, documentation, learning discipline |

### Layer 2 — Track Pathways (Paid)

Learners enroll in a full Track Pathway (Beginner + Intermediate + Advanced). No isolated level purchases.

**Progression:** Beginner → Intermediate → Advanced, gated by Performance Gates at each boundary.

## Track Level Structure

Each Track contains 3 levels. Each level contains multiple modules. Each module contains lessons, labs, assessments, and a Performance Gate.

```
Track
├── Beginner Level
│   ├── Module 1 → Lessons, Labs, Assessment, Performance Gate
│   ├── Module 2 → ...
│   └── Module N → ...
├── Intermediate Level
│   ├── Module 1 → ...
│   └── Module N → ...
└── Advanced Level
    ├── Module 1 → ...
    ├── Module N → ...
    └── Capstone (unlocked after all Advanced gates passed)
```

## Performance Gates

- Defined at the end of each Module and each Level
- Learner must meet threshold score to advance
- Max 2 reassessment attempts per gate
- On exhausted attempts: module repeat required
- On pass: next module/level unlocked

## Content Types

- Text lessons
- Video content (hosted on Cloudflare Stream)
- Interactive code exercises (Monaco Editor — Python, SQL, JavaScript)
- Quizzes
- Downloadable resources

## Content Versioning

- Changes to published modules do not affect in-progress learners
- Updates apply only to learners who haven't started the module
- Each module version is tracked with CVR-* IDs
