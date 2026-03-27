"""Tests for executive-side AI agents: Market Intelligence, Pricing Intelligence,
Expansion Opportunity, Academic Performance Insight.

Covers Super Admin access restriction, AQR-* query logging, confidence scores,
LangGraph workflow execution, and endpoint behavior.
"""

import pytest
from httpx import ASGITransport, AsyncClient

from main import app

SUPER_ADMIN_HEADERS = {"x-user-role": "super_admin", "x-user-id": "USR-sa001"}
NON_ADMIN_HEADERS = {"x-user-role": "learner", "x-user-id": "USR-lrn001"}


@pytest.fixture
def client():
    transport = ASGITransport(app=app)
    return AsyncClient(transport=transport, base_url="http://test")


@pytest.fixture(autouse=True)
def _clear_query_log():
    """Clear the in-memory AQR query log between tests."""
    from agents.executive.market_intelligence import _query_log
    _query_log.clear()
    yield
    _query_log.clear()


# -----------------------------------------------------------------------
# Market Intelligence Agent — POST /ai/executive/market-report
# -----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_market_report_returns_200(client):
    resp = await client.post(
        "/ai/executive/market-report",
        json={"report_type": "comprehensive", "tracks": [], "regions": []},
        headers=SUPER_ADMIN_HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["report_type"] == "comprehensive"
    assert len(data["sections"]) > 0
    assert len(data["track_relevance_scores"]) > 0
    assert 0 <= data["overall_confidence"] <= 1
    assert data["aqr_record_id"].startswith("AQR-")
    assert data["workflow_steps_executed"] == 6
    assert "telemetry" in data


@pytest.mark.asyncio
async def test_market_report_rejects_non_super_admin(client):
    resp = await client.post(
        "/ai/executive/market-report",
        json={"report_type": "comprehensive"},
        headers=NON_ADMIN_HEADERS,
    )
    assert resp.status_code == 403
    assert "Super Admin" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_market_report_rejects_missing_role(client):
    resp = await client.post(
        "/ai/executive/market-report",
        json={"report_type": "comprehensive"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_market_report_logs_aqr_record(client):
    from agents.executive.market_intelligence import _query_log

    await client.post(
        "/ai/executive/market-report",
        json={"report_type": "hiring_trends"},
        headers=SUPER_ADMIN_HEADERS,
    )
    assert len(_query_log) == 1
    record = _query_log[0]
    assert record["record_id"].startswith("AQR-")
    assert record["requesting_user_id"] == "USR-sa001"
    assert record["query_type"] == "market_report"


@pytest.mark.asyncio
async def test_market_report_confidence_scores_on_sections(client):
    resp = await client.post(
        "/ai/executive/market-report",
        json={"report_type": "comprehensive"},
        headers=SUPER_ADMIN_HEADERS,
    )
    data = resp.json()
    for section in data["sections"]:
        assert 0.5 <= section["confidence"] <= 1.0, (
            "Low-confidence sections should be rejected"
        )


@pytest.mark.asyncio
async def test_market_report_track_relevance_scores(client):
    resp = await client.post(
        "/ai/executive/market-report",
        json={"report_type": "comprehensive"},
        headers=SUPER_ADMIN_HEADERS,
    )
    data = resp.json()
    for ts in data["track_relevance_scores"]:
        assert ts["track_id"].startswith("TRK-")
        assert 0 <= ts["composite_score"] <= 1
        assert 0 <= ts["hiring_trend_score"] <= 1
        assert 0 <= ts["enrollment_demand_score"] <= 1
        assert 0 <= ts["waitlist_growth_score"] <= 1
        assert 0 <= ts["skill_demand_score"] <= 1


# -----------------------------------------------------------------------
# Market Intelligence Agent — GET /ai/executive/market-alerts
# -----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_market_alerts_returns_200(client):
    resp = await client.get(
        "/ai/executive/market-alerts",
        headers=SUPER_ADMIN_HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_count"] > 0
    assert len(data["alerts"]) == data["total_count"]
    assert data["aqr_record_id"].startswith("AQR-")
    assert "telemetry" in data


@pytest.mark.asyncio
async def test_market_alerts_rejects_non_super_admin(client):
    resp = await client.get(
        "/ai/executive/market-alerts",
        headers=NON_ADMIN_HEADERS,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_market_alerts_sorted_by_priority(client):
    resp = await client.get(
        "/ai/executive/market-alerts",
        headers=SUPER_ADMIN_HEADERS,
    )
    alerts = resp.json()["alerts"]
    # Verify sorted by relevance/recency ratio descending
    priorities = [a["relevance_score"] / max(a["recency_hours"], 0.1) for a in alerts]
    assert priorities == sorted(priorities, reverse=True)


@pytest.mark.asyncio
async def test_market_alerts_confidence_on_all(client):
    resp = await client.get(
        "/ai/executive/market-alerts",
        headers=SUPER_ADMIN_HEADERS,
    )
    for alert in resp.json()["alerts"]:
        assert 0 <= alert["confidence"] <= 1


@pytest.mark.asyncio
async def test_market_alerts_logs_aqr_record(client):
    from agents.executive.market_intelligence import _query_log

    await client.get(
        "/ai/executive/market-alerts",
        headers=SUPER_ADMIN_HEADERS,
    )
    assert len(_query_log) == 1
    assert _query_log[0]["query_type"] == "market_alerts"


# -----------------------------------------------------------------------
# Pricing Intelligence Agent — POST /ai/executive/pricing-recommendation
# -----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_pricing_recommendation_returns_200(client):
    resp = await client.post(
        "/ai/executive/pricing-recommendation",
        json={
            "track_id": "TRK-ai-eng-001",
            "target_region": "West Africa",
            "current_price_usd": 800.0,
        },
        headers=SUPER_ADMIN_HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["track_id"] == "TRK-ai-eng-001"
    assert data["target_region"] == "West Africa"
    assert data["recommended_price_usd"] > 0
    assert 0 <= data["confidence"] <= 1
    assert data["demand_signal_strength"] in ("strong", "moderate", "weak")
    assert data["aqr_record_id"].startswith("AQR-")
    assert len(data["regional_benchmarks"]) > 0


@pytest.mark.asyncio
async def test_pricing_recommendation_rejects_non_super_admin(client):
    resp = await client.post(
        "/ai/executive/pricing-recommendation",
        json={
            "track_id": "TRK-ai-eng-001",
            "target_region": "West Africa",
            "current_price_usd": 800.0,
        },
        headers=NON_ADMIN_HEADERS,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_pricing_recommendation_invalid_track_id(client):
    resp = await client.post(
        "/ai/executive/pricing-recommendation",
        json={
            "track_id": "INVALID-track",
            "target_region": "West Africa",
            "current_price_usd": 800.0,
        },
        headers=SUPER_ADMIN_HEADERS,
    )
    assert resp.status_code == 422


# -----------------------------------------------------------------------
# Expansion Opportunity Agent — GET /ai/executive/expansion-opportunities
# -----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_expansion_opportunities_returns_200(client):
    resp = await client.get(
        "/ai/executive/expansion-opportunities",
        headers=SUPER_ADMIN_HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["opportunities"]) > 0
    assert len(data["coverage_gaps"]) > 0
    assert 0 <= data["confidence"] <= 1
    assert data["aqr_record_id"].startswith("AQR-")
    assert len(data["top_recommendation"]) > 0


@pytest.mark.asyncio
async def test_expansion_opportunities_rejects_non_super_admin(client):
    resp = await client.get(
        "/ai/executive/expansion-opportunities",
        headers=NON_ADMIN_HEADERS,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_expansion_opportunities_sorted_by_score(client):
    resp = await client.get(
        "/ai/executive/expansion-opportunities",
        headers=SUPER_ADMIN_HEADERS,
    )
    opportunities = resp.json()["opportunities"]
    scores = [o["opportunity_score"] for o in opportunities]
    assert scores == sorted(scores, reverse=True)


# -----------------------------------------------------------------------
# Academic Performance Insight Agent — GET /ai/executive/academic-analytics
# -----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_academic_analytics_returns_200(client):
    resp = await client.get(
        "/ai/executive/academic-analytics",
        headers=SUPER_ADMIN_HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["gate_pass_rate_trends"]) > 0
    assert len(data["remediation_patterns"]) > 0
    assert len(data["certification_throughput"]) > 0
    assert len(data["cross_track_comparisons"]) > 0
    assert 0 <= data["confidence"] <= 1
    assert data["aqr_record_id"].startswith("AQR-")
    assert len(data["executive_summary"]) > 0


@pytest.mark.asyncio
async def test_academic_analytics_rejects_non_super_admin(client):
    resp = await client.get(
        "/ai/executive/academic-analytics",
        headers=NON_ADMIN_HEADERS,
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_academic_analytics_gate_trends_valid(client):
    resp = await client.get(
        "/ai/executive/academic-analytics",
        headers=SUPER_ADMIN_HEADERS,
    )
    for trend in resp.json()["gate_pass_rate_trends"]:
        assert trend["track_id"].startswith("TRK-")
        assert 0 <= trend["pass_rate"] <= 1
        assert trend["trend"] in ("improving", "stable", "declining")
        assert trend["average_attempts"] >= 1


@pytest.mark.asyncio
async def test_academic_analytics_certification_throughput(client):
    resp = await client.get(
        "/ai/executive/academic-analytics",
        headers=SUPER_ADMIN_HEADERS,
    )
    for ct in resp.json()["certification_throughput"]:
        assert ct["certified_count"] <= ct["enrolled_count"]
        assert 0 <= ct["throughput_rate"] <= 1


# -----------------------------------------------------------------------
# Track relevance score computation unit tests
# -----------------------------------------------------------------------


def test_track_relevance_all_high():
    from agents.executive.market_intelligence import compute_track_relevance

    score = compute_track_relevance(1.0, 1.0, 1.0, 1.0)
    assert score == 1.0


def test_track_relevance_all_zero():
    from agents.executive.market_intelligence import compute_track_relevance

    score = compute_track_relevance(0.0, 0.0, 0.0, 0.0)
    assert score == 0.0


def test_track_relevance_mixed():
    from agents.executive.market_intelligence import compute_track_relevance

    score = compute_track_relevance(0.8, 0.6, 0.4, 0.7)
    assert 0.4 < score < 0.8


def test_track_relevance_bounded():
    from agents.executive.market_intelligence import compute_track_relevance

    score = compute_track_relevance(0.5, 0.5, 0.5, 0.5)
    assert 0 <= score <= 1
