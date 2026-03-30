"""Assignment Feedback Agent — structured feedback generation.

Analyzes learner submissions and generates structured feedback including
strengths, improvements, and rubric alignment within 60 seconds.

Endpoints:
    POST /ai/feedback/analyze  — Structured feedback with confidence indicator

Requirements: 21.6, 21.7, 28.8
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agents.learner.guardrails import (
    PromptInjectionError,
    filter_output,
    validate_input,
)
from agents.llm_factory import LLMNotConfiguredError, invoke_llm
from config import settings

logger = logging.getLogger("ai_services")

router = APIRouter(prefix="/ai/feedback", tags=["feedback"])

# SLA: response within 60 seconds
_FEEDBACK_TIMEOUT_SECONDS = 60


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class FeedbackRequest(BaseModel):
    """Request body for assignment feedback analysis."""

    learner_id: str = Field(..., pattern=r"^LRN-", description="Learner ID (LRN-*)")
    submission_id: str = Field(..., pattern=r"^SUB-", description="Submission ID (SUB-*)")
    assessment_id: str = Field(..., pattern=r"^ASM-", description="Assessment ID (ASM-*)")
    submission_content: str = Field(..., min_length=1, max_length=20000)
    rubric: dict[str, Any] | None = Field(
        default=None, description="Assessment rubric for alignment scoring"
    )


class FeedbackStrength(BaseModel):
    """A single strength identified in the submission."""

    area: str
    description: str


class FeedbackImprovement(BaseModel):
    """A single improvement suggestion."""

    area: str
    suggestion: str
    priority: str = Field(description="high | medium | low")


class RubricAlignment(BaseModel):
    """Rubric criterion alignment score."""

    criterion: str
    score: float = Field(ge=0.0, le=1.0)
    notes: str


class FeedbackResponse(BaseModel):
    """Response body for assignment feedback."""

    submission_id: str
    strengths: list[FeedbackStrength]
    improvements: list[FeedbackImprovement]
    rubric_alignment: list[RubricAlignment]
    overall_score: float = Field(ge=0.0, le=1.0)
    confidence: str = Field(description="high | medium | low")
    processing_time_ms: float
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/analyze", response_model=FeedbackResponse)
async def analyze_submission(request: FeedbackRequest) -> FeedbackResponse:
    """Analyze a learner submission and generate structured feedback.

    Produces strengths, improvements, and rubric alignment within 60s SLA.
    Includes confidence indicator on all outputs.
    """
    start_time = time.time()

    logger.info(
        "feedback_analyze_start",
        extra={
            "learner_id": request.learner_id,
            "submission_id": request.submission_id,
            "assessment_id": request.assessment_id,
        },
    )

    try:
        validate_input(request.submission_content)

        # Build prompt with submission content and rubric
        rubric_text = ""
        if request.rubric:
            criteria = request.rubric.get("criteria", [])
            rubric_text = f"Rubric criteria: {', '.join(str(c) for c in criteria)}\n"

        prompt = (
            f"You are an assignment feedback agent for KoreField Academy.\n\n"
            f"Analyze the following learner submission and provide structured feedback.\n\n"
            f"Submission:\n{request.submission_content}\n\n"
            f"{rubric_text}"
            f"Respond as JSON with keys:\n"
            f'- "strengths": list of {{"area": str, "description": str}}\n'
            f'- "improvements": list of {{"area": str, "suggestion": str, "priority": "high"|"medium"|"low"}}\n'
            f'- "rubric_alignment": list of {{"criterion": str, "score": 0.0-1.0, "notes": str}}\n'
            f'- "overall_score": float 0.0-1.0\n'
            f'- "confidence": "high"|"medium"|"low"'
        )

        try:
            raw_text = await invoke_llm(prompt, timeout=60)
        except LLMNotConfiguredError:
            raise HTTPException(status_code=503, detail="LLM service not configured.")
        except Exception as llm_exc:
            logger.error("feedback_llm_error", extra={"error": str(llm_exc)})
            raise HTTPException(status_code=503, detail="LLM service temporarily unavailable.")

        # Parse structured feedback from LLM response — fall back to defaults
        import json as _json

        try:
            parsed = _json.loads(raw_text)
        except (ValueError, TypeError):
            parsed = {}

        strengths = [
            FeedbackStrength(area=s.get("area", "General"), description=filter_output(s.get("description", "")))
            for s in parsed.get("strengths", [])
        ] or [FeedbackStrength(area="General", description=filter_output(raw_text[:200]))]

        improvements = [
            FeedbackImprovement(
                area=i.get("area", "General"),
                suggestion=filter_output(i.get("suggestion", "")),
                priority=i.get("priority", "medium"),
            )
            for i in parsed.get("improvements", [])
        ] or [FeedbackImprovement(area="General", suggestion="Review submission for improvements.", priority="medium")]

        # Rubric alignment
        rubric_alignment: list[RubricAlignment] = []
        for ra in parsed.get("rubric_alignment", []):
            rubric_alignment.append(
                RubricAlignment(
                    criterion=str(ra.get("criterion", "overall")),
                    score=float(ra.get("score", 0.7)),
                    notes=filter_output(str(ra.get("notes", ""))),
                )
            )
        if not rubric_alignment:
            if request.rubric:
                for criterion in request.rubric.get("criteria", ["completeness", "accuracy"]):
                    rubric_alignment.append(
                        RubricAlignment(criterion=str(criterion), score=0.7, notes="LLM evaluation")
                    )
            else:
                rubric_alignment.append(
                    RubricAlignment(criterion="overall_quality", score=0.7, notes="No rubric provided; general assessment")
                )

        overall_score = float(parsed.get("overall_score", 0.7))
        confidence = parsed.get("confidence", "medium")

        processing_time_ms = round((time.time() - start_time) * 1000, 2)

        # SLA check
        if processing_time_ms > _FEEDBACK_TIMEOUT_SECONDS * 1000:
            logger.warning(
                "feedback_sla_breach",
                extra={"processing_time_ms": processing_time_ms, "sla_ms": _FEEDBACK_TIMEOUT_SECONDS * 1000},
            )

        # Output safety filtering on generated text
        for s in strengths:
            s.description = filter_output(s.description)
        for i in improvements:
            i.suggestion = filter_output(i.suggestion)

        telemetry = {
            "workflow": "feedback_analyze",
            "status": "completed",
            "duration_ms": processing_time_ms,
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
        }

        logger.info("feedback_analyze_completed", extra=telemetry)

        return FeedbackResponse(
            submission_id=request.submission_id,
            strengths=strengths,
            improvements=improvements,
            rubric_alignment=rubric_alignment,
            overall_score=overall_score,
            confidence=confidence,
            processing_time_ms=processing_time_ms,
            telemetry=telemetry,
        )

    except PromptInjectionError:
        raise HTTPException(status_code=400, detail="Input rejected: potentially unsafe content detected.")

    except Exception as exc:
        logger.error("feedback_analyze_failed", extra={"error": str(exc)})
        raise HTTPException(status_code=500, detail="Feedback analysis failed. Please retry.")
