# LangChain, LangGraph & LangSmith Usage — KoreField Academy

## Technology Responsibilities

### LangChain
Used for single-step AI operations requiring retrieval, synthesis, or generation.

| Use Case | Agent |
|----------|-------|
| RAG-based lesson delivery | Tutor Agent |
| Content summarization | Tutor Agent |
| Assignment analysis and feedback | Assignment Feedback Agent |
| Skill-gap analysis | Career Support Agent |
| Web-grounded search and synthesis | Market Intelligence Agent |

### LangGraph
Used for stateful, multi-step workflows requiring explicit state machines.

| Workflow | Agent | Steps |
|----------|-------|-------|
| Certification validation | Certification Validation Agent | Verify Foundation → Levels → Pod deliverables → Capstone → Assessor → Payment |
| Dropout intervention | Dropout Risk Agent | Detect risk → Notify assessor → Generate re-engagement recommendation |
| Market intelligence report | Market Intelligence Agent | Web search → Competitor analysis → Hiring trends → Geography → Policy → Scoring |

### LangSmith
Used for observability, evaluation, and debugging across all agents.

| Capability | Description |
|-----------|-------------|
| Tracing | All agent workflows traced: input, intermediate steps, output, duration |
| Prompt debugging | Failure rates, latency, version comparisons |
| Workflow evaluation | Response quality, success rates, end-to-end performance |
| Failure logging | Reason, affected agent, workflow step, input context |
| Retention | 90-day trace retention in production |

## LangGraph Workflow Design Requirements

Every LangGraph workflow must define:
1. Purpose and scope documentation
2. Input/output schema (typed)
3. Node responsibilities (what each node does)
4. Edge conditions (when to transition between nodes)
5. State schema (what data flows through the graph)
6. Termination criteria (when the workflow ends)
7. Max step limit (prevent infinite loops)
8. Timeout configuration
9. Error handling at each node
10. Separation of concerns: retrieval → prompt → model → post-processing
