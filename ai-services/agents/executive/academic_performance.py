"""Academic Performance Insight Agent — aggregated academic quality analytics.

Provides Super Admin-only aggregated academic analytics including performance
gate pass rate trends, remediation patterns, certification throughput, and
cross-track comparisons.

Endpoints:
    GET /ai/executive/academic-analytics  — Aggregated academic performance analytics

Requirements: 21.29
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

router = APIRouter(prefix="/ai/executive", tags=["executive-academic"])


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------


class GatePassRateTrend(BaseModel):
    """Performance gate pass rate trend for a track."""

    track_id: str
    track_name: str
    level: str = Field(description="beginner | intermediate | advanced")
    pass_rate: float = Field(ge=0, le=1)
    trend: str = Field(description="improving | stable | declining")
    average_attempts: float = Field(ge=1)


class RemediationPattern(BaseModel):
    """Remediation pattern analysis."""

    module_id: str
    module_title: str
    track_id: str
    remediation_rate: float = Field(ge=0, le=1)
    common_failure_areas: list[str]
    average_remediation_time_days: float = Field(ge=0)


class CertificationThroughput(BaseModel):
    """Certification throughput metrics per track."""

    track_id: str
    track_name: str
    enrolled_count: int = Field(ge=0)
    certified_count: int = Field(ge=0)
    throughput_rate: float = Field(ge=0, le=1)
    average_time_to_cert_weeks: float = Field(ge=0)


class CrossTrackComparison(BaseModel):
    """Cross-track performance comparison."""

    track_id: str
    track_name: str
    average_score: float = Field(ge=0, le=1)
    completion_rate: float = Field(ge=0, le=1)
    dropout_rate: float = Field(ge=0, le=1)
    satisfaction_score: float = Field(ge=0, le=1)


class AcademicAnalyticsResponse(BaseModel):
    """Response body for academic performance analytics."""

    gate_pass_rate_trends: list[GatePassRateTrend]
    remediation_patterns: list[RemediationPattern]
    certification_throughput: list[CertificationThroughput]
    cross_track_comparisons: list[CrossTrackComparison]
    executive_summary: str
    confidence: float = Field(ge=0, le=1)
    aqr_record_id: str
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.get(
    "/academic-analytics",
    response_model=AcademicAnalyticsResponse,
)
async def get_academic_analytics(
    x_user_role: str | None = Header(None),
    x_user_id: str | None = Header(None),
) -> AcademicAnalyticsResponse:
    """Aggregated academic quality analytics: gate pass rates, remediation
    patterns, certification throughput, and cross-track comparisons.

    Restricted to Super Admin role only. All queries logged with AQR-* records.
    """
    start_time = time.time()

    _require_super_admin(x_user_role)

    aqr_id = _log_query(
        user_id=x_user_id,
        query_type="academic_analytics",
        query_params={},
    )

    logger.info("academic_analytics_start", extra={"aqr_id": aqr_id})

    try:
        # Stub data — production integrates real backend analytics
        gate_trends = [
            GatePassRateTrend(
                track_id="TRK-ai-eng-001",
                track_name="AI Engineering and Intelligent Systems",
                level="beginner",
                pass_rate=0.88,
                trend="stable",
                average_attempts=1.2,
            ),
            GatePassRateTrend(
                track_id="TRK-ai-eng-001",
                track_name="AI Engineering and Intelligent Systems",
                level="intermediate",
                pass_rate=0.72,
                trend="improving",
                average_attempts=1.5,
            ),
            GatePassRateTrend(
                track_id="TRK-ai-eng-001",
                track_name="AI Engineering and Intelligent Systems",
                level="advanced",
                pass_rate=0.60,
                trend="declining",
                average_attempts=1.8,
            ),
            GatePassRateTrend(
                track_id="TRK-ds-001",
                track_name="Data Science and Decision Intelligence",
                level="beginner",
                pass_rate=0.90,
                trend="stable",
                average_attempts=1.1,
            ),
        ]

        remediation = [
            RemediationPattern(
                module_id="MOD-dl003",
                module_title="Deep Learning Architectures",
                track_id="TRK-ai-eng-001",
                remediation_rate=0.35,
                common_failure_areas=[
                    "Backpropagation mechanics",
                    "CNN architecture design",
                    "Transfer learning application",
                ],
                average_remediation_time_days=14.0,
            ),
            RemediationPattern(
                module_id="MOD-stats02",
                module_title="Advanced Statistical Methods",
                track_id="TRK-ds-001",
                remediation_rate=0.28,
                common_failure_areas=[
                    "Bayesian inference",
                    "Hypothesis testing interpretation",
                ],
                average_remediation_time_days=10.0,
            ),
        ]

        cert_throughput = [
            CertificationThroughput(
                track_id="TRK-ai-eng-001",
                track_name="AI Engineering and Intelligent Systems",
                enrolled_count=120,
                certified_count=45,
                throughput_rate=0.375,
                average_time_to_cert_weeks=36.0,
            ),
            CertificationThroughput(
                track_id="TRK-ds-001",
                track_name="Data Science and Decision Intelligence",
                enrolled_count=95,
                certified_count=40,
                throughput_rate=0.421,
                average_time_to_cert_weeks=32.0,
            ),
            CertificationThroughput(
                track_id="TRK-cyber-001",
                track_name="Cybersecurity and AI Security",
                enrolled_count=60,
                certified_count=18,
                throughput_rate=0.300,
                average_time_to_cert_weeks=40.0,
            ),
            CertificationThroughput(
                track_id="TRK-prod-001",
                track_name="AI Product and Project Leadership",
                enrolled_count=45,
                certified_count=20,
                throughput_rate=0.444,
                average_time_to_cert_weeks=28.0,
            ),
        ]

        cross_track = [
            CrossTrackComparison(
                track_id="TRK-ai-eng-001",
                track_name="AI Engineering and Intelligent Systems",
                average_score=0.74,
                completion_rate=0.65,
                dropout_rate=0.18,
                satisfaction_score=0.82,
            ),
            CrossTrackComparison(
                track_id="TRK-ds-001",
                track_name="Data Science and Decision Intelligence",
                average_score=0.78,
                completion_rate=0.70,
                dropout_rate=0.15,
                satisfaction_score=0.85,
            ),
            CrossTrackComparison(
                track_id="TRK-cyber-001",
                track_name="Cybersecurity and AI Security",
                average_score=0.71,
                completion_rate=0.58,
                dropout_rate=0.22,
                satisfaction_score=0.79,
            ),
            CrossTrackComparison(
                track_id="TRK-prod-001",
                track_name="AI Product and Project Leadership",
                average_score=0.80,
                completion_rate=0.72,
                dropout_rate=0.12,
                satisfaction_score=0.88,
            ),
        ]

        executive_summary = filter_output(
            "Overall academic performance is stable with improving trends in "
            "intermediate-level gate pass rates. Deep Learning Architectures "
            "and Advanced Statistical Methods modules show highest remediation "
            "rates and may benefit from supplementary content. AI Product and "
            "Project Leadership track leads in certification throughput and "
            "learner satisfaction. Cybersecurity track shows highest dropout "
            "rate — recommend targeted intervention."
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "academic_analytics",
            "status": "completed",
            "duration_ms": duration_ms,
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
            "langsmith_project": settings.langsmith_project,
        }

        logger.info("academic_analytics_completed", extra=telemetry)

        return AcademicAnalyticsResponse(
            gate_pass_rate_trends=gate_trends,
            remediation_patterns=remediation,
            certification_throughput=cert_throughput,
            cross_track_comparisons=cross_track,
            executive_summary=executive_summary,
            confidence=0.80,
            aqr_record_id=aqr_id,
            telemetry=telemetry,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("academic_analytics_failed", extra={"error": str(exc)})
        raise HTTPException(
            status_code=500,
            detail="Academic analytics failed. Please retry.",
        )
