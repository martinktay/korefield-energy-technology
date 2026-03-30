"""Career Support Agent — skill-gap analysis and career guidance.

Provides skill-gap analysis based on track progress, job market alignment,
and suggested focus areas for learners.  When a learner has declared a
project interest during onboarding and has completed Foundation Module 2,
the agent generates a personalized learning emphasis report mapping the
interest to track modules via LLM.  Otherwise it produces a generic
report based on track and background.

Endpoints:
    POST /ai/career/guidance  — Skill-gap analysis and career guidance

Requirements: 5.6, 5.7, 21.10
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
from agents.llm_factory import invoke_llm
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
    project_interest: str | None = Field(
        default=None, max_length=500, description="What the learner wants to build (from onboarding)"
    )
    foundation_module_2_complete: bool = Field(
        default=False, description="Whether the learner has completed Foundation Module 2"
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
    learning_emphasis: str | None = Field(
        default=None, description="Personalized learning emphasis report based on project interest"
    )
    confidence: str = Field(description="high | medium | low")
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Prompt builders
# ---------------------------------------------------------------------------

def _build_personalized_prompt(request: CareerGuidanceRequest) -> str:
    """Build an LLM prompt for a personalized learning emphasis report."""
    return (
        f"You are a career support advisor for an applied AI learning platform.\n"
        f"The learner wants to build: '{request.project_interest}'.\n"
        f"They are enrolled in track {request.track_id} and have completed "
        f"{len(request.completed_modules)} modules so far: "
        f"{', '.join(request.completed_modules) or 'none'}.\n\n"
        f"Generate a personalized learning emphasis report that maps their "
        f"project interest to relevant track modules and recommended focus "
        f"areas. Include specific module recommendations, practical skills "
        f"to prioritize, and how their project goal connects to the track "
        f"curriculum. Keep the response concise (2-3 paragraphs)."
    )


def _build_generic_prompt(request: CareerGuidanceRequest) -> str:
    """Build an LLM prompt for a generic learning emphasis report."""
    return (
        f"You are a career support advisor for an applied AI learning platform.\n"
        f"The learner is enrolled in track {request.track_id} and has completed "
        f"{len(request.completed_modules)} modules so far: "
        f"{', '.join(request.completed_modules) or 'none'}.\n"
        f"Career interests: {request.career_interests or 'not specified'}.\n\n"
        f"Generate a generic learning emphasis report based on their track "
        f"and background. Recommend a balanced approach across track modules "
        f"with emphasis on core competencies and practical labs. "
        f"Keep the response concise (2-3 paragraphs)."
    )


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
        if request.project_interest:
            validate_input(request.project_interest)

        # Stub skill-gap analysis — real integration requires LLM API keys
        progress_ratio = len(request.completed_modules) / max(1, 12)

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

        # Generate learning emphasis report based on project_interest
        learning_emphasis: str | None = None
        if request.project_interest and request.foundation_module_2_complete:
            # Personalized report mapping project interest to track modules
            prompt = _build_personalized_prompt(request)
            try:
                raw = await invoke_llm(
                    prompt,
                    agent_type="career_support",
                    learner_id=request.learner_id,
                )
                learning_emphasis = filter_output(raw)
            except Exception as exc:
                logger.warning(
                    "career_llm_fallback",
                    extra={"error": str(exc), "learner_id": request.learner_id},
                )
                learning_emphasis = filter_output(
                    f"Based on your goal to build '{request.project_interest}', "
                    f"we recommend focusing on the following modules in track "
                    f"{request.track_id}: applied implementation labs, "
                    f"domain-specific case studies, and capstone preparation "
                    f"aligned with your project vision."
                )
            suggested_focus.insert(
                0,
                f"Focus on modules related to: {request.project_interest}",
            )
        else:
            # Generic report based on track and background
            prompt = _build_generic_prompt(request)
            try:
                raw = await invoke_llm(
                    prompt,
                    agent_type="career_support",
                    learner_id=request.learner_id,
                )
                learning_emphasis = filter_output(raw)
            except Exception as exc:
                logger.warning(
                    "career_llm_fallback",
                    extra={"error": str(exc), "learner_id": request.learner_id},
                )
                learning_emphasis = filter_output(
                    f"Based on your track {request.track_id} and "
                    f"{len(request.completed_modules)} completed modules, "
                    f"we recommend a balanced approach across all track modules "
                    f"with emphasis on core competencies and practical labs."
                )

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
            learning_emphasis=learning_emphasis,
            confidence=confidence,
            telemetry=telemetry,
        )

    except PromptInjectionError:
        raise HTTPException(status_code=400, detail="Input rejected: potentially unsafe content detected.")

    except Exception as exc:
        logger.error("career_guidance_failed", extra={"error": str(exc)})
        raise HTTPException(status_code=500, detail="Career guidance failed. Please retry.")
