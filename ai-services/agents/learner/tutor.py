"""Tutor Agent — RAG-based lesson delivery and summarization.

Provides AI Avatar-powered lesson delivery using LangChain RAG retrieval
and adaptive pacing based on learner checkpoint responses. Integrates
AI cap enforcement, tutor response caching, and metered LLM invocation.

Endpoints:
    POST /ai/tutor/lesson     — RAG-based lesson delivery
    POST /ai/tutor/summarize  — Lesson recap summarization

Requirements: 2.3, 3.1, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 21.4, 21.5, 29.16, 31.23, 31.24
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agents.ai_cap_service import AiCapService
from agents.learner.guardrails import (
    PromptInjectionError,
    filter_output,
    validate_input,
)
from agents.llm_factory import LLMNotConfiguredError, invoke_llm
from agents.tutor_cache import TutorCache
from config import settings
from rag.pipeline import RAGPipeline

logger = logging.getLogger("ai_services")

router = APIRouter(prefix="/ai/tutor", tags=["tutor"])

# Shared RAG pipeline instance
_rag_pipeline = RAGPipeline()

# Shared AI cap service and tutor cache instances
_ai_cap_service = AiCapService()
_tutor_cache = TutorCache()


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class LessonRequest(BaseModel):
    """Request body for RAG-based lesson delivery."""

    learner_id: str = Field(..., pattern=r"^LRN-", description="Learner ID (LRN-*)")
    module_id: str = Field(..., pattern=r"^MOD-", description="Module ID (MOD-*)")
    lesson_id: str = Field(..., pattern=r"^LSN-", description="Lesson ID (LSN-*)")
    query: str = Field(..., min_length=1, max_length=2000, description="Learner question or lesson request")
    learner_tier: str = Field(default="cohort", description="foundation | cohort")
    cohort_id: str | None = Field(default=None, description="Cohort ID (COH-*)")
    checkpoint_responses: list[dict[str, Any]] | None = Field(
        default=None, description="Previous checkpoint responses for adaptive pacing"
    )


class LessonResponse(BaseModel):
    """Response body for lesson delivery."""

    explanation: str
    key_concepts: list[str]
    confidence: str = Field(description="high | medium | low")
    pacing: str = Field(description="standard | slower | faster")
    retrieval_hits: int
    telemetry: dict[str, Any]


class SummarizeRequest(BaseModel):
    """Request body for lesson recap summarization."""

    learner_id: str = Field(..., pattern=r"^LRN-", description="Learner ID (LRN-*)")
    lesson_id: str = Field(..., pattern=r"^LSN-", description="Lesson ID (LSN-*)")
    lesson_content: str = Field(..., min_length=1, max_length=10000)


class SummarizeResponse(BaseModel):
    """Response body for lesson summarization."""

    summary: str
    key_takeaways: list[str]
    confidence: str
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Adaptive pacing logic
# ---------------------------------------------------------------------------

def _compute_pacing(checkpoint_responses: list[dict[str, Any]] | None) -> str:
    """Determine pacing based on learner checkpoint performance.

    Returns 'slower' if accuracy < 50%, 'faster' if > 80%, else 'standard'.
    """
    if not checkpoint_responses:
        return "standard"

    correct = sum(1 for r in checkpoint_responses if r.get("correct", False))
    total = len(checkpoint_responses)
    if total == 0:
        return "standard"

    accuracy = correct / total
    if accuracy < 0.5:
        return "slower"
    elif accuracy > 0.8:
        return "faster"
    return "standard"


# ---------------------------------------------------------------------------
# Telemetry helper
# ---------------------------------------------------------------------------

def _build_telemetry(
    *,
    workflow: str,
    start_time: float,
    retrieval_hits: int,
    status: str = "completed",
    error: str | None = None,
) -> dict[str, Any]:
    """Build structured telemetry dict for agent observability."""
    duration_ms = round((time.time() - start_time) * 1000, 2)
    telemetry: dict[str, Any] = {
        "workflow": workflow,
        "status": status,
        "duration_ms": duration_ms,
        "retrieval_hits": retrieval_hits,
        "model": settings.default_model,
        "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
    }
    if error:
        telemetry["error"] = error
    return telemetry


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/lesson", response_model=LessonResponse)
async def deliver_lesson(request: LessonRequest) -> LessonResponse:
    """RAG-based lesson delivery with adaptive pacing.

    Flow: (1) check AI cap, (2) check tutor cache, (3) on miss invoke LLM
    with metering, (4) cache the response.
    """
    start_time = time.time()
    retrieval_hits = 0

    logger.info(
        "tutor_lesson_start",
        extra={
            "learner_id": request.learner_id,
            "lesson_id": request.lesson_id,
            "module_id": request.module_id,
        },
    )

    try:
        # Input guardrail — prompt injection protection
        validate_input(request.query)

        # (1) AI cap enforcement
        cap_result = await _ai_cap_service.check_and_increment(
            request.learner_id, request.learner_tier
        )
        if not cap_result.allowed:
            raise HTTPException(
                status_code=429,
                detail=(
                    f"You've reached your daily AI hint limit ({cap_result.cap} requests). "
                    f"Your limit resets at {cap_result.reset_at}. "
                    "Take a break and try again tomorrow!"
                ),
            )

        # (2) Tutor cache check
        cached = await _tutor_cache.get(request.module_id, request.query)
        if cached is not None:
            telemetry = _build_telemetry(
                workflow="tutor_lesson",
                start_time=start_time,
                retrieval_hits=0,
            )
            telemetry["cache_hit"] = True
            logger.info("tutor_lesson_cache_hit", extra=telemetry)
            return LessonResponse(
                explanation=cached.get("explanation", ""),
                key_concepts=cached.get("key_concepts", []),
                confidence=cached.get("confidence", "medium"),
                pacing=cached.get("pacing", "standard"),
                retrieval_hits=cached.get("retrieval_hits", 0),
                telemetry=telemetry,
            )

        # RAG retrieval
        rag_results = await _rag_pipeline.retrieve(
            query=request.query,
            top_k=5,
        )
        retrieval_hits = len(rag_results)

        # Adaptive pacing
        pacing = _compute_pacing(request.checkpoint_responses)

        # Build context from RAG results
        context = "\n\n".join(
            r.get("content", r.get("text", "")) for r in rag_results
        ) or "No curriculum content retrieved for this query."

        # Build prompt and invoke LLM with metering
        prompt = (
            f"You are an AI tutor for KoreField Academy.\n"
            f"Pacing: {pacing}.\n\n"
            f"Curriculum context:\n{context}\n\n"
            f"Learner question: {request.query}\n\n"
            f"Provide a clear explanation and list key concepts as a JSON object "
            f'with keys "explanation" (string) and "key_concepts" (list of strings).'
        )

        try:
            # (3) Invoke LLM with agent_type, learner_id, cohort_id for metering
            raw_text = await invoke_llm(
                prompt,
                timeout=30,
                agent_type="tutor_hint",
                learner_id=request.learner_id,
                cohort_id=request.cohort_id,
                learner_tier=request.learner_tier,
            )
        except LLMNotConfiguredError:
            raise HTTPException(status_code=503, detail="LLM service not configured.")
        except Exception as llm_exc:
            logger.error("tutor_llm_error", extra={"error": str(llm_exc)})
            raise HTTPException(status_code=503, detail="LLM service temporarily unavailable.")

        # Output guardrail — safety filtering
        explanation = filter_output(raw_text)

        confidence = "high" if retrieval_hits >= 3 else "medium" if retrieval_hits >= 1 else "low"

        telemetry = _build_telemetry(
            workflow="tutor_lesson",
            start_time=start_time,
            retrieval_hits=retrieval_hits,
        )
        telemetry["cache_hit"] = False

        # (4) Cache the response
        cache_payload = {
            "explanation": explanation,
            "key_concepts": ["concept_placeholder"],
            "confidence": confidence,
            "pacing": pacing,
            "retrieval_hits": retrieval_hits,
        }
        await _tutor_cache.set(request.module_id, request.query, cache_payload)

        logger.info("tutor_lesson_completed", extra=telemetry)

        return LessonResponse(
            explanation=explanation,
            key_concepts=["concept_placeholder"],
            confidence=confidence,
            pacing=pacing,
            retrieval_hits=retrieval_hits,
            telemetry=telemetry,
        )

    except PromptInjectionError:
        telemetry = _build_telemetry(
            workflow="tutor_lesson",
            start_time=start_time,
            retrieval_hits=retrieval_hits,
            status="blocked",
            error="prompt_injection_detected",
        )
        logger.warning("tutor_lesson_blocked", extra=telemetry)
        raise HTTPException(status_code=400, detail="Input rejected: potentially unsafe content detected.")

    except HTTPException:
        raise

    except Exception as exc:
        telemetry = _build_telemetry(
            workflow="tutor_lesson",
            start_time=start_time,
            retrieval_hits=retrieval_hits,
            status="failed",
            error=str(exc),
        )
        logger.error("tutor_lesson_failed", extra=telemetry)
        raise HTTPException(status_code=500, detail="Lesson delivery failed. Please retry.")


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize_lesson(request: SummarizeRequest) -> SummarizeResponse:
    """Lesson recap summarization on completion.

    Produces a concise summary with key takeaways for the learner.
    """
    start_time = time.time()

    logger.info(
        "tutor_summarize_start",
        extra={"learner_id": request.learner_id, "lesson_id": request.lesson_id},
    )

    try:
        validate_input(request.lesson_content)

        # Build prompt and invoke LLM for summarization
        prompt = (
            f"You are an AI tutor for KoreField Academy.\n\n"
            f"Summarize the following lesson content into a concise recap with "
            f"key takeaways.\n\nLesson content:\n{request.lesson_content}\n\n"
            f'Respond as a JSON object with keys "summary" (string) and '
            f'"key_takeaways" (list of strings).'
        )

        try:
            raw_text = await invoke_llm(prompt, timeout=30)
        except LLMNotConfiguredError:
            raise HTTPException(status_code=503, detail="LLM service not configured.")
        except Exception as llm_exc:
            logger.error("tutor_summarize_llm_error", extra={"error": str(llm_exc)})
            raise HTTPException(status_code=503, detail="LLM service temporarily unavailable.")

        summary = filter_output(raw_text)

        telemetry = _build_telemetry(
            workflow="tutor_summarize",
            start_time=start_time,
            retrieval_hits=0,
        )

        logger.info("tutor_summarize_completed", extra=telemetry)

        return SummarizeResponse(
            summary=summary,
            key_takeaways=["Key takeaway placeholder"],
            confidence="medium",
            telemetry=telemetry,
        )

    except PromptInjectionError:
        raise HTTPException(status_code=400, detail="Input rejected: potentially unsafe content detected.")

    except Exception as exc:
        telemetry = _build_telemetry(
            workflow="tutor_summarize",
            start_time=start_time,
            retrieval_hits=0,
            status="failed",
            error=str(exc),
        )
        logger.error("tutor_summarize_failed", extra=telemetry)
        raise HTTPException(status_code=500, detail="Summarization failed. Please retry.")
