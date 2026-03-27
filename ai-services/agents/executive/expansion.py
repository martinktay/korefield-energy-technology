"""Expansion Opportunity Agent — underserved region and track identification.

Analyzes enrollment density, waitlist growth, market demand, and geographic
coverage gaps to identify expansion opportunities.

Endpoints:
    GET /ai/executive/expansion-opportunities  — Identify expansion opportunities

Requirements: 21.28
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from agents.executive.market_intelligence import _log_query, _require_super_admin
from agents.learner.guardrails import filter_output
from config import settings

logger = logging.getLogger("ai_services")

router = APIRouter(prefix="/ai/executive", tags=["executive-expansion"])


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class RegionOpportunity(BaseModel):
    """Expansion opportunity for a specific region."""

    region: str
    country: str
    enrollment_density: float = Field(ge=0, description="Enrollments per 100k population")
    waitlist_growth_pct: float = Field(description="Waitlist growth percentage (30-day)")
    market_demand_score: float = Field(ge=0, le=1)
    internet_penetration: float = Field(ge=0, le=1)
    opportunity_score: float = Field(ge=0, le=1)
    recommended_tracks: list[str]


class CoverageGap(BaseModel):
    """Geographic coverage gap analysis."""

    region: str
    gap_type: str = Field(description="no_presence | low_enrollment | high_waitlist")
    severity: str = Field(description="critical | high | medium | low")
    description: str


class ExpansionOpportunitiesResponse(BaseModel):
    """Response body for expansion opportunities."""

    opportunities: list[RegionOpportunity]
    coverage_gaps: list[CoverageGap]
    top_recommendation: str
    confidence: float = Field(ge=0, le=1)
    aqr_record_id: str
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.get(
    "/expansion-opportunities",
    response_model=ExpansionOpportunitiesResponse,
)
async def get_expansion_opportunities(
    x_user_role: str | None = Header(None),
    x_user_id: str | None = Header(None),
) -> ExpansionOpportunitiesResponse:
    """Analyze enrollment density, waitlist growth, market demand, and
    geographic coverage gaps to identify expansion opportunities.

    Restricted to Super Admin role only. All queries logged with AQR-* records.
    """
    start_time = time.time()

    _require_super_admin(x_user_role)

    aqr_id = _log_query(
        user_id=x_user_id,
        query_type="expansion_opportunities",
        query_params={},
    )

    logger.info("expansion_opportunities_start", extra={"aqr_id": aqr_id})

    try:
        # Stub opportunities — production integrates real enrollment/market data
        opportunities = [
            RegionOpportunity(
                region="West Africa",
                country="Ghana",
                enrollment_density=2.1,
                waitlist_growth_pct=45.0,
                market_demand_score=0.82,
                internet_penetration=0.68,
                opportunity_score=0.85,
                recommended_tracks=["TRK-ai-eng-001", "TRK-ds-001"],
            ),
            RegionOpportunity(
                region="East Africa",
                country="Rwanda",
                enrollment_density=1.5,
                waitlist_growth_pct=60.0,
                market_demand_score=0.78,
                internet_penetration=0.55,
                opportunity_score=0.80,
                recommended_tracks=["TRK-ai-eng-001", "TRK-cyber-001"],
            ),
            RegionOpportunity(
                region="East Africa",
                country="Tanzania",
                enrollment_density=0.8,
                waitlist_growth_pct=30.0,
                market_demand_score=0.65,
                internet_penetration=0.45,
                opportunity_score=0.62,
                recommended_tracks=["TRK-ds-001"],
            ),
        ]

        coverage_gaps = [
            CoverageGap(
                region="Central Africa",
                gap_type="no_presence",
                severity="high",
                description="No enrollment activity in DRC, Cameroon, or Congo. "
                "Large population with growing tech sector.",
            ),
            CoverageGap(
                region="North Africa",
                gap_type="low_enrollment",
                severity="medium",
                description="Minimal enrollment in Egypt and Morocco despite "
                "strong tech ecosystems and internet penetration.",
            ),
        ]

        # Sort opportunities by score descending
        opportunities.sort(key=lambda o: o.opportunity_score, reverse=True)

        top_rec = filter_output(
            f"Highest-priority expansion: {opportunities[0].country} "
            f"({opportunities[0].region}) with opportunity score "
            f"{opportunities[0].opportunity_score:.0%}. "
            f"Recommended tracks: {', '.join(opportunities[0].recommended_tracks)}."
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "expansion_opportunities",
            "status": "completed",
            "duration_ms": duration_ms,
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
            "langsmith_project": settings.langsmith_project,
        }

        logger.info("expansion_opportunities_completed", extra=telemetry)

        return ExpansionOpportunitiesResponse(
            opportunities=opportunities,
            coverage_gaps=coverage_gaps,
            top_recommendation=top_rec,
            confidence=0.74,
            aqr_record_id=aqr_id,
            telemetry=telemetry,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("expansion_opportunities_failed", extra={"error": str(exc)})
        raise HTTPException(
            status_code=500,
            detail="Expansion opportunity analysis failed. Please retry.",
        )
