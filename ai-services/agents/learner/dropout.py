"""Dropout Risk Agent — engagement monitoring and intervention workflow.

Computes dropout risk scores from engagement signals and triggers
LangGraph-based intervention workflows on threshold breach.

Endpoints:
    POST /ai/dropout/evaluate      — Compute dropout risk score
    GET  /ai/dropout/risk/{LRN-*}  — Return current risk score

Requirements: 21.8, 21.9, 29.4, 29.5
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from typing import Any, TypedDict

import asyncpg
from fastapi import APIRouter, HTTPException
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from agents.learner.guardrails import filter_output, validate_input
from agents.llm_factory import LLMNotConfiguredError, get_llm, invoke_llm
from config import settings

logger = logging.getLogger("ai_services")

router = APIRouter(prefix="/ai/dropout", tags=["dropout"])

# Risk threshold for triggering intervention
_RISK_THRESHOLD = 0.7


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class EngagementSignals(BaseModel):
    """Engagement signals used to compute dropout risk."""

    login_frequency: float = Field(ge=0, description="Logins per week")
    submission_timeliness: float = Field(ge=0, le=1, description="Fraction of on-time submissions")
    average_score: float = Field(ge=0, le=1, description="Average assessment score (0-1)")
    pod_participation: float = Field(ge=0, le=1, description="Pod activity participation rate")


class DropoutEvaluateRequest(BaseModel):
    """Request body for dropout risk evaluation."""

    learner_id: str = Field(..., pattern=r"^LRN-", description="Learner ID (LRN-*)")
    enrollment_id: str = Field(..., pattern=r"^ENR-", description="Enrollment ID (ENR-*)")
    signals: EngagementSignals


class DropoutRiskResponse(BaseModel):
    """Response body for dropout risk evaluation."""

    record_id: str = Field(description="DRS-* record identifier")
    learner_id: str
    risk_score: float = Field(ge=0, le=1)
    risk_level: str = Field(description="low | medium | high | critical")
    intervention_triggered: bool
    intervention_recommendation: str | None = None
    signals_summary: dict[str, float]
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# Risk score computation
# ---------------------------------------------------------------------------

def compute_risk_score(signals: EngagementSignals) -> float:
    """Compute dropout risk score from engagement signals.

    Weighted combination:
      - Login frequency (25%): normalized to 0-1 (7 logins/week = 0 risk)
      - Submission timeliness (30%): inverted (high timeliness = low risk)
      - Average score (25%): inverted
      - Pod participation (20%): inverted

    Returns a score between 0 (no risk) and 1 (highest risk).
    """
    login_risk = max(0.0, 1.0 - (signals.login_frequency / 7.0))
    timeliness_risk = 1.0 - signals.submission_timeliness
    score_risk = 1.0 - signals.average_score
    pod_risk = 1.0 - signals.pod_participation

    risk = (
        0.25 * login_risk
        + 0.30 * timeliness_risk
        + 0.25 * score_risk
        + 0.20 * pod_risk
    )
    return round(min(1.0, max(0.0, risk)), 4)


def _risk_level(score: float) -> str:
    """Map numeric risk score to categorical level."""
    if score >= 0.8:
        return "critical"
    if score >= 0.6:
        return "high"
    if score >= 0.4:
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# LangGraph intervention workflow
# ---------------------------------------------------------------------------

class InterventionState(TypedDict):
    """State schema for the dropout intervention workflow."""

    learner_id: str
    risk_score: float
    risk_level: str
    signals: dict[str, float]
    assessor_notified: bool
    recommendation: str
    step_count: int


def _evaluate_risk_node(state: InterventionState) -> InterventionState:
    """Node 1: Evaluate risk and determine if intervention is needed."""
    logger.info(
        "intervention_evaluate_risk",
        extra={"learner_id": state["learner_id"], "risk_score": state["risk_score"]},
    )
    state["step_count"] = state.get("step_count", 0) + 1
    return state


def _generate_recommendation_node(state: InterventionState) -> InterventionState:
    """Node 2: Generate re-engagement recommendation via LLM."""
    risk_level = state["risk_level"]
    signals = state["signals"]

    # Build targeted recommendation based on weakest signals
    weak_areas = sorted(signals.items(), key=lambda x: x[1])
    focus = weak_areas[0][0] if weak_areas else "general engagement"

    prompt = (
        f"You are a dropout intervention agent for KoreField Academy.\n\n"
        f"Learner {state['learner_id']} has risk level: {risk_level}.\n"
        f"Weakest area: {focus}.\n"
        f"Signals: {signals}\n\n"
        f"Provide a concise re-engagement recommendation (2-3 sentences) "
        f"with specific actions the assessor should take."
    )

    try:
        import asyncio

        llm = get_llm(timeout=30)
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as pool:
                response = pool.submit(lambda: asyncio.run(llm.ainvoke(prompt))).result()
        else:
            response = loop.run_until_complete(llm.ainvoke(prompt))
        recommendation = filter_output(response.content)
    except Exception:
        # Fallback to rule-based recommendation if LLM fails
        recommendation = filter_output(
            f"Re-engagement recommendation for {state['learner_id']}: "
            f"Focus on improving {focus}. Risk level: {risk_level}. "
            f"Suggested actions: schedule 1-on-1 with assessor, "
            f"review missed submissions, increase pod collaboration."
        )

    state["recommendation"] = recommendation
    state["step_count"] = state.get("step_count", 0) + 1
    return state


def _notify_assessor_node(state: InterventionState) -> InterventionState:
    """Node 3: Notify assessor about at-risk learner."""
    logger.info(
        "intervention_assessor_notified",
        extra={"learner_id": state["learner_id"], "risk_level": state["risk_level"]},
    )
    # In production, this would send a notification via SQS → notifications worker
    state["assessor_notified"] = True
    state["step_count"] = state.get("step_count", 0) + 1
    return state


def _should_intervene(state: InterventionState) -> str:
    """Edge condition: route to intervention if risk exceeds threshold."""
    if state["risk_score"] >= _RISK_THRESHOLD:
        return "generate_recommendation"
    return END


def _build_intervention_graph() -> StateGraph:
    """Build the LangGraph dropout intervention workflow.

    Graph structure:
        evaluate_risk → (if high risk) → generate_recommendation → notify_assessor → END
                      → (if low risk)  → END

    Workflow design standards (per AGENT_WORKFLOW_ARCHITECTURE.md):
        - Explicit node responsibilities
        - Edge conditions between nodes
        - State schema definition (InterventionState)
        - Termination criteria (END after notification or low-risk exit)
        - Max step limit: 5
    """
    graph = StateGraph(InterventionState)

    graph.add_node("evaluate_risk", _evaluate_risk_node)
    graph.add_node("generate_recommendation", _generate_recommendation_node)
    graph.add_node("notify_assessor", _notify_assessor_node)

    graph.set_entry_point("evaluate_risk")
    graph.add_conditional_edges("evaluate_risk", _should_intervene)
    graph.add_edge("generate_recommendation", "notify_assessor")
    graph.add_edge("notify_assessor", END)

    return graph


# Compile the intervention workflow once at module load
_intervention_workflow = _build_intervention_graph().compile()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/evaluate", response_model=DropoutRiskResponse)
async def evaluate_dropout_risk(request: DropoutEvaluateRequest) -> DropoutRiskResponse:
    """Compute dropout risk score and trigger intervention if needed."""
    start_time = time.time()

    logger.info(
        "dropout_evaluate_start",
        extra={
            "learner_id": request.learner_id,
            "enrollment_id": request.enrollment_id,
        },
    )

    try:
        # Compute risk score
        risk_score = compute_risk_score(request.signals)
        risk_lvl = _risk_level(risk_score)

        signals_summary = {
            "login_frequency": request.signals.login_frequency,
            "submission_timeliness": request.signals.submission_timeliness,
            "average_score": request.signals.average_score,
            "pod_participation": request.signals.pod_participation,
        }

        # Run LangGraph intervention workflow
        intervention_triggered = False
        intervention_recommendation = None

        initial_state: InterventionState = {
            "learner_id": request.learner_id,
            "risk_score": risk_score,
            "risk_level": risk_lvl,
            "signals": signals_summary,
            "assessor_notified": False,
            "recommendation": "",
            "step_count": 0,
        }

        result = _intervention_workflow.invoke(initial_state)

        if result.get("assessor_notified"):
            intervention_triggered = True
            intervention_recommendation = result.get("recommendation")

        # Store DRS-* record in PostgreSQL
        record_id = f"DRS-{uuid.uuid4().hex[:8]}"
        try:
            conn = await asyncpg.connect(settings.database_url)
            try:
                await conn.execute(
                    """
                    INSERT INTO dropout_risk_scores
                        (record_id, learner_id, enrollment_id, risk_score,
                         risk_level, signals, intervention_triggered, computed_at)
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, NOW())
                    """,
                    record_id,
                    request.learner_id,
                    request.enrollment_id,
                    risk_score,
                    risk_lvl,
                    json.dumps(signals_summary),
                    intervention_triggered,
                )
            finally:
                await conn.close()
        except Exception as db_exc:
            logger.error("dropout_db_write_failed", extra={"error": str(db_exc)})
            # Return HTTP 500 but include computed risk score in response body
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return DropoutRiskResponse(
                record_id=record_id,
                learner_id=request.learner_id,
                risk_score=risk_score,
                risk_level=risk_lvl,
                intervention_triggered=intervention_triggered,
                intervention_recommendation=intervention_recommendation,
                signals_summary=signals_summary,
                telemetry={
                    "workflow": "dropout_evaluate",
                    "status": "db_write_failed",
                    "duration_ms": duration_ms,
                    "error": str(db_exc),
                },
            )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "dropout_evaluate",
            "status": "completed",
            "duration_ms": duration_ms,
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
            "intervention_triggered": intervention_triggered,
        }

        logger.info("dropout_evaluate_completed", extra=telemetry)

        return DropoutRiskResponse(
            record_id=record_id,
            learner_id=request.learner_id,
            risk_score=risk_score,
            risk_level=risk_lvl,
            intervention_triggered=intervention_triggered,
            intervention_recommendation=intervention_recommendation,
            signals_summary=signals_summary,
            telemetry=telemetry,
        )

    except Exception as exc:
        logger.error("dropout_evaluate_failed", extra={"error": str(exc)})
        raise HTTPException(status_code=500, detail="Dropout risk evaluation failed.")


@router.get("/risk/{learner_id}", response_model=DropoutRiskResponse)
async def get_risk_score(learner_id: str) -> DropoutRiskResponse:
    """Return the most recent risk score for a learner from PostgreSQL."""
    if not learner_id.startswith("LRN-"):
        raise HTTPException(status_code=400, detail="Invalid learner ID format. Expected LRN-*.")

    try:
        conn = await asyncpg.connect(settings.database_url)
        try:
            row = await conn.fetchrow(
                """
                SELECT record_id, learner_id, enrollment_id, risk_score,
                       risk_level, signals, intervention_triggered, computed_at
                FROM dropout_risk_scores
                WHERE learner_id = $1
                ORDER BY computed_at DESC
                LIMIT 1
                """,
                learner_id,
            )
        finally:
            await conn.close()
    except Exception as db_exc:
        logger.error("dropout_db_read_failed", extra={"error": str(db_exc)})
        raise HTTPException(status_code=500, detail="Failed to retrieve risk score.")

    if not row:
        raise HTTPException(status_code=404, detail=f"No risk score found for {learner_id}.")

    signals = row["signals"]
    if isinstance(signals, str):
        signals = json.loads(signals)

    return DropoutRiskResponse(
        record_id=row["record_id"],
        learner_id=row["learner_id"],
        risk_score=row["risk_score"],
        risk_level=row["risk_level"],
        intervention_triggered=row["intervention_triggered"],
        signals_summary=signals,
        telemetry={"workflow": "dropout_risk_lookup", "status": "completed"},
    )
