"""Property-based tests for dropout risk score persistence round trip.

Uses hypothesis to verify that dropout risk evaluations are correctly
persisted to PostgreSQL and that GET lookup returns the most recent
record by computed_at. Each test references its design document property
and validates specific requirements.
"""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from hypothesis import given, settings as h_settings, strategies as st

from agents.learner.dropout import (
    DropoutEvaluateRequest,
    EngagementSignals,
    compute_risk_score,
    evaluate_dropout_risk,
    get_risk_score,
    _risk_level,
)


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

_learner_id_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N")),
    min_size=4,
    max_size=12,
).map(lambda s: f"LRN-{s}")

_enrollment_id_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N")),
    min_size=4,
    max_size=12,
).map(lambda s: f"ENR-{s}")

_engagement_signals_st = st.fixed_dictionaries(
    {
        "login_frequency": st.floats(min_value=0.0, max_value=14.0),
        "submission_timeliness": st.floats(min_value=0.0, max_value=1.0),
        "average_score": st.floats(min_value=0.0, max_value=1.0),
        "pod_participation": st.floats(min_value=0.0, max_value=1.0),
    }
)


# Number of evaluations per learner: at least 2 to test retention + recency.
_num_evaluations_st = st.integers(min_value=2, max_value=10)


# ---------------------------------------------------------------------------
# In-memory database simulation
# ---------------------------------------------------------------------------


class InMemoryDropoutDB:
    """Simulates the dropout_risk_scores PostgreSQL table in memory.

    Supports INSERT and SELECT queries matching the patterns used by
    the dropout agent.
    """

    def __init__(self) -> None:
        self.rows: list[dict] = []

    async def execute(self, query: str, *args) -> None:
        """Handle INSERT INTO dropout_risk_scores."""
        if "INSERT INTO dropout_risk_scores" in query:
            record_id, learner_id, enrollment_id, risk_score, risk_level, signals_json, intervention_triggered = args[:7]
            self.rows.append(
                {
                    "record_id": record_id,
                    "learner_id": learner_id,
                    "enrollment_id": enrollment_id,
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                    "signals": signals_json,
                    "intervention_triggered": intervention_triggered,
                    "computed_at": datetime.now(timezone.utc),
                }
            )

    async def fetchrow(self, query: str, *args):
        """Handle SELECT ... ORDER BY computed_at DESC LIMIT 1."""
        if "FROM dropout_risk_scores" in query and "ORDER BY computed_at DESC" in query:
            learner_id = args[0]
            matching = [r for r in self.rows if r["learner_id"] == learner_id]
            if not matching:
                return None
            # Return the most recent by computed_at
            most_recent = max(matching, key=lambda r: r["computed_at"])
            return most_recent
        return None

    async def close(self) -> None:
        pass


# ---------------------------------------------------------------------------
# Property 6: Dropout Risk Score Persistence Round Trip
# Feature: production-readiness-hardening, Property 6
# Validates: Requirements 3.1, 3.2, 3.4
# ---------------------------------------------------------------------------


class TestDropoutPersistenceRoundTrip:
    """Property 6: Dropout Risk Score Persistence Round Trip.

    For any sequence of dropout risk evaluations for the same learner,
    all records should be retained in the database, and a subsequent
    GET lookup should return the record with the most recent
    ``computed_at`` timestamp.

    **Validates: Requirements 3.1, 3.2, 3.4**
    """

    @given(
        learner_id=_learner_id_st,
        enrollment_id=_enrollment_id_st,
        signals_list=st.lists(
            _engagement_signals_st,
            min_size=2,
            max_size=8,
        ),
    )
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_all_evaluations_retained_and_get_returns_most_recent(
        self,
        learner_id: str,
        enrollment_id: str,
        signals_list: list[dict],
    ) -> None:
        """Multiple risk evaluations for the same learner are all retained
        and GET lookup returns the most recent record by computed_at."""

        db = InMemoryDropoutDB()

        mock_conn = AsyncMock()
        mock_conn.execute = AsyncMock(side_effect=db.execute)
        mock_conn.fetchrow = AsyncMock(side_effect=db.fetchrow)
        mock_conn.close = AsyncMock()

        # Stub the LangGraph intervention workflow to avoid LLM calls
        mock_workflow_result = {
            "learner_id": learner_id,
            "risk_score": 0.0,
            "risk_level": "low",
            "signals": {},
            "assessor_notified": False,
            "recommendation": "",
            "step_count": 1,
        }

        with (
            patch(
                "agents.learner.dropout.asyncpg.connect",
                AsyncMock(return_value=mock_conn),
            ),
            patch(
                "agents.learner.dropout._intervention_workflow",
                MagicMock(invoke=MagicMock(return_value=mock_workflow_result)),
            ),
        ):
            # --- Phase 1: Evaluate multiple times for the same learner ---
            for signals_dict in signals_list:
                signals = EngagementSignals(**signals_dict)
                request = DropoutEvaluateRequest(
                    learner_id=learner_id,
                    enrollment_id=enrollment_id,
                    signals=signals,
                )
                response = await evaluate_dropout_risk(request)

                # Each evaluation should produce a DRS-* record
                assert response.record_id.startswith("DRS-"), (
                    f"Expected record_id starting with DRS-, got {response.record_id}"
                )
                # Risk score should match the computed value
                expected_score = compute_risk_score(signals)
                assert response.risk_score == expected_score, (
                    f"Expected risk_score={expected_score}, got {response.risk_score}"
                )

            # --- Phase 2: Verify all records are retained ----------------
            assert len(db.rows) == len(signals_list), (
                f"Expected {len(signals_list)} records retained, "
                f"got {len(db.rows)}"
            )

            # All records should belong to the same learner
            for row in db.rows:
                assert row["learner_id"] == learner_id

            # --- Phase 3: GET lookup returns the most recent record ------
            get_response = await get_risk_score(learner_id)

            # The most recent record is the last one inserted (latest computed_at)
            most_recent_row = max(db.rows, key=lambda r: r["computed_at"])

            assert get_response.record_id == most_recent_row["record_id"], (
                f"GET should return most recent record "
                f"{most_recent_row['record_id']}, got {get_response.record_id}"
            )
            assert get_response.risk_score == most_recent_row["risk_score"], (
                f"GET risk_score mismatch: expected "
                f"{most_recent_row['risk_score']}, got {get_response.risk_score}"
            )
