"""Instructor Insight Agent — cohort analytics and content effectiveness.

Provides instructors with analytics on cohort performance patterns,
content engagement metrics, and identification of struggle modules.

Endpoints:
    GET /ai/faculty/cohort-analytics/{ENR-*}  — Cohort performance analytics

Requirements: 21.11
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from agents.learner.guardrails import filter_output
from config import settings

logger = logging.getLogger("ai_services")

router = APIRouter(prefix="/ai/faculty", tags=["faculty-insight"])


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class ModuleEngagement(BaseModel):
    """Engagement metrics for a single module."""

    module_id: str
    title: str
    completion_rate: float = Field(ge=0, le=1)
    average_score: float = Field(ge=0, le=1)
    average_time_minutes: float = Field(ge=0)
    drop_off_rate: float = Field(ge=0, le=1)


class StruggleModule(BaseModel):
    """A module identified as a struggle point for the cohort."""

    module_id: str
    title: str
    reason: str
    severity: str = Field(description="high | medium | low")
    recommendation: str


class CohortAnalyticsResponse(BaseModel):
    """Response body for cohort performance analytics."""

    enrollment_id: str
    cohort_size: int
    overall_completion_rate: float = Field(ge=0, le=1)
    average_cohort_score: float = Field(ge=0, le=1)
    content_engagement: list[ModuleEngagement]
    struggle_modules: list[StruggleModule]
    performance_trend: str = Field(description="improving | stable | declining")
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.get(
    "/cohort-analytics/{enrollment_id}",
    response_model=CohortAnalyticsResponse,
)
async def get_cohort_analytics(enrollment_id: str) -> CohortAnalyticsResponse:
    """Cohort performance patterns, content engagement metrics, struggle modules.

    Analyzes cohort-level data for the given enrollment to surface
    performance patterns, content engagement, and modules where learners
    are struggling.
    """
    start_time = time.time()

    if not enrollment_id.startswith("ENR-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid enrollment ID format. Expected ENR-*.",
        )

    logger.info(
        "cohort_analytics_start",
        extra={"enrollment_id": enrollment_id},
    )

    try:
        # Stub analytics — real integration calls backend API for cohort data
        content_engagement = [
            ModuleEngagement(
                module_id="MOD-intro01",
                title="Introduction to AI Fundamentals",
                completion_rate=0.92,
                average_score=0.78,
                average_time_minutes=45.0,
                drop_off_rate=0.08,
            ),
            ModuleEngagement(
                module_id="MOD-ml002",
                title="Machine Learning Foundations",
                completion_rate=0.75,
                average_score=0.62,
                average_time_minutes=90.0,
                drop_off_rate=0.18,
            ),
            ModuleEngagement(
                module_id="MOD-dl003",
                title="Deep Learning Architectures",
                completion_rate=0.58,
                average_score=0.55,
                average_time_minutes=120.0,
                drop_off_rate=0.30,
            ),
        ]

        struggle_modules = [
            StruggleModule(
                module_id="MOD-dl003",
                title="Deep Learning Architectures",
                reason="High drop-off rate and below-average scores",
                severity="high",
                recommendation=filter_output(
                    "Consider adding supplementary materials and "
                    "scheduling additional lab sessions for this module."
                ),
            ),
        ]

        overall_completion = sum(
            m.completion_rate for m in content_engagement
        ) / max(len(content_engagement), 1)
        average_score = sum(
            m.average_score for m in content_engagement
        ) / max(len(content_engagement), 1)

        trend = (
            "declining"
            if content_engagement[-1].completion_rate < content_engagement[0].completion_rate - 0.2
            else "stable"
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "cohort_analytics",
            "status": "completed",
            "duration_ms": duration_ms,
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
        }

        logger.info("cohort_analytics_completed", extra=telemetry)

        return CohortAnalyticsResponse(
            enrollment_id=enrollment_id,
            cohort_size=24,
            overall_completion_rate=round(overall_completion, 4),
            average_cohort_score=round(average_score, 4),
            content_engagement=content_engagement,
            struggle_modules=struggle_modules,
            performance_trend=trend,
            telemetry=telemetry,
        )

    except HTTPException:
        raise

    except Exception as exc:
        logger.error("cohort_analytics_failed", extra={"error": str(exc)})
        raise HTTPException(
            status_code=500,
            detail="Cohort analytics failed. Please retry.",
        )
