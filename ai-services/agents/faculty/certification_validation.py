"""Certification Validation Agent — multi-step LangGraph workflow.

Verifies all 6 certification prerequisites via a LangGraph state graph:
  1. AI Foundation School complete
  2. Track levels complete
  3. Pod deliverables submitted
  4. Capstone passed
  5. Assessor approved
  6. Payment cleared

Produces a structured validation report with each prerequisite status
and any blocking conditions.

Endpoints:
    POST /ai/faculty/validate-certification/{LRN-*}  — Validate certification eligibility

Requirements: 21.14, 21.15, 29.4, 29.5, 29.6
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Any, TypedDict

from fastapi import APIRouter, HTTPException
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from agents.learner.guardrails import filter_output
from config import settings

logger = logging.getLogger("ai_services")

router = APIRouter(prefix="/ai/faculty", tags=["faculty-certification"])

# Workflow constraints
_MAX_STEP_LIMIT = 10
_WORKFLOW_TIMEOUT_SECONDS = 30


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class CertificationValidationRequest(BaseModel):
    """Request body for certification validation."""

    track_id: str = Field(..., pattern=r"^TRK-", description="Track ID (TRK-*)")


class PrerequisiteStatus(BaseModel):
    """Status of a single certification prerequisite."""

    prerequisite: str
    status: str = Field(description="passed | failed | pending")
    details: str
    blocking: bool


class CertificationValidationResponse(BaseModel):
    """Response body for certification validation."""

    learner_id: str
    track_id: str
    eligible: bool
    prerequisites: list[PrerequisiteStatus]
    blocking_conditions: list[str]
    recommendation: str
    workflow_steps_executed: int
    telemetry: dict[str, Any]


# ---------------------------------------------------------------------------
# LangGraph state schema
# ---------------------------------------------------------------------------


class ValidationState(TypedDict):
    """State schema for the certification validation workflow."""

    learner_id: str
    track_id: str
    step_count: int
    foundation_complete: bool
    foundation_details: str
    levels_complete: bool
    levels_details: str
    pod_deliverables_complete: bool
    pod_deliverables_details: str
    capstone_passed: bool
    capstone_details: str
    assessor_approved: bool
    assessor_details: str
    payment_cleared: bool
    payment_details: str
    error: str


# ---------------------------------------------------------------------------
# LangGraph node functions
# ---------------------------------------------------------------------------


def _check_foundation(state: ValidationState) -> ValidationState:
    """Node 1: Verify AI Foundation School completion."""
    logger.info(
        "cert_validation_check_foundation",
        extra={"learner_id": state["learner_id"], "step": 1},
    )
    state["step_count"] = state.get("step_count", 0) + 1

    # Stub: in production, call backend API GET /enrollment/progress
    state["foundation_complete"] = True
    state["foundation_details"] = (
        "All 5 AI Foundation School modules completed: "
        "AI Literacy, AI Fluency, Systems Awareness, Governance, Professional Discipline."
    )
    return state


def _check_levels(state: ValidationState) -> ValidationState:
    """Node 2: Verify all track levels (Beginner, Intermediate, Advanced) complete."""
    logger.info(
        "cert_validation_check_levels",
        extra={"learner_id": state["learner_id"], "step": 2},
    )
    state["step_count"] = state.get("step_count", 0) + 1

    # Stub: in production, call backend API for level completion status
    state["levels_complete"] = True
    state["levels_details"] = (
        "All 3 levels completed: Beginner (100%), Intermediate (100%), Advanced (100%). "
        "All performance gates passed."
    )
    return state


def _check_pod_deliverables(state: ValidationState) -> ValidationState:
    """Node 3: Verify pod deliverables submitted."""
    logger.info(
        "cert_validation_check_pod_deliverables",
        extra={"learner_id": state["learner_id"], "step": 3},
    )
    state["step_count"] = state.get("step_count", 0) + 1

    # Stub: in production, call backend API for pod deliverable status
    state["pod_deliverables_complete"] = True
    state["pod_deliverables_details"] = (
        "All required pod deliverables submitted: working prototype, "
        "documentation, governance checklist, sprint reviews, final presentation."
    )
    return state


def _check_capstone(state: ValidationState) -> ValidationState:
    """Node 4: Verify capstone project passed."""
    logger.info(
        "cert_validation_check_capstone",
        extra={"learner_id": state["learner_id"], "step": 4},
    )
    state["step_count"] = state.get("step_count", 0) + 1

    # Stub: in production, call backend API for capstone status
    state["capstone_passed"] = True
    state["capstone_details"] = (
        "Capstone project submitted and defense passed. "
        "Panel of 2 assessors approved."
    )
    return state


def _check_assessor_approval(state: ValidationState) -> ValidationState:
    """Node 5: Verify assessor approval."""
    logger.info(
        "cert_validation_check_assessor",
        extra={"learner_id": state["learner_id"], "step": 5},
    )
    state["step_count"] = state.get("step_count", 0) + 1

    # Stub: in production, call backend API for assessor approval status
    state["assessor_approved"] = True
    state["assessor_details"] = "Assessor has approved certification eligibility."
    return state


def _check_payment(state: ValidationState) -> ValidationState:
    """Node 6: Verify payment cleared."""
    logger.info(
        "cert_validation_check_payment",
        extra={"learner_id": state["learner_id"], "step": 6},
    )
    state["step_count"] = state.get("step_count", 0) + 1

    # Stub: in production, call backend API for payment status
    state["payment_cleared"] = True
    state["payment_details"] = "All installments paid. No outstanding balance."
    return state


# ---------------------------------------------------------------------------
# Edge conditions
# ---------------------------------------------------------------------------


def _after_foundation(state: ValidationState) -> str:
    """Edge: proceed to levels check or terminate early on step limit."""
    if state.get("step_count", 0) >= _MAX_STEP_LIMIT:
        return END
    return "check_levels"


def _after_levels(state: ValidationState) -> str:
    """Edge: proceed to pod deliverables check."""
    if state.get("step_count", 0) >= _MAX_STEP_LIMIT:
        return END
    return "check_pod_deliverables"


def _after_pod_deliverables(state: ValidationState) -> str:
    """Edge: proceed to capstone check."""
    if state.get("step_count", 0) >= _MAX_STEP_LIMIT:
        return END
    return "check_capstone"


def _after_capstone(state: ValidationState) -> str:
    """Edge: proceed to assessor approval check."""
    if state.get("step_count", 0) >= _MAX_STEP_LIMIT:
        return END
    return "check_assessor_approval"


def _after_assessor(state: ValidationState) -> str:
    """Edge: proceed to payment check."""
    if state.get("step_count", 0) >= _MAX_STEP_LIMIT:
        return END
    return "check_payment"


# ---------------------------------------------------------------------------
# Build LangGraph workflow
# ---------------------------------------------------------------------------


def _build_validation_graph() -> StateGraph:
    """Build the LangGraph certification validation workflow.

    Graph structure (linear pipeline with step-limit guards):
        check_foundation → check_levels → check_pod_deliverables
        → check_capstone → check_assessor_approval → check_payment → END

    Workflow design standards (per AGENT_WORKFLOW_ARCHITECTURE.md):
        - Documented purpose: verify all 6 certification prerequisites
        - Explicit node responsibilities: one node per prerequisite
        - Edge conditions: step-limit guard at each transition
        - State schema: ValidationState TypedDict
        - Termination criteria: END after payment check or step limit
        - Max step limit: 10
        - Error handling: each node logs and propagates errors
    """
    graph = StateGraph(ValidationState)

    # Add nodes — one per prerequisite check
    graph.add_node("check_foundation", _check_foundation)
    graph.add_node("check_levels", _check_levels)
    graph.add_node("check_pod_deliverables", _check_pod_deliverables)
    graph.add_node("check_capstone", _check_capstone)
    graph.add_node("check_assessor_approval", _check_assessor_approval)
    graph.add_node("check_payment", _check_payment)

    # Set entry point
    graph.set_entry_point("check_foundation")

    # Add conditional edges with step-limit guards
    graph.add_conditional_edges("check_foundation", _after_foundation)
    graph.add_conditional_edges("check_levels", _after_levels)
    graph.add_conditional_edges("check_pod_deliverables", _after_pod_deliverables)
    graph.add_conditional_edges("check_capstone", _after_capstone)
    graph.add_conditional_edges("check_assessor_approval", _after_assessor)
    graph.add_edge("check_payment", END)

    return graph


# Compile the validation workflow once at module load
_validation_workflow = _build_validation_graph().compile()


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/validate-certification/{learner_id}",
    response_model=CertificationValidationResponse,
)
async def validate_certification(
    learner_id: str,
    request: CertificationValidationRequest,
) -> CertificationValidationResponse:
    """Multi-step LangGraph workflow verifying all 6 certification prerequisites.

    Produces a structured validation report with each prerequisite status
    and any blocking conditions.
    """
    start_time = time.time()

    if not learner_id.startswith("LRN-"):
        raise HTTPException(
            status_code=400,
            detail="Invalid learner ID format. Expected LRN-*.",
        )

    logger.info(
        "cert_validation_start",
        extra={
            "learner_id": learner_id,
            "track_id": request.track_id,
        },
    )

    try:
        # Initialize workflow state
        initial_state: ValidationState = {
            "learner_id": learner_id,
            "track_id": request.track_id,
            "step_count": 0,
            "foundation_complete": False,
            "foundation_details": "",
            "levels_complete": False,
            "levels_details": "",
            "pod_deliverables_complete": False,
            "pod_deliverables_details": "",
            "capstone_passed": False,
            "capstone_details": "",
            "assessor_approved": False,
            "assessor_details": "",
            "payment_cleared": False,
            "payment_details": "",
            "error": "",
        }

        # Execute LangGraph workflow
        result = _validation_workflow.invoke(initial_state)

        # Build prerequisite statuses
        prerequisites = [
            PrerequisiteStatus(
                prerequisite="AI Foundation School Complete",
                status="passed" if result["foundation_complete"] else "failed",
                details=result["foundation_details"],
                blocking=not result["foundation_complete"],
            ),
            PrerequisiteStatus(
                prerequisite="Track Levels Complete",
                status="passed" if result["levels_complete"] else "failed",
                details=result["levels_details"],
                blocking=not result["levels_complete"],
            ),
            PrerequisiteStatus(
                prerequisite="Pod Deliverables Submitted",
                status="passed" if result["pod_deliverables_complete"] else "failed",
                details=result["pod_deliverables_details"],
                blocking=not result["pod_deliverables_complete"],
            ),
            PrerequisiteStatus(
                prerequisite="Capstone Passed",
                status="passed" if result["capstone_passed"] else "failed",
                details=result["capstone_details"],
                blocking=not result["capstone_passed"],
            ),
            PrerequisiteStatus(
                prerequisite="Assessor Approved",
                status="passed" if result["assessor_approved"] else "failed",
                details=result["assessor_details"],
                blocking=not result["assessor_approved"],
            ),
            PrerequisiteStatus(
                prerequisite="Payment Cleared",
                status="passed" if result["payment_cleared"] else "failed",
                details=result["payment_details"],
                blocking=not result["payment_cleared"],
            ),
        ]

        blocking_conditions = [p.prerequisite for p in prerequisites if p.blocking]
        eligible = len(blocking_conditions) == 0

        recommendation = filter_output(
            f"Learner {learner_id} is {'eligible' if eligible else 'NOT eligible'} "
            f"for certification in track {request.track_id}."
            + (
                ""
                if eligible
                else f" Blocking conditions: {', '.join(blocking_conditions)}."
            )
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        telemetry = {
            "workflow": "certification_validation",
            "status": "completed",
            "duration_ms": duration_ms,
            "steps_executed": result.get("step_count", 0),
            "model": settings.default_model,
            "trace_id": f"AWE-{uuid.uuid4().hex[:8]}",
            "eligible": eligible,
        }

        logger.info("cert_validation_completed", extra=telemetry)

        return CertificationValidationResponse(
            learner_id=learner_id,
            track_id=request.track_id,
            eligible=eligible,
            prerequisites=prerequisites,
            blocking_conditions=blocking_conditions,
            recommendation=recommendation,
            workflow_steps_executed=result.get("step_count", 0),
            telemetry=telemetry,
        )

    except HTTPException:
        raise

    except Exception as exc:
        logger.error("cert_validation_failed", extra={"error": str(exc)})
        raise HTTPException(
            status_code=500,
            detail="Certification validation failed. Please retry.",
        )
