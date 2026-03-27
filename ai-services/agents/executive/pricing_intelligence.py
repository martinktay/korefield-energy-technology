"""Pricing Intelligence Agent — market-driven pricing recommendations.

Provides Super Admin-only pricing recommendations based on market benchmarks,
regional purchasing power, enrollment conversion rates, and track demand signals.

Endpoints:
    POST /ai/executive/pricing-recommendation  — Generate pricing recommendation

Requirements: 21.27
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

router = APIRouter(prefix="/ai/executive", tags=["executive-pricing"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class PricingRecommendationRequest(BaseModel):
    """Request body for pricing recommendation."""

    track_id: str = Field(..., pattern=r"^TRK-", description="Track ID (TRK-*)")
    target_region: str = Field(
        ..., description="Target region for pricing analysis"
    )
    current_price_usd: float = Field(ge=0, description="Current price in USD")


class RegionalBenchmark(BaseModel):
    """Pricing benchmark for a specific region."""

    region: str
    average_competitor_price_usd: float = Field(ge=0)
    purchasing_power_index: float = Field(ge=0, le=1)
    recommended_multiplier: float = Field(ge=0)


class PricingRecommendationResponse(BaseModel):
    """Response body for pricing recommendation."""

    track_id: str
    target_region: str
    current_price_usd: float
    recommended_price_usd: float = Field(ge=0)
    price_adjustment_pct: float
    regional_benchmarks: list[RegionalBenchmark]
    enrollment_conversion_estimate: float = Field(ge=0, le=1)
    demand_signal_strength: str = Field(description="strong | moderate | weak")
    confidence: float = Field(ge=0, le=1)
    rationale: str
    aqr_record_id: str
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/pricing-recommendation",
    response_model=PricingRecommendationResponse,
)
async def generate_pricing_recommendation(
    request: PricingRecommendationRequest,
    x_user_role: str | None = Header(None),
    x_user_id: str | None = Header(None),
) -> PricingRecommendationResponse:
    """Analyze market benchmarks, regional purchasing power, enrollment
    conversion rates, and track demand signals to produce a pricing recommendation.

    Restricted to Super Admin role only. All queries logged with AQR-* records.
    """
    start_time = time.time()

    _require_super_admin(x_user_role)

    aqr_id = _log_query(
        user_id=x_user_id,
        query_type="pricing_recommendation",
        query_params={
            "track_id": request.track_id,
            "target_region": request.target_region,
            "current_price_usd": request.current_price_usd,
        },
    )

    logger.info(
        "pricing_recommendation_start",
        extra={"track_id": request.track_id, "region": request.target_region},
    )

    try:
        # Stub regional benchmarks — production integrates real market data
        benchmarks = [
            RegionalBenchmark(
                region="West Africa",
                average_competitor_price_usd=450.0,
                purchasing_power_index=0.35,
                recommended_multiplier=0.55,
            ),
            RegionalBenchmark(
                region="East Africa",
                average_competitor_price_usd=500.0,
                purchasing_power_index=0.40,
                recommended_multiplier=0.60,
            ),
            RegionalBenchmark(
                region="Southern Africa",
                average_competitor_price_usd=650.0,
                purchasing_power_index=0.55,
                recommended_multiplier=0.75,
            ),
        ]

        # Find matching region or use average
        target_benchmark = next(
            (b for b in benchmarks if request.target_region.lower() in b.region.lower()),
            None,
        )
        multiplier = target_benchmark.recommended_multiplier if target_benchmark else 0.60
        recommended_price = round(request.current_price_usd * multiplier, 2)
        adjustment_pct = round(
            ((recommended_price - request.current_price_usd) / max(request.current_price_usd, 0.01)) * 100,
            2,
        )

        # Stub demand signal
        demand_strength = "strong" if multiplier >= 0.7 else ("moderate" if multiplier >= 0.5 else "weak")
        conversion_estimate = round(0.5 + (1.0 - multiplier) * 0.3, 4)

        rationale = filter_output(
            f"Based on regional purchasing power analysis for {request.target_region}, "
            f"competitor pricing benchmarks, and enrollment conversion modeling, "
            f"a {abs(adjustment_pct):.1f}% {'reduction' if adjustment_pct < 0 else 'increase'} "
            f"is recommended to optimize enrollment conversion while maintaining revenue targets."
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "pricing_recommendation",
            "status": "completed",
            "duration_ms": duration_ms,
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
            "langsmith_project": settings.langsmith_project,
        }

        logger.info("pricing_recommendation_completed", extra=telemetry)

        return PricingRecommendationResponse(
            track_id=request.track_id,
            target_region=request.target_region,
            current_price_usd=request.current_price_usd,
            recommended_price_usd=recommended_price,
            price_adjustment_pct=adjustment_pct,
            regional_benchmarks=benchmarks,
            enrollment_conversion_estimate=conversion_estimate,
            demand_signal_strength=demand_strength,
            confidence=0.76,
            rationale=rationale,
            aqr_record_id=aqr_id,
            telemetry=telemetry,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("pricing_recommendation_failed", extra={"error": str(exc)})
        raise HTTPException(
            status_code=500,
            detail="Pricing recommendation failed. Please retry.",
        )
