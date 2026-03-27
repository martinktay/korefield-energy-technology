"""Career Support Agent — skill-gap analysis and career guidance.

Provides skill-gap analysis based on track progress, job market alignment,
and suggested focus areas for learners.

Endpoints:
    POST /ai/career/guidance  — Skill-gap analysis and career guidance

Requirements: 21.10
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
from config import settings

logger = logging.getLogger("ai_services")

router = APIRouter(prefix="/ai/career", tags=["career"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class CareerGuidanceRequest(BaseModel):
    """Request body for career guidance."""

    learner_id: str = Field(..., pattern=r"^LRN-", description="Learner ID (LRN-*)")
    track_id: str = Field(..., pattern=r"^TRK-", description="Track ID (TRK-*)")
    completed_modules: list[str] = Field(
        default_factory=list, description="List of completed MOD-* IDs"
    )
    career_interests: str = Field(
        default="", max_length=2000, description="Learner's career interests"
    )


class SkillGap(BaseModel):
    """A single identified skill gap."""

    skill: str
    current_level: str = Field(description="none | beginner | intermediate | advanced")
    target_level: str = Field(description="beginner | intermediate | advanced")
    priority: str = Field(description="high | medium | low")


class CareerGuidanceResponse(BaseModel):
    """Response body for career guidance."""

    learner_id: str
    track_id: str
    skill_gaps: list[SkillGap]
    suggested_focus_areas: list[str]
    job_market_alignment: str
    confidence: str = Field(description="high | medium | low")
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post("/guidance", response_model=CareerGuidanceResponse)
async def career_guidance(request: CareerGuidanceRequest) -> CareerGuidanceResponse:
    """Skill-gap analysis based on track progress and job market alignment."""
    start_time = time.time()

    logger.info(
        "career_guidance_start",
        extra={
            "learner_id": request.learner_id,
            "track_id": request.track_id,
            "completed_modules": len(request.completed_modules),
        },
    )

    try:
        if request.career_interests:
            validate_input(request.career_interests)

        # Stub skill-gap analysis — real integration requires LLM API keys
        progress_ratio = len(request.completed_modules) / max(1, 12)  # assume ~12 modules per track

        skill_gaps = [
            SkillGap(
                skill="Applied AI Implementation",
                current_level="beginner" if progress_ratio < 0.5 else "intermediate",
                target_level="advanced",
                priority="high",
            ),
            SkillGap(
                skill="Industry Best Practices",
                current_level="none" if progress_ratio < 0.3 else "beginner",
                target_level="intermediate",
                priority="medium",
            ),
        ]

        suggested_focus = [
            "Complete remaining track modules to build core competency",
            "Engage in pod collaboration for practical experience",
            "Review industry case studies in your track domain",
        ]

        alignment = filter_output(
            f"Based on {len(request.completed_modules)} completed modules in track "
            f"{request.track_id}, your profile aligns with entry-level to mid-level "
            f"roles in the AI industry. Focus on completing advanced modules and "
            f"capstone to strengthen your candidacy."
        )

        confidence = "high" if progress_ratio > 0.7 else "medium" if progress_ratio > 0.3 else "low"

        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "career_guidance",
            "status": "completed",
            "duration_ms": duration_ms,
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
        }

        logger.info("career_guidance_completed", extra=telemetry)

        return CareerGuidanceResponse(
            learner_id=request.learner_id,
            track_id=request.track_id,
            skill_gaps=skill_gaps,
            suggested_focus_areas=suggested_focus,
            job_market_alignment=alignment,
            confidence=confidence,
            telemetry=telemetry,
        )

    except PromptInjectionError:
        raise HTTPException(status_code=400, detail="Input rejected: potentially unsafe content detected.")

    except Exception as exc:
        logger.error("career_guidance_failed", extra={"error": str(exc)})
        raise HTTPException(status_code=500, detail="Career guidance failed. Please retry.")
