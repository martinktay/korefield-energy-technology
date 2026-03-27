# AI Avatar Learning Engine — KoreField Academy

## Overview

The AI Avatar is an AI-driven virtual teaching agent that delivers structured lesson content to learners. It is powered by the Tutor Agent (LangChain RAG-based) and provides adaptive, personalized instruction within each module.

## Lesson Delivery Flow

```
Learner opens lesson → AI Avatar presents objectives
    ↓
Content delivery (text, video, interactive elements)
    ↓
Checkpoint (interactive question/exercise)
    ↓
Immediate feedback on checkpoint response
    ↓
Adaptive pacing adjustment based on response
    ↓
Next content section or lesson recap
    ↓
Lesson complete → Tutor Agent generates recap summary
```

## Core Components

### 1. Lesson Presentation
- AI Avatar presents lesson objectives at the start
- Content delivered in structured sections following curriculum sequence
- Content types: text explanations, video segments (Cloudflare Stream), interactive code checkpoints, quizzes
- Each section builds on the previous one

### 2. Interactive Checkpoints
- Embedded within lessons at key learning moments
- Types: multiple choice, code execution, short answer, drag-and-drop
- Immediate feedback on learner responses
- Checkpoint results feed into adaptive pacing

### 3. Adaptive Pacing
- Based on checkpoint response accuracy and speed
- If learner struggles (low accuracy): slow down, provide additional examples, offer hints
- If learner excels (high accuracy, fast): skip supplementary content, advance to next section
- Pacing decisions made by Tutor Agent based on learner's checkpoint history within the lesson

### 4. RAG-Based Content Retrieval
- Tutor Agent uses LangChain RAG to retrieve relevant curriculum content
- Generates contextual explanations tailored to the learner's current position
- Retrieves from versioned knowledge base (curriculum content ingested via RAG pipeline)
- Retrieval quality measured against curated evaluation dataset

### 5. Lesson Recap
- On lesson completion, Tutor Agent generates a summary recap
- Recap highlights key concepts, learner's checkpoint performance, and areas for review
- Recap stored and accessible from learner dashboard

## Error Handling

- If AI Avatar encounters a content delivery error:
  1. Error logged with full context
  2. Learner notified with friendly message
  3. Options offered: retry current section or skip to next section
- Graceful degradation: if Tutor Agent is unavailable, static lesson content displayed without AI augmentation

## Coding Checkpoints Within Lessons

When a lesson includes an interactive coding checkpoint:
1. AI Avatar presents the coding exercise context
2. Coding Practice Environment loads within the lesson view (Script, Notebook, SQL, or Terminal mode)
3. Learner writes and executes code
4. Results feed back to AI Avatar for contextual feedback
5. AI Avatar provides hints via the AI Tutor sidebar panel

## Telemetry

The Tutor Agent emits structured telemetry for every interaction:
- Workflow start/completion/failure events
- LLM latency per call
- Token usage per interaction
- Retrieval hit count (how many RAG chunks retrieved)
- Checkpoint response accuracy per learner per lesson
- All telemetry traced through LangSmith

## Security

- Prompt injection protection middleware on all input to Tutor Agent
- Output safety filtering on all responses
- Tutor Agent cannot modify curriculum, create content, or access other learners' data
- Rate limits on AI interactions per learner
