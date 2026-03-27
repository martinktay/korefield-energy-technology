"""Tests for faculty-side AI agents: Instructor Insight, Assessor Support, Certification Validation.

Covers endpoint behavior, ID validation, review queue prioritization,
pod health computation, and LangGraph certification validation workflow.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


# -----------------------------------------------------------------------
# Instructor Insight Agent — GET /ai/faculty/cohort-analytics/{ENR-*}
# -----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cohort_analytics_returns_200(client):
    resp = await client.get("/ai/faculty/cohort-analytics/ENR-abc123")
    assert resp.status_code == 200
    data = resp.json()
    assert data["enrollment_id"] == "ENR-abc123"
    assert data["cohort_size"] > 0
    assert 0 <= data["overall_completion_rate"] <= 1
    assert 0 <= data["average_cohort_score"] <= 1
    assert len(data["content_engagement"]) > 0
    assert len(data["struggle_modules"]) > 0
    assert data["performance_trend"] in ("improving", "stable", "declining")
    assert "telemetry" in data


@pytest.mark.asyncio
async def test_cohort_analytics_invalid_id(client):
    resp = await client.get("/ai/faculty/cohort-analytics/INVALID-123")
    assert resp.status_code == 400
    assert "ENR-" in resp.json()["detail"]


# -----------------------------------------------------------------------
# Assessor Support Agent — GET /ai/faculty/review-queue/{USR-*}
# -----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_review_queue_returns_200(client):
    resp = await client.get("/ai/faculty/review-queue/USR-asr001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["assessor_id"] == "USR-asr001"
    assert data["queue_size"] > 0
    assert len(data["items"]) == data["queue_size"]
    assert "telemetry" in data


@pytest.mark.asyncio
async def test_review_queue_sorted_by_priority(client):
    resp = await client.get("/ai/faculty/review-queue/USR-asr001")
    assert resp.status_code == 200
    items = resp.json()["items"]
    scores = [item["priority_score"] for item in items]
    assert scores == sorted(scores, reverse=True), "Queue should be sorted by priority descending"


@pytest.mark.asyncio
async def test_review_queue_highest_priority_is_overdue_high_risk(client):
    resp = await client.get("/ai/faculty/review-queue/USR-asr001")
    assert resp.status_code == 200
    top_item = resp.json()["items"][0]
    # The overdue + high-risk + old submission should be first
    assert top_item["submission_id"] == "SUB-old001"
    assert top_item["learner_risk_level"] == "high"
    assert top_item["deadline_proximity"] == "overdue"


@pytest.mark.asyncio
async def test_review_queue_invalid_id(client):
    resp = await client.get("/ai/faculty/review-queue/INVALID-123")
    assert resp.status_code == 400
    assert "USR-" in resp.json()["detail"]


# -----------------------------------------------------------------------
# Assessor Support Agent — GET /ai/faculty/pod-health/{POD-*}
# -----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_pod_health_returns_200(client):
    resp = await client.get("/ai/faculty/pod-health/POD-team01")
    assert resp.status_code == 200
    data = resp.json()
    assert data["pod_id"] == "POD-team01"
    assert data["collaboration_frequency"] > 0
    assert 0 <= data["contribution_balance"] <= 1
    assert data["health_status"] in ("healthy", "at_risk", "dysfunctional")
    assert len(data["member_contributions"]) > 0
    assert "recommendation" in data
    assert "telemetry" in data


@pytest.mark.asyncio
async def test_pod_health_detects_early_warnings(client):
    resp = await client.get("/ai/faculty/pod-health/POD-team01")
    assert resp.status_code == 200
    data = resp.json()
    # Stub data has one low-contribution member (LRN-sec01, score 0.30)
    assert len(data["early_warnings"]) > 0
    assert any("LRN-sec01" in w for w in data["early_warnings"])


@pytest.mark.asyncio
async def test_pod_health_invalid_id(client):
    resp = await client.get("/ai/faculty/pod-health/INVALID-123")
    assert resp.status_code == 400
    assert "POD-" in resp.json()["detail"]


# -----------------------------------------------------------------------
# Certification Validation Agent — POST /ai/faculty/validate-certification/{LRN-*}
# -----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_cert_validation_all_conditions_met(client):
    resp = await client.post(
        "/ai/faculty/validate-certification/LRN-elig01",
        json={"track_id": "TRK-ai-eng-001"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["learner_id"] == "LRN-elig01"
    assert data["track_id"] == "TRK-ai-eng-001"
    assert data["eligible"] is True
    assert len(data["prerequisites"]) == 6
    assert all(p["status"] == "passed" for p in data["prerequisites"])
    assert len(data["blocking_conditions"]) == 0
    assert data["workflow_steps_executed"] == 6
    assert "telemetry" in data


@pytest.mark.asyncio
async def test_cert_validation_has_all_six_prerequisites(client):
    resp = await client.post(
        "/ai/faculty/validate-certification/LRN-elig02",
        json={"track_id": "TRK-ds-001"},
    )
    assert resp.status_code == 200
    prereq_names = [p["prerequisite"] for p in resp.json()["prerequisites"]]
    assert "Foundation School Complete" in prereq_names
    assert "Track Levels Complete" in prereq_names
    assert "Pod Deliverables Submitted" in prereq_names
    assert "Capstone Passed" in prereq_names
    assert "Assessor Approved" in prereq_names
    assert "Payment Cleared" in prereq_names


@pytest.mark.asyncio
async def test_cert_validation_invalid_learner_id(client):
    resp = await client.post(
        "/ai/faculty/validate-certification/INVALID-123",
        json={"track_id": "TRK-ai-eng-001"},
    )
    assert resp.status_code == 400
    assert "LRN-" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_cert_validation_invalid_track_id(client):
    resp = await client.post(
        "/ai/faculty/validate-certification/LRN-elig01",
        json={"track_id": "INVALID-track"},
    )
    assert resp.status_code == 422


# -----------------------------------------------------------------------
# Priority score computation unit tests
# -----------------------------------------------------------------------


def test_priority_score_overdue_high_risk():
    from agents.faculty.assessor_support import compute_priority_score

    score = compute_priority_score(
        age_hours=168.0, risk_level="critical", deadline_proximity="overdue"
    )
    assert score > 0.8


def test_priority_score_new_low_risk():
    from agents.faculty.assessor_support import compute_priority_score

    score = compute_priority_score(
        age_hours=1.0, risk_level="low", deadline_proximity="distant"
    )
    assert score < 0.2


def test_priority_score_bounded():
    from agents.faculty.assessor_support import compute_priority_score

    score = compute_priority_score(
        age_hours=500.0, risk_level="critical", deadline_proximity="overdue"
    )
    assert 0 <= score <= 1


# -----------------------------------------------------------------------
# Contribution balance computation unit tests
# -----------------------------------------------------------------------


def test_contribution_balance_equal():
    from agents.faculty.assessor_support import compute_contribution_balance

    balance = compute_contribution_balance([0.8, 0.8, 0.8, 0.8])
    assert balance == 1.0


def test_contribution_balance_imbalanced():
    from agents.faculty.assessor_support import compute_contribution_balance

    balance = compute_contribution_balance([1.0, 0.0, 0.0, 0.0])
    assert balance < 0.5


def test_contribution_balance_single_member():
    from agents.faculty.assessor_support import compute_contribution_balance

    balance = compute_contribution_balance([0.5])
    assert balance == 1.0


def test_contribution_balance_empty():
    from agents.faculty.assessor_support import compute_contribution_balance

    balance = compute_contribution_balance([])
    assert balance == 1.0
