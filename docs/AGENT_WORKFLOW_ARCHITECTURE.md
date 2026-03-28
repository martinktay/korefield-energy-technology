# Agent Workflow Architecture — KoreField Academy

## Agent Ecosystem Overview

Three categories of AI agents built on LangChain + LangGraph + LangSmith:

```
ai-services/
├── agents/
│   ├── learner/       # Tutor, Feedback, Dropout Risk, Career Support
│   ├── faculty/       # Instructor Insight, Assessor Support, Certification Validation
│   └── executive/     # Market Intelligence, Pricing Intelligence, Expansion, Academic Performance, Strategy, Growth, Product Strategy, Workforce Intelligence
├── workflows/         # LangGraph workflow definitions
├── prompts/           # Version-controlled prompts
├── rag/               # RAG pipelines, vector DB, chunking/embedding
└── tests/
```

## Technology Mapping

| Technology | Purpose | Used By |
|-----------|---------|---------|
| LangChain | RAG retrieval, document intelligence, summarization, search | Tutor, Feedback, Career, Market Intelligence |
| LangGraph | Stateful multi-step workflows with explicit state machines | Certification Validation, Dropout Intervention, Market Intelligence |
| LangSmith | Tracing, prompt debugging, workflow evaluation, monitoring | All agents |
| FastAPI | HTTP layer for agent endpoints | All agents |

## Learner-Side Agents

### Tutor Agent (`agents/learner/tutor.py`)
- **Type**: LangChain RAG
- **Endpoints**: `POST /ai/tutor/lesson`, `POST /ai/tutor/summarize`
- **Function**: RAG-based lesson delivery, adaptive pacing, lesson recap summarization
- **Telemetry**: Workflow start/completion/failure, LLM latency, token usage, retrieval hit count

### Assignment Feedback Agent (`agents/learner/feedback.py`)
- **Type**: LangChain document intelligence
- **Endpoint**: `POST /ai/feedback/analyze`
- **Function**: Analyze submissions, generate structured feedback (strengths, improvements, rubric alignment)
- **SLA**: Response within 60 seconds
- **Output**: Includes confidence indicator

### Dropout Risk Agent (`agents/learner/dropout.py`)
- **Type**: LangGraph workflow
- **Endpoints**: `POST /ai/dropout/evaluate`, `GET /ai/dropout/risk/{LRN-*}`
- **Function**: Compute risk score from engagement signals, trigger intervention workflow on threshold breach
- **Signals**: Login frequency, submission timeliness, scores, pod participation
- **Intervention**: Notify assessor + generate re-engagement recommendation

### Career Support Agent (`agents/learner/career.py`)
- **Type**: LangChain
- **Endpoint**: `POST /ai/career/guidance`
- **Function**: Skill-gap analysis, job market alignment, suggested focus areas

## Faculty-Side Agents

### Instructor Insight Agent (`agents/faculty/instructor_insight.py`)
- **Endpoint**: `GET /ai/faculty/cohort-analytics/{ENR-*}`
- **Function**: Cohort performance patterns, content engagement metrics, struggle module identification

### Assessor Support Agent (`agents/faculty/assessor_support.py`)
- **Endpoints**: `GET /ai/faculty/review-queue/{USR-*}`, `GET /ai/faculty/pod-health/{POD-*}`
- **Function**: Prioritize review queue (by age, risk, deadlines), pod health indicators (collaboration frequency, contribution balance)

### Certification Validation Agent (`agents/faculty/certification_validation.py`)
- **Type**: LangGraph multi-step workflow
- **Endpoint**: `POST /ai/faculty/validate-certification/{LRN-*}`
- **Function**: Verify all 6 certification prerequisites, produce structured validation report
- **Workflow Design**: Explicit node responsibilities, edge conditions, state schema, termination criteria, max step limit, timeout
- **Audit**: State transitions logged for debugging

## Executive-Side Agents (Super Admin Only)

### Market Intelligence Agent (`agents/executive/market_intelligence.py`)
- **Type**: LangGraph + LangChain (web-grounded search)
- **Endpoints**: `POST /ai/executive/market-report`, `GET /ai/executive/market-alerts`
- **Function**: Competitor pricing, hiring trends, geography expansion, policy monitoring, track relevance scoring
- **Outputs**: Executive reports, alerts, pricing comparisons, trend summaries, opportunity signals
- **Controls**: All queries logged (AQR-*), confidence scores on all outputs, unsupported claims rejected
- **Access**: Super Admin role only

### Pricing Intelligence Agent (`agents/executive/pricing_intelligence.py`)
- **Endpoint**: `POST /ai/executive/pricing-recommendation`
- **Function**: Market benchmarks, regional purchasing power, enrollment conversion rates, track demand signals

### Expansion Opportunity Agent (`agents/executive/expansion.py`)
- **Endpoint**: `GET /ai/executive/expansion-opportunities`
- **Function**: Enrollment density, waitlist growth, market demand, geographic coverage gaps

### Academic Performance Insight Agent (`agents/executive/academic_performance.py`)
- **Endpoint**: `GET /ai/executive/academic-analytics`
- **Function**: Gate pass rate trends, remediation patterns, certification throughput, cross-track comparisons

### Strategy Agent (`agents/executive/strategy.py`)
- **Type**: LangGraph multi-step workflow
- **Endpoint**: `POST /ai/executive/strategy-report`
- **Function**: Competitive positioning analysis, market gap identification, strategic recommendations
- **Controls**: All queries logged (AQR-*), confidence scores on all output sections, unsupported claims rejected
- **Access**: Super Admin role only

### Growth Agent (`agents/executive/growth.py`)
- **Type**: LangGraph multi-step workflow
- **Endpoint**: `POST /ai/executive/growth-report`
- **Function**: Acquisition channel analysis, conversion funnel metrics, viral loop opportunity identification
- **Controls**: All queries logged (AQR-*), confidence scores on all output sections, unsupported claims rejected
- **Access**: Super Admin role only

### Product Strategy Agent (`agents/executive/product_strategy.py`)
- **Type**: LangGraph multi-step workflow
- **Endpoint**: `POST /ai/executive/product-report`
- **Function**: Feature prioritization analysis, user journey optimization recommendations
- **Controls**: All queries logged (AQR-*), confidence scores on all output sections, unsupported claims rejected
- **Access**: Super Admin role only

### Workforce Intelligence Agent (`agents/executive/workforce_intelligence.py`)
- **Type**: LangGraph multi-step workflow
- **Endpoint**: `POST /ai/executive/workforce-report`
- **Function**: Hiring trend analysis, skill demand signals, talent pipeline assessment
- **Controls**: All queries logged (AQR-*), confidence scores on all output sections, unsupported claims rejected
- **Access**: Super Admin role only

## Workflow Design Standards

Every LangGraph workflow must have:
1. Documented purpose and scope
2. Explicit input/output schema
3. Defined node responsibilities
4. Edge conditions between nodes
5. State schema definition
6. Termination criteria
7. Max step limit and timeout
8. Error handling at each node
9. Separation of concerns: retrieval → prompt construction → model invocation → post-processing
10. Idempotency where applicable

## RAG Pipeline (`rag/`)

- Curriculum content ingestion with controlled pipeline
- Chunking with defined chunk size and overlap
- Embedding generation
- Vector store integration
- Versioned knowledge base
- Retrieval quality measurement against curated evaluation dataset

## Prompt Management (`prompts/`)

- Version-controlled prompt storage
- Retrieval by version identifier (PMV-*)
- Evaluation against test dataset before deployment
- Change review and approval process before production
