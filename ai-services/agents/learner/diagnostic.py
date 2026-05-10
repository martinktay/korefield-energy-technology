"""Diagnostic Onboarding Agent - lightweight starting-point recommendation.

Endpoint:
    POST /ai/onboarding/diagnostic
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agents.learner.guardrails import PromptInjectionError, filter_output, validate_input
from agents.llm_factory import LLMNotConfiguredError, invoke_llm
from config import settings

logger = logging.getLogger("ai_services")

router = APIRouter(prefix="/ai/onboarding", tags=["onboarding"])


class DiagnosticAnswer(BaseModel):
    """Single lightweight diagnostic answer."""

    question_id: str = Field(..., min_length=1, max_length=80)
    answer: str = Field(..., min_length=1, max_length=500)


class DiagnosticOnboardingRequest(BaseModel):
    """Request body for AI diagnostic onboarding."""

    learner_id: str = Field(..., pattern=r"^LRN-", description="Learner ID (LRN-*)")
    country: str | None = Field(default=None, max_length=120)
    learner_role: str | None = Field(default=None, max_length=120)
    prior_coding_background: str | None = Field(default=None, max_length=120)
    prior_ai_background: str | None = Field(default=None, max_length=120)
    learning_goals: list[str] = Field(default_factory=list, max_length=5)
    project_interest: str | None = Field(default=None, max_length=500)
    preferred_pace: str | None = Field(default=None, max_length=80)
    diagnostic_answers: list[DiagnosticAnswer] = Field(default_factory=list, max_length=5)


class DiagnosticOnboardingResponse(BaseModel):
    """Structured diagnostic output persisted by the platform backend."""

    learner_id: str
    starting_level: str
    recommended_track: str
    recommended_path: str
    weak_area_tags: list[str]
    rationale: str
    focus_areas: list[str]
    confidence: Literal["high", "medium", "low"]
    source: Literal["ai", "fallback"]
    created_at: str
    telemetry: dict[str, Any]


def _safe_list(values: list[Any], fallback: list[str], limit: int = 5) -> list[str]:
    cleaned = [filter_output(str(value))[:120] for value in values if str(value).strip()]
    return cleaned[:limit] or fallback


def _fallback_result(
    request: DiagnosticOnboardingRequest,
    *,
    start_time: float,
    error: str | None = None,
) -> DiagnosticOnboardingResponse:
    goals = " ".join(request.learning_goals).lower()
    project = (request.project_interest or "").lower()
    background = " ".join([
        request.learner_role or "",
        request.prior_coding_background or "",
        request.prior_ai_background or "",
    ]).lower()
    combined = f"{goals} {project} {background}"

    if any(term in combined for term in ["data", "analytics", "science"]):
        track = "Data Science and Decision Intelligence"
        weak_areas = ["data_reasoning", "ai_foundations"]
    elif any(term in combined for term in ["security", "cyber"]):
        track = "Cybersecurity and AI Security"
        weak_areas = ["security_basics", "ai_foundations"]
    elif any(term in combined for term in ["product", "business", "lead"]):
        track = "AI Product and Project Leadership"
        weak_areas = ["ai_product_fundamentals", "responsible_ai"]
    else:
        track = "AI Engineering and Intelligent Systems"
        weak_areas = ["prompting_basics", "python_foundations"]

    if (request.prior_coding_background or "").lower() in {"advanced", "intermediate"}:
        starting_level = "foundation"
    else:
        starting_level = "beginner"

    duration_ms = round((time.time() - start_time) * 1000, 2)
    telemetry: dict[str, Any] = {
        "workflow": "diagnostic_onboarding",
        "status": "fallback",
        "duration_ms": duration_ms,
        "model": settings.default_model,
        "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
    }
    if error:
        telemetry["error"] = error

    return DiagnosticOnboardingResponse(
        learner_id=request.learner_id,
        starting_level=starting_level,
        recommended_track=track,
        recommended_path="AI Foundation School",
        weak_area_tags=weak_areas,
        rationale=(
            "Based on your answers, Foundation School is the safest starting point "
            "before moving into a specialized track."
        ),
        focus_areas=["AI basics", "Practical problem framing", "Responsible AI habits"],
        confidence="medium",
        source="fallback",
        created_at=datetime.now(timezone.utc).isoformat(),
        telemetry=telemetry,
    )


def _build_prompt(request: DiagnosticOnboardingRequest) -> str:
    answers = [
        {"question_id": answer.question_id, "answer": answer.answer}
        for answer in request.diagnostic_answers
    ]
    payload = {
        "country": request.country,
        "learner_role": request.learner_role,
        "prior_coding_background": request.prior_coding_background,
        "prior_ai_background": request.prior_ai_background,
        "learning_goals": request.learning_goals,
        "project_interest": request.project_interest,
        "preferred_pace": request.preferred_pace,
        "diagnostic_answers": answers,
    }
    return (
        "You are KoreField Academy's diagnostic onboarding assistant. "
        "Recommend a safe starting point for a practical AI learner. "
        "Do not make high-stakes claims about employability or certification. "
        "Respond only as compact JSON with keys: starting_level, recommended_track, "
        "recommended_path, weak_area_tags, rationale, focus_areas, confidence. "
        "Use confidence high, medium, or low.\n\n"
        f"Learner signals:\n{json.dumps(payload, ensure_ascii=True)}"
    )


def _validate_request_text(request: DiagnosticOnboardingRequest) -> None:
    fields = [
        request.country,
        request.learner_role,
        request.prior_coding_background,
        request.prior_ai_background,
        request.project_interest,
        request.preferred_pace,
        *request.learning_goals,
        *(answer.answer for answer in request.diagnostic_answers),
    ]
    for value in fields:
        if value:
            validate_input(value)


@router.post("/diagnostic", response_model=DiagnosticOnboardingResponse)
async def diagnostic_onboarding(
    request: DiagnosticOnboardingRequest,
) -> DiagnosticOnboardingResponse:
    """Generate a lightweight diagnostic recommendation with safe fallback."""
    start_time = time.time()
    logger.info(
        "diagnostic_onboarding_start",
        extra={"learner_id": request.learner_id},
    )

    try:
        _validate_request_text(request)
    except PromptInjectionError:
        raise HTTPException(status_code=400, detail="Input rejected: potentially unsafe content detected.")

    prompt = _build_prompt(request)

    try:
        raw_text = await invoke_llm(
            prompt,
            timeout=20,
            agent_type="diagnostic_onboarding",
            learner_id=request.learner_id,
            learner_tier="foundation",
        )
    except LLMNotConfiguredError:
        return _fallback_result(request, start_time=start_time, error="llm_not_configured")
    except Exception as exc:
        logger.warning(
            "diagnostic_onboarding_fallback",
            extra={"learner_id": request.learner_id, "error": str(exc)},
        )
        return _fallback_result(request, start_time=start_time, error=str(exc))

    try:
        parsed = json.loads(raw_text)
    except (ValueError, TypeError):
        return _fallback_result(request, start_time=start_time, error="invalid_llm_json")

    duration_ms = round((time.time() - start_time) * 1000, 2)
    telemetry = {
        "workflow": "diagnostic_onboarding",
        "status": "completed",
        "duration_ms": duration_ms,
        "model": "gpt-4o-mini",
        "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
    }

    return DiagnosticOnboardingResponse(
        learner_id=request.learner_id,
        starting_level=filter_output(str(parsed.get("starting_level", "beginner")))[:80],
        recommended_track=filter_output(str(parsed.get("recommended_track", "AI Engineering and Intelligent Systems")))[:160],
        recommended_path=filter_output(str(parsed.get("recommended_path", "AI Foundation School")))[:160],
        weak_area_tags=_safe_list(parsed.get("weak_area_tags", []), ["ai_foundations"]),
        rationale=filter_output(str(parsed.get("rationale", "Foundation School is the safest starting point.")))[:800],
        focus_areas=_safe_list(parsed.get("focus_areas", []), ["AI basics"]),
        confidence=parsed.get("confidence") if parsed.get("confidence") in {"high", "medium", "low"} else "medium",
        source="ai",
        created_at=datetime.now(timezone.utc).isoformat(),
        telemetry=telemetry,
    )
