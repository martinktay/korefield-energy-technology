# Curriculum Structure — KoreField Academy

## Two-Layer Architecture

### Layer 1 — AI Foundation School (Free, Mandatory, Conversion-Focused)

Every registered learner is auto-enrolled in AI Foundation School upon account activation. No payment required. Must be completed before accessing any paid Track Pathway.

4 phases, 12 modules + 1 capstone project. Designed to teach AI, build confidence, and drive conversion to paid tracks.

**Phase 1 — Awareness & Direction (2 days)**

| # | Module | Duration | Objective | Hands-on Task | Deliverable | Assessment |
|---|--------|----------|-----------|---------------|-------------|------------|
| 1 | The AI Opportunity & Future of Work | 1 day | Understand where AI fits globally and locally | Identify 3 real AI use cases in their environment | Short written response or video | Completion + reflection |
| 2 | Choosing Your AI Career Path | 1 day | Choose a track early | Match personal interest to 1 KoreField track | Track selection | Required selection (no skip) |

**Phase 2 — Quick Wins & Confidence (3-5 days)**

| # | Module | Duration | Objective | Hands-on Task | Deliverable | Assessment |
|---|--------|----------|-----------|---------------|-------------|------------|
| 3 | Prompting That Actually Works | 1-2 days | Teach effective prompting | Improve a bad prompt into a good one | Before/after outputs | Output quality check |
| 4 | AI Productivity & Workflow Automation | 1-2 days | Show real-life usefulness of AI | Use AI to complete a real task | Output (doc, summary, etc.) | Practical task validation |
| 5 | Thinking With AI (Fixing Outputs) | 1 day | Teach debugging mindset | Fix incorrect AI response step-by-step | Improved output | Reasoning explanation |

**Phase 3 — Build Your First AI System (4-6 days)**

| # | Module | Duration | Objective | Hands-on Task | Deliverable | Assessment |
|---|--------|----------|-----------|---------------|-------------|------------|
| 6 | Introduction to AI Agents | 1 day | Understand agent systems | Map a simple agent workflow | Workflow diagram | Concept clarity check |
| 7 | Build Your First AI Assistant | 2-3 days | Build something real | Create a simple assistant | Working AI workflow | Functional test |
| 8 | Improve Your AI System | 1-2 days | Improve quality & reliability | Add structure + refine prompts | Improved version | Comparison check |

**Phase 4 — Conversion & Direction (4 days)**

| # | Module | Duration | Objective | Hands-on Task | Deliverable | Assessment |
|---|--------|----------|-----------|---------------|-------------|------------|
| 9 | How AI Systems Work (Simplified) | 1 day | Understand system flow | Map simple AI system | Diagram or explanation | Concept check |
| 10 | Real-World AI Applications | 1 day | Show real industry usage | Identify AI use case in chosen track | Use-case write-up | Relevance check |
| 11 | Pod-Based Learning & Collaboration | 1 day | Prepare for teamwork | Simulate mini team task | Team response | Participation |
| 12 | Track Selection & Next Steps | 1 day | Drive conversion | Confirm track + learning goal | Final decision | Required action |

**Foundation Mini Project (Capstone)**

Build a simple AI assistant that solves a real problem. Options: Study assistant, Research assistant, Content generator, Personal productivity tool.

Deliverables: Problem definition, Prompt design, Output samples, Improvement iteration, Short explanation.

Assessment: Does it work? Is it useful? Can student explain it?

**Conversion Trigger Points:**

- After Module 5: "You've learned how to use AI — now learn to build real systems"
- After Module 8: "You just built your first AI assistant — imagine building production systems"
- After Capstone: "Ready to become an AI Engineer / Data Scientist / etc?"

**Module UX Flow (Learn → Practice → Apply):**

Each module page has 3 tabs:
1. Learn: AI Avatar explanation + key concepts
2. Practice: Task instructions + input field/lab + examples
3. Apply: Deliverable submission (upload or text input)

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

## Content Authoring Pipeline

Instructors and Super Admins can create and manage learning resources through the platform:

### Lesson Management
- Create lessons within modules with title, content type, sequence, and content body
- Content types: text (markdown/rich text), video (Cloudflare Stream URL), interactive_code, quiz, downloadable
- Video lessons store a `video_url` pointing to Cloudflare Stream
- Downloadable resources upload files to S3 via presigned URLs, stored as `file_url` + `file_name`
- Lessons can be reordered within a module by updating sequence numbers

### Assessment Management
- Create assessments within modules with title, type, rubric, and max score
- Assessment types: quiz, code_exercise, lab_submission, pod_deliverable, peer_review, capstone_defense, performance_gate
- Rubric stored as JSON for flexible grading criteria

### File Upload
- Files (PDFs, documents, resources) uploaded via S3 presigned URLs
- Backend generates a presigned PUT URL, frontend uploads directly to S3
- S3 bucket: `{project}-{env}-uploads` with KMS encryption
- Supported: PDF, DOCX, PPTX, ZIP, images (max 50MB)

### AI Foundation School Content
- Foundation modules stored in the database as a dedicated track (FND-*)
- Lessons within Foundation modules follow the same structure as Track lessons
- Foundation content is fetched via `GET /content/foundation` endpoint
