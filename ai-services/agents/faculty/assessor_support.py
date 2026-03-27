"""Assessor Support Agent — review queue prioritization and pod health.

Assists assessors with submission review prioritization and pod health
monitoring including collaboration frequency and contribution balance.

Endpoints:
    GET /ai/faculty/review-queue/{USR-*}  — Prioritized review queue
    GET /ai/faculty/pod-health/{POD-*}    — Pod health indicators

Requirements: 21.12, 21.13
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

router = APIRouter(prefix="/ai/faculty", tags=["faculty-assessor"])


# ---------------------------------------------------------------------------
# Review Queue models
# ---------------------------------------------------------------------------


class ReviewItem(BaseModel):
    """A single submission in the prioritized review queue."""

    submission_id: str
    learner_id: str
    assessment_title: str
    submitted_at: str
    age_hours: float = Field(ge=0)
    learner_risk_level: str = Field(description="low | medium | high | critical")
    deadline_proximity: str = Field(description="overdue | urgent | normal | distant")
    priority_score: float = Field(ge=0, le=1, description="Higher = more urgent")


class ReviewQueueResponse(BaseModel):
    """Response body for prioritized review queue."""

    assessor_id: str
    queue_size: int
    items: list[ReviewItem]
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Pod Health models
# ---------------------------------------------------------------------------


class MemberContribution(BaseModel):
    """Contribution metrics for a single pod member."""

    learner_id: str
    role: str
    contribution_score: float = Field(ge=0, le=1)
    messages_sent: int = Field(ge=0)
    deliverables_submitted: int = Field(ge=0)
    last_active: str


class PodHealthResponse(BaseModel):
    """Response body for pod health indicators."""

    pod_id: str
    collaboration_frequency: float = Field(
        ge=0, description="Average interactions per member per week"
    )
    contribution_balance: float = Field(
        ge=0, le=1, description="1.0 = perfectly balanced, 0.0 = one member dominates"
    )
    health_status: str = Field(description="healthy | at_risk | dysfunctional")
    early_warnings: list[str]
    member_contributions: list[MemberContribution]
    recommendation: str
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Priority computation
# ---------------------------------------------------------------------------


def compute_priority_score(
    age_hours: float,
    risk_level: str,
    deadline_proximity: str,
) -> float:
    """Compute review priority from submission age, learner risk, and deadline.

    Weights: age (30%), risk (40%), deadline (30%).
    Returns a score between 0 (low priority) and 1 (highest priority).
    """
    # Age factor: older submissions get higher priority (cap at 168h = 1 week)
    age_factor = min(age_hours / 168.0, 1.0)

    # Risk factor
    risk_map = {"critical": 1.0, "high": 0.75, "medium": 0.4, "low": 0.1}
    risk_factor = risk_map.get(risk_level, 0.2)

    # Deadline factor
    deadline_map = {"overdue": 1.0, "urgent": 0.8, "normal": 0.3, "distant": 0.1}
    deadline_factor = deadline_map.get(deadline_proximity, 0.2)

    score = 0.30 * age_factor + 0.40 * risk_factor + 0.30 * deadline_factor
    return round(min(1.0, max(0.0, score)), 4)


def compute_contribution_balance(contributions: list[float]) -> float:
    """Compute contribution balance across pod members.

    Uses coefficient of variation inverted to 0-1 scale.
    1.0 = perfectly balanced, 0.0 = maximally imbalanced.
    """
    if not contributions or len(contributions) < 2:
        return 1.0

    mean = sum(contributions) / len(contributions)
    if mean == 0:
        return 1.0

    variance = sum((c - mean) ** 2 for c in contributions) / len(contributions)
    std_dev = variance ** 0.5
    cv = std_dev / mean

    # Invert: low CV = high balance
    return round(max(0.0, min(1.0, 1.0 - cv)), 4)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/review-queue/{assessor_id}", response_model=ReviewQueueResponse)
async def get_review_queue(assessor_id: str) -> ReviewQueueResponse:
    """Prioritize submission review queue by age, learner risk, and deadlines."""
    start_time = time.time()

    if not assessor_id.startswith("USR-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid assessor ID format. Expected USR-*.",
        )

    logger.info("review_queue_start", extra={"assessor_id": assessor_id})

    try:
        # Stub review items — real integration calls backend API
        raw_items = [
            {
                "submission_id": "SUB-old001",
                "learner_id": "LRN-risk01",
                "assessment_title": "Module 3 Assessment",
                "submitted_at": "2025-01-10T08:00:00Z",
                "age_hours": 120.0,
                "learner_risk_level": "high",
                "deadline_proximity": "overdue",
            },
            {
                "submission_id": "SUB-new002",
                "learner_id": "LRN-safe01",
                "assessment_title": "Module 1 Quiz",
                "submitted_at": "2025-01-14T14:00:00Z",
                "age_hours": 12.0,
                "learner_risk_level": "low",
                "deadline_proximity": "distant",
            },
            {
                "submission_id": "SUB-mid003",
                "learner_id": "LRN-med01",
                "assessment_title": "Module 2 Lab Report",
                "submitted_at": "2025-01-12T10:00:00Z",
                "age_hours": 60.0,
                "learner_risk_level": "medium",
                "deadline_proximity": "urgent",
            },
        ]

        items = []
        for raw in raw_items:
            priority = compute_priority_score(
                age_hours=raw["age_hours"],
                risk_level=raw["learner_risk_level"],
                deadline_proximity=raw["deadline_proximity"],
            )
            items.append(
                ReviewItem(
                    submission_id=raw["submission_id"],
                    learner_id=raw["learner_id"],
                    assessment_title=raw["assessment_title"],
                    submitted_at=raw["submitted_at"],
                    age_hours=raw["age_hours"],
                    learner_risk_level=raw["learner_risk_level"],
                    deadline_proximity=raw["deadline_proximity"],
                    priority_score=priority,
                )
            )

        # Sort by priority descending (highest priority first)
        items.sort(key=lambda x: x.priority_score, reverse=True)

        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "review_queue",
            "status": "completed",
            "duration_ms": duration_ms,
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
        }

        logger.info("review_queue_completed", extra=telemetry)

        return ReviewQueueResponse(
            assessor_id=assessor_id,
            queue_size=len(items),
            items=items,
            telemetry=telemetry,
        )

    except HTTPException:
        raise

    except Exception as exc:
        logger.error("review_queue_failed", extra={"error": str(exc)})
        raise HTTPException(
            status_code=500,
            detail="Review queue generation failed. Please retry.",
        )


@router.get("/pod-health/{pod_id}", response_model=PodHealthResponse)
async def get_pod_health(pod_id: str) -> PodHealthResponse:
    """Pod health indicators: collaboration frequency, contribution balance, early warnings."""
    start_time = time.time()

    if not pod_id.startswith("POD-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid pod ID format. Expected POD-*.",
        )

    logger.info("pod_health_start", extra={"pod_id": pod_id})

    try:
        # Stub member contributions — real integration calls backend API
        members = [
            MemberContribution(
                learner_id="LRN-pm001",
                role="Product Manager",
                contribution_score=0.85,
                messages_sent=42,
                deliverables_submitted=5,
                last_active="2025-01-14T16:00:00Z",
            ),
            MemberContribution(
                learner_id="LRN-ds001",
                role="Data Scientist",
                contribution_score=0.72,
                messages_sent=35,
                deliverables_submitted=4,
                last_active="2025-01-14T12:00:00Z",
            ),
            MemberContribution(
                learner_id="LRN-ai001",
                role="AI Engineer",
                contribution_score=0.90,
                messages_sent=50,
                deliverables_submitted=6,
                last_active="2025-01-14T18:00:00Z",
            ),
            MemberContribution(
                learner_id="LRN-sec01",
                role="Cybersecurity Specialist",
                contribution_score=0.30,
                messages_sent=8,
                deliverables_submitted=1,
                last_active="2025-01-10T09:00:00Z",
            ),
        ]

        scores = [m.contribution_score for m in members]
        balance = compute_contribution_balance(scores)
        collab_freq = sum(m.messages_sent for m in members) / max(len(members), 1)

        # Early warnings
        early_warnings: list[str] = []
        for m in members:
            if m.contribution_score < 0.4:
                early_warnings.append(
                    f"{m.learner_id} ({m.role}) has low contribution "
                    f"(score: {m.contribution_score})"
                )

        # Health status
        if balance < 0.4 or any(m.contribution_score < 0.3 for m in members):
            health_status = "dysfunctional"
        elif balance < 0.7 or early_warnings:
            health_status = "at_risk"
        else:
            health_status = "healthy"

        recommendation = filter_output(
            f"Pod {pod_id} health: {health_status}. "
            f"Contribution balance: {balance:.0%}. "
            + (
                "Consider scheduling a pod check-in to address imbalanced contributions."
                if health_status != "healthy"
                else "Pod is functioning well. Continue monitoring."
            )
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "pod_health",
            "status": "completed",
            "duration_ms": duration_ms,
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
        }

        logger.info("pod_health_completed", extra=telemetry)

        return PodHealthResponse(
            pod_id=pod_id,
            collaboration_frequency=round(collab_freq, 2),
            contribution_balance=balance,
            health_status=health_status,
            early_warnings=early_warnings,
            member_contributions=members,
            recommendation=recommendation,
            telemetry=telemetry,
        )

    except HTTPException:
        raise

    except Exception as exc:
        logger.error("pod_health_failed", extra={"error": str(exc)})
        raise HTTPException(
            status_code=500,
            detail="Pod health analysis failed. Please retry.",
        )
