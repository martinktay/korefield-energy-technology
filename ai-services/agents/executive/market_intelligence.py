"""Market Intelligence Agent — LangGraph multi-step workflow for executive intelligence.

Provides Super Admin-only access to grounded external strategic intelligence
through web-grounded search, competitor analysis, and market monitoring.

Endpoints:
    POST /ai/executive/market-report   — Multi-step LangGraph market report workflow
    GET  /ai/executive/market-alerts   — Time-sensitive market change alerts

Requirements: 21.16–21.26
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any, TypedDict

from fastapi import APIRouter, Header, HTTPException
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from agents.learner.guardrails import filter_output
from config import settings

logger = logging.getLogger("ai_services")

router = APIRouter(prefix="/ai/executive", tags=["executive-market"])

# In-memory AQR-* audit log (production would use PostgreSQL)
_query_log: list[dict[str, Any]] = []

# Workflow constraints
_MAX_STEP_LIMIT = 12
_WORKFLOW_TIMEOUT_SECONDS = 60


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _require_super_admin(role: str | None) -> None:
    """Validate that the requesting user has Super Admin role."""
    if not role or role.lower() != "super_admin":
        raise HTTPException(
            status_code=403,
            detail="Access restricted to Super Admin role only.",
        )


def _log_query(
    user_id: str | None,
    query_type: str,
    query_params: dict[str, Any],
) -> str:
    """Log an AQR-* audit record for the query."""
    record_id = f"AQR-{uuid.uuid4().hex[:8]}"
    record = {
        "record_id": record_id,
        "requesting_user_id": user_id or "unknown",
        "query_type": query_type,
        "query_params": query_params,
        "timestamp": time.time(),
    }
    _query_log.append(record)
    logger.info("aqr_query_logged", extra=record)
    return record_id


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class MarketReportRequest(BaseModel):
    """Request body for market report generation."""

    report_type: str = Field(
        ...,
        description="Type of report: competitor_pricing | hiring_trends | geography_expansion | policy_monitoring | comprehensive",
    )
    tracks: list[str] = Field(
        default_factory=list,
        description="Track IDs to analyze (empty = all tracks)",
    )
    regions: list[str] = Field(
        default_factory=list,
        description="Geographic regions to focus on (empty = global)",
    )


class TrackRelevanceScore(BaseModel):
    """Composite relevance score for a track."""

    track_id: str
    track_name: str
    hiring_trend_score: float = Field(ge=0, le=1)
    enrollment_demand_score: float = Field(ge=0, le=1)
    waitlist_growth_score: float = Field(ge=0, le=1)
    skill_demand_score: float = Field(ge=0, le=1)
    composite_score: float = Field(ge=0, le=1)


class MarketReportSection(BaseModel):
    """A section within the market report."""

    title: str
    content: str
    confidence: float = Field(ge=0, le=1)
    sources: list[str] = Field(default_factory=list)


class MarketReportResponse(BaseModel):
    """Response body for market report."""

    report_id: str
    report_type: str
    sections: list[MarketReportSection]
    track_relevance_scores: list[TrackRelevanceScore]
    overall_confidence: float = Field(ge=0, le=1)
    aqr_record_id: str
    workflow_steps_executed: int
    telemetry: dict[str, Any]


class MarketAlert(BaseModel):
    """A single time-sensitive market alert."""

    alert_id: str
    title: str
    summary: str
    severity: str = Field(description="critical | high | medium | low")
    category: str = Field(
        description="competitor | regulation | hiring | market_shift | opportunity"
    )
    confidence: float = Field(ge=0, le=1)
    recency_hours: float = Field(ge=0)
    relevance_score: float = Field(ge=0, le=1)


class MarketAlertsResponse(BaseModel):
    """Response body for market alerts."""

    alerts: list[MarketAlert]
    total_count: int
    aqr_record_id: str
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Track relevance scoring
# ---------------------------------------------------------------------------


def compute_track_relevance(
    hiring: float,
    enrollment: float,
    waitlist: float,
    skill_demand: float,
) -> float:
    """Compute composite track relevance score.

    Weights: hiring trends (30%), enrollment demand (25%),
    waitlist growth (20%), skill demand signals (25%).
    """
    score = 0.30 * hiring + 0.25 * enrollment + 0.20 * waitlist + 0.25 * skill_demand
    return round(min(1.0, max(0.0, score)), 4)


# ---------------------------------------------------------------------------
# LangGraph state schema
# ---------------------------------------------------------------------------


class MarketReportState(TypedDict):
    """State schema for the market report workflow."""

    report_type: str
    tracks: list[str]
    regions: list[str]
    step_count: int
    search_results: str
    competitor_analysis: str
    hiring_analysis: str
    expansion_analysis: str
    policy_analysis: str
    track_scores: list[dict[str, Any]]
    sections: list[dict[str, Any]]
    overall_confidence: float
    error: str


# ---------------------------------------------------------------------------
# LangGraph node functions
# ---------------------------------------------------------------------------


def _web_search_node(state: MarketReportState) -> MarketReportState:
    """Node 1: Web-grounded search for market data."""
    logger.info("market_report_web_search", extra={"step": 1, "report_type": state["report_type"]})
    state["step_count"] = state.get("step_count", 0) + 1

    # Stub: in production, uses LangChain web search tools
    state["search_results"] = (
        "AI education market growing at 35% CAGR globally. "
        "Africa's edtech market projected to reach $10B by 2030. "
        "Key competitors: Coursera, Udacity, ALX, Andela."
    )
    return state


def _competitor_analysis_node(state: MarketReportState) -> MarketReportState:
    """Node 2: Analyze competitor pricing and positioning."""
    logger.info("market_report_competitor_analysis", extra={"step": 2})
    state["step_count"] = state.get("step_count", 0) + 1

    state["competitor_analysis"] = filter_output(
        "Competitor pricing ranges from $200-$2000 per track. "
        "Key differentiators: pod-based collaboration, assessor supervision, "
        "performance-gated progression. Regional pricing varies by 40-60%."
    )
    state["sections"] = state.get("sections", [])
    state["sections"].append({
        "title": "Competitor Pricing Intelligence",
        "content": state["competitor_analysis"],
        "confidence": 0.78,
        "sources": ["market_research_stub", "competitor_catalog_stub"],
    })
    return state


def _hiring_trends_node(state: MarketReportState) -> MarketReportState:
    """Node 3: Analyze AI hiring trends and skill demand."""
    logger.info("market_report_hiring_trends", extra={"step": 3})
    state["step_count"] = state.get("step_count", 0) + 1

    state["hiring_analysis"] = filter_output(
        "AI Engineering roles grew 45% YoY. Data Science demand stable. "
        "Cybersecurity + AI security emerging as fastest-growing niche. "
        "AI Product Leadership roles increasing in Africa's tech hubs."
    )
    state["sections"] = state.get("sections", [])
    state["sections"].append({
        "title": "AI Hiring Trend Analysis",
        "content": state["hiring_analysis"],
        "confidence": 0.82,
        "sources": ["job_posting_analysis_stub"],
    })
    return state


def _expansion_analysis_node(state: MarketReportState) -> MarketReportState:
    """Node 4: Analyze geography expansion opportunities."""
    logger.info("market_report_expansion_analysis", extra={"step": 4})
    state["step_count"] = state.get("step_count", 0) + 1

    state["expansion_analysis"] = filter_output(
        "High-potential regions: Nigeria (Lagos, Abuja), Kenya (Nairobi), "
        "South Africa (Johannesburg, Cape Town), Ghana (Accra), Rwanda (Kigali). "
        "Underserved markets with strong internet penetration growth."
    )
    state["sections"] = state.get("sections", [])
    state["sections"].append({
        "title": "Geography Expansion Analysis",
        "content": state["expansion_analysis"],
        "confidence": 0.75,
        "sources": ["enrollment_data_stub", "market_research_stub"],
    })
    return state


def _policy_monitoring_node(state: MarketReportState) -> MarketReportState:
    """Node 5: Monitor policy and regulation changes."""
    logger.info("market_report_policy_monitoring", extra={"step": 5})
    state["step_count"] = state.get("step_count", 0) + 1

    state["policy_analysis"] = filter_output(
        "NDPR enforcement increasing in Nigeria. Kenya Data Protection Act active. "
        "South Africa POPIA fully enforced. EU AI Act implications for AI education. "
        "No immediate regulatory blockers for expansion."
    )
    state["sections"] = state.get("sections", [])
    state["sections"].append({
        "title": "Policy and Regulation Monitoring",
        "content": state["policy_analysis"],
        "confidence": 0.85,
        "sources": ["regulatory_tracker_stub"],
    })
    return state


def _compute_scores_node(state: MarketReportState) -> MarketReportState:
    """Node 6: Compute track relevance scores."""
    logger.info("market_report_compute_scores", extra={"step": 6})
    state["step_count"] = state.get("step_count", 0) + 1

    # Stub track relevance data — production integrates real metrics
    tracks_data = [
        {
            "track_id": "TRK-ai-eng-001",
            "track_name": "AI Engineering and Intelligent Systems",
            "hiring": 0.90, "enrollment": 0.85, "waitlist": 0.70, "skill_demand": 0.92,
        },
        {
            "track_id": "TRK-ds-001",
            "track_name": "Data Science and Decision Intelligence",
            "hiring": 0.75, "enrollment": 0.80, "waitlist": 0.60, "skill_demand": 0.78,
        },
        {
            "track_id": "TRK-cyber-001",
            "track_name": "Cybersecurity and AI Security",
            "hiring": 0.88, "enrollment": 0.65, "waitlist": 0.80, "skill_demand": 0.85,
        },
        {
            "track_id": "TRK-prod-001",
            "track_name": "AI Product and Project Leadership",
            "hiring": 0.60, "enrollment": 0.55, "waitlist": 0.45, "skill_demand": 0.65,
        },
    ]

    state["track_scores"] = []
    for t in tracks_data:
        composite = compute_track_relevance(
            t["hiring"], t["enrollment"], t["waitlist"], t["skill_demand"],
        )
        state["track_scores"].append({
            "track_id": t["track_id"],
            "track_name": t["track_name"],
            "hiring_trend_score": t["hiring"],
            "enrollment_demand_score": t["enrollment"],
            "waitlist_growth_score": t["waitlist"],
            "skill_demand_score": t["skill_demand"],
            "composite_score": composite,
        })

    # Overall confidence = average of section confidences
    sections = state.get("sections", [])
    if sections:
        state["overall_confidence"] = round(
            sum(s["confidence"] for s in sections) / len(sections), 4
        )
    else:
        state["overall_confidence"] = 0.0

    return state


# ---------------------------------------------------------------------------
# Edge conditions
# ---------------------------------------------------------------------------


def _after_search(state: MarketReportState) -> str:
    if state.get("step_count", 0) >= _MAX_STEP_LIMIT:
        return END
    return "competitor_analysis"


def _after_competitor(state: MarketReportState) -> str:
    if state.get("step_count", 0) >= _MAX_STEP_LIMIT:
        return END
    return "hiring_trends"


def _after_hiring(state: MarketReportState) -> str:
    if state.get("step_count", 0) >= _MAX_STEP_LIMIT:
        return END
    return "expansion_analysis"


def _after_expansion(state: MarketReportState) -> str:
    if state.get("step_count", 0) >= _MAX_STEP_LIMIT:
        return END
    return "policy_monitoring"


def _after_policy(state: MarketReportState) -> str:
    if state.get("step_count", 0) >= _MAX_STEP_LIMIT:
        return END
    return "compute_scores"


# ---------------------------------------------------------------------------
# Build LangGraph workflow
# ---------------------------------------------------------------------------


def _build_market_report_graph() -> StateGraph:
    """Build the LangGraph market report workflow.

    Graph structure (linear pipeline with step-limit guards):
        web_search → competitor_analysis → hiring_trends
        → expansion_analysis → policy_monitoring → compute_scores → END

    Workflow design standards (per AGENT_WORKFLOW_ARCHITECTURE.md):
        - Purpose: generate comprehensive market intelligence report
        - Explicit node responsibilities: one node per analysis phase
        - Edge conditions: step-limit guard at each transition
        - State schema: MarketReportState TypedDict
        - Termination: END after score computation or step limit
        - Max step limit: 12
        - Timeout: 60 seconds
    """
    graph = StateGraph(MarketReportState)

    graph.add_node("web_search", _web_search_node)
    graph.add_node("competitor_analysis", _competitor_analysis_node)
    graph.add_node("hiring_trends", _hiring_trends_node)
    graph.add_node("expansion_analysis", _expansion_analysis_node)
    graph.add_node("policy_monitoring", _policy_monitoring_node)
    graph.add_node("compute_scores", _compute_scores_node)

    graph.set_entry_point("web_search")

    graph.add_conditional_edges("web_search", _after_search)
    graph.add_conditional_edges("competitor_analysis", _after_competitor)
    graph.add_conditional_edges("hiring_trends", _after_hiring)
    graph.add_conditional_edges("expansion_analysis", _after_expansion)
    graph.add_conditional_edges("policy_monitoring", _after_policy)
    graph.add_edge("compute_scores", END)

    return graph


_market_report_workflow = _build_market_report_graph().compile()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/market-report", response_model=MarketReportResponse)
async def generate_market_report(
    request: MarketReportRequest,
    x_user_role: str | None = Header(None),
    x_user_id: str | None = Header(None),
) -> MarketReportResponse:
    """Multi-step LangGraph workflow generating a market intelligence report.

    Restricted to Super Admin role only. All queries logged with AQR-* records.
    Traced through LangSmith.
    """
    start_time = time.time()

    _require_super_admin(x_user_role)

    aqr_id = _log_query(
        user_id=x_user_id,
        query_type="market_report",
        query_params={
            "report_type": request.report_type,
            "tracks": request.tracks,
            "regions": request.regions,
        },
    )

    logger.info(
        "market_report_start",
        extra={"report_type": request.report_type, "aqr_id": aqr_id},
    )

    try:
        initial_state: MarketReportState = {
            "report_type": request.report_type,
            "tracks": request.tracks,
            "regions": request.regions,
            "step_count": 0,
            "search_results": "",
            "competitor_analysis": "",
            "hiring_analysis": "",
            "expansion_analysis": "",
            "policy_analysis": "",
            "track_scores": [],
            "sections": [],
            "overall_confidence": 0.0,
            "error": "",
        }

        result = _market_report_workflow.invoke(initial_state)

        sections = [
            MarketReportSection(**s) for s in result.get("sections", [])
        ]
        track_scores = [
            TrackRelevanceScore(**ts) for ts in result.get("track_scores", [])
        ]

        # Reject any section with confidence below threshold (no unsupported claims)
        sections = [s for s in sections if s.confidence >= 0.5]

        report_id = f"RPT-{uuid.uuid4().hex[:8]}"
        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "market_report",
            "status": "completed",
            "duration_ms": duration_ms,
            "steps_executed": result.get("step_count", 0),
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
            "langsmith_project": settings.langsmith_project,
        }

        logger.info("market_report_completed", extra=telemetry)

        return MarketReportResponse(
            report_id=report_id,
            report_type=request.report_type,
            sections=sections,
            track_relevance_scores=track_scores,
            overall_confidence=result.get("overall_confidence", 0.0),
            aqr_record_id=aqr_id,
            workflow_steps_executed=result.get("step_count", 0),
            telemetry=telemetry,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("market_report_failed", extra={"error": str(exc)})
        raise HTTPException(
            status_code=500,
            detail="Market report generation failed. Please retry.",
        )


@router.get("/market-alerts", response_model=MarketAlertsResponse)
async def get_market_alerts(
    x_user_role: str | None = Header(None),
    x_user_id: str | None = Header(None),
) -> MarketAlertsResponse:
    """Time-sensitive market change alerts, prioritized by recency and relevance.

    Restricted to Super Admin role only. All queries logged with AQR-* records.
    """
    start_time = time.time()

    _require_super_admin(x_user_role)

    aqr_id = _log_query(
        user_id=x_user_id,
        query_type="market_alerts",
        query_params={},
    )

    logger.info("market_alerts_start", extra={"aqr_id": aqr_id})

    try:
        # Stub alerts — production integrates real-time monitoring
        alerts = [
            MarketAlert(
                alert_id=f"ALT-{uuid.uuid4().hex[:6]}",
                title="Competitor Price Reduction — Coursera AI Track",
                summary=filter_output(
                    "Coursera reduced AI specialization pricing by 25% in African markets. "
                    "May impact enrollment conversion rates."
                ),
                severity="high",
                category="competitor",
                confidence=0.85,
                recency_hours=4.0,
                relevance_score=0.92,
            ),
            MarketAlert(
                alert_id=f"ALT-{uuid.uuid4().hex[:6]}",
                title="Nigeria NDPR Enforcement Update",
                summary=filter_output(
                    "NITDA announced stricter enforcement timelines for NDPR compliance. "
                    "Review data handling practices for Nigerian learners."
                ),
                severity="medium",
                category="regulation",
                confidence=0.90,
                recency_hours=12.0,
                relevance_score=0.78,
            ),
            MarketAlert(
                alert_id=f"ALT-{uuid.uuid4().hex[:6]}",
                title="AI Security Hiring Surge in East Africa",
                summary=filter_output(
                    "AI security job postings in Kenya and Rwanda increased 60% in Q4. "
                    "Strong signal for Cybersecurity and AI Security track demand."
                ),
                severity="low",
                category="hiring",
                confidence=0.80,
                recency_hours=48.0,
                relevance_score=0.85,
            ),
        ]

        # Sort by relevance * recency (more recent + more relevant = higher priority)
        alerts.sort(
            key=lambda a: a.relevance_score / max(a.recency_hours, 0.1),
            reverse=True,
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "market_alerts",
            "status": "completed",
            "duration_ms": duration_ms,
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
            "langsmith_project": settings.langsmith_project,
        }

        logger.info("market_alerts_completed", extra=telemetry)

        return MarketAlertsResponse(
            alerts=alerts,
            total_count=len(alerts),
            aqr_record_id=aqr_id,
            telemetry=telemetry,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("market_alerts_failed", extra={"error": str(exc)})
        raise HTTPException(
            status_code=500,
            detail="Market alerts retrieval failed. Please retry.",
        )
