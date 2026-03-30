"""Unit tests for AI cost controls: model tiering, cost computation, cap service, and tutor cache.

Covers get_model_for_agent(), compute_cost(), AiCapService, TutorCache,
and the metered invoke_llm() integration.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from agents.ai_cap_service import AiCapService, CapCheckResult
from agents.llm_factory import (
    AGENT_MODEL_MAP,
    MODEL_PRICING,
    compute_cost,
    get_model_for_agent,
)
from agents.tutor_cache import TutorCache


# -----------------------------------------------------------------------
# MODEL_PRICING and AGENT_MODEL_MAP constants
# -----------------------------------------------------------------------


def test_model_pricing_contains_gpt4o():
    assert "gpt-4o" in MODEL_PRICING
    assert "input" in MODEL_PRICING["gpt-4o"]
    assert "output" in MODEL_PRICING["gpt-4o"]


def test_model_pricing_contains_gpt4o_mini():
    assert "gpt-4o-mini" in MODEL_PRICING
    assert MODEL_PRICING["gpt-4o-mini"]["input"] == 0.15 / 1_000_000
    assert MODEL_PRICING["gpt-4o-mini"]["output"] == 0.60 / 1_000_000


def test_model_pricing_gpt4o_values():
    assert MODEL_PRICING["gpt-4o"]["input"] == 2.50 / 1_000_000
    assert MODEL_PRICING["gpt-4o"]["output"] == 10.00 / 1_000_000


def test_agent_model_map_tutor_hint():
    assert AGENT_MODEL_MAP["tutor_hint"] == "gpt-4o-mini"


def test_agent_model_map_tutor_summarize():
    assert AGENT_MODEL_MAP["tutor_summarize"] == "gpt-4o-mini"


def test_agent_model_map_dropout_risk():
    assert AGENT_MODEL_MAP["dropout_risk"] == "gpt-4o-mini"


def test_agent_model_map_feedback_analysis():
    assert AGENT_MODEL_MAP["feedback_analysis"] == "gpt-4o"


def test_agent_model_map_executive_report():
    assert AGENT_MODEL_MAP["executive_report"] == "gpt-4o"


def test_agent_model_map_career_support():
    assert AGENT_MODEL_MAP["career_support"] == "gpt-4o"


# -----------------------------------------------------------------------
# get_model_for_agent()
# -----------------------------------------------------------------------


def test_foundation_tier_returns_mini():
    assert get_model_for_agent("tutor_hint", "foundation") == "gpt-4o-mini"


def test_foundation_tier_overrides_any_agent_type():
    assert get_model_for_agent("executive_report", "foundation") == "gpt-4o-mini"
    assert get_model_for_agent("feedback_analysis", "foundation") == "gpt-4o-mini"
    assert get_model_for_agent("unknown_agent", "foundation") == "gpt-4o-mini"


def test_cohort_tier_tutor_hint():
    assert get_model_for_agent("tutor_hint", "cohort") == "gpt-4o-mini"


def test_cohort_tier_feedback_analysis():
    assert get_model_for_agent("feedback_analysis", "cohort") == "gpt-4o"


def test_cohort_tier_executive_report():
    assert get_model_for_agent("executive_report", "cohort") == "gpt-4o"


def test_unknown_agent_type_falls_back_to_default():
    with patch("agents.llm_factory.settings") as mock_settings:
        mock_settings.default_model = "gpt-4o"
        result = get_model_for_agent("nonexistent_agent", "cohort")
        assert result == "gpt-4o"


def test_unknown_agent_type_logs_warning():
    with patch("agents.llm_factory.logger") as mock_logger:
        with patch("agents.llm_factory.settings") as mock_settings:
            mock_settings.default_model = "gpt-4o"
            get_model_for_agent("nonexistent_agent", "cohort")
            mock_logger.warning.assert_called_once()


# -----------------------------------------------------------------------
# compute_cost()
# -----------------------------------------------------------------------


def test_compute_cost_gpt4o():
    cost = compute_cost("gpt-4o", 1000, 500)
    expected = (1000 * 2.50 / 1_000_000) + (500 * 10.00 / 1_000_000)
    assert abs(cost - expected) < 1e-10


def test_compute_cost_gpt4o_mini():
    cost = compute_cost("gpt-4o-mini", 2000, 1000)
    expected = (2000 * 0.15 / 1_000_000) + (1000 * 0.60 / 1_000_000)
    assert abs(cost - expected) < 1e-10


def test_compute_cost_unknown_model_returns_zero():
    cost = compute_cost("unknown-model", 1000, 500)
    assert cost == 0.0


def test_compute_cost_zero_tokens():
    cost = compute_cost("gpt-4o", 0, 0)
    assert cost == 0.0


# -----------------------------------------------------------------------
# AiCapService
# -----------------------------------------------------------------------


def test_cap_for_tier_foundation():
    svc = AiCapService.__new__(AiCapService)
    assert svc._cap_for_tier("foundation") == 10


def test_cap_for_tier_cohort():
    svc = AiCapService.__new__(AiCapService)
    assert svc._cap_for_tier("cohort") == 50


def test_build_key_format():
    key = AiCapService._build_key("LRN-abc123")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    assert key == f"ai_cap:LRN-abc123:{today}"


def test_build_key_different_dates():
    from datetime import timedelta

    d1 = datetime(2025, 1, 15, tzinfo=timezone.utc)
    d2 = datetime(2025, 1, 16, tzinfo=timezone.utc)
    k1 = AiCapService._build_key("LRN-abc", d1)
    k2 = AiCapService._build_key("LRN-abc", d2)
    assert k1 != k2
    assert "2025-01-15" in k1
    assert "2025-01-16" in k2


@pytest.mark.asyncio
async def test_check_and_increment_allowed():
    svc = AiCapService.__new__(AiCapService)
    mock_redis = AsyncMock()
    mock_redis.incr = AsyncMock(return_value=1)
    mock_redis.expire = AsyncMock()
    svc._redis = mock_redis

    result = await svc.check_and_increment("LRN-test01", "cohort")
    assert result.allowed is True
    assert result.current_count == 1
    assert result.cap == 50


@pytest.mark.asyncio
async def test_check_and_increment_cap_exceeded():
    svc = AiCapService.__new__(AiCapService)
    mock_redis = AsyncMock()
    mock_redis.incr = AsyncMock(return_value=11)
    mock_redis.expire = AsyncMock()
    svc._redis = mock_redis

    result = await svc.check_and_increment("LRN-test01", "foundation")
    assert result.allowed is False
    assert result.current_count == 11
    assert result.cap == 10


@pytest.mark.asyncio
async def test_check_and_increment_fail_open():
    svc = AiCapService.__new__(AiCapService)
    mock_redis = AsyncMock()
    mock_redis.incr = AsyncMock(side_effect=ConnectionError("Redis down"))
    svc._redis = mock_redis

    result = await svc.check_and_increment("LRN-test01", "cohort")
    assert result.allowed is True  # fail-open


@pytest.mark.asyncio
async def test_check_and_increment_sets_ttl_on_first():
    svc = AiCapService.__new__(AiCapService)
    mock_redis = AsyncMock()
    mock_redis.incr = AsyncMock(return_value=1)
    mock_redis.expire = AsyncMock()
    svc._redis = mock_redis

    await svc.check_and_increment("LRN-test01", "cohort")
    mock_redis.expire.assert_called_once()


# -----------------------------------------------------------------------
# TutorCache
# -----------------------------------------------------------------------


def test_cache_key_format():
    key = TutorCache._cache_key("MOD-abc", "What is AI?")
    normalized = "what is ai?"
    expected_hash = hashlib.sha256(normalized.encode()).hexdigest()
    assert key == f"tutor_cache:MOD-abc:{expected_hash}"


def test_cache_key_normalization():
    k1 = TutorCache._cache_key("MOD-abc", "  What is AI?  ")
    k2 = TutorCache._cache_key("MOD-abc", "what is ai?")
    assert k1 == k2


@pytest.mark.asyncio
async def test_cache_get_miss():
    cache = TutorCache.__new__(TutorCache)
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    cache._redis = mock_redis

    result = await cache.get("MOD-abc", "test query")
    assert result is None


@pytest.mark.asyncio
async def test_cache_get_hit():
    cache = TutorCache.__new__(TutorCache)
    payload = {"explanation": "test", "key_concepts": ["a"], "confidence": "high"}
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=json.dumps(payload))
    cache._redis = mock_redis

    result = await cache.get("MOD-abc", "test query")
    assert result == payload


@pytest.mark.asyncio
async def test_cache_get_fail_open():
    cache = TutorCache.__new__(TutorCache)
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(side_effect=ConnectionError("Redis down"))
    cache._redis = mock_redis

    result = await cache.get("MOD-abc", "test query")
    assert result is None  # fail-open


@pytest.mark.asyncio
async def test_cache_set_stores_with_ttl():
    cache = TutorCache.__new__(TutorCache)
    mock_redis = AsyncMock()
    mock_redis.set = AsyncMock()
    cache._redis = mock_redis

    payload = {"explanation": "test", "key_concepts": ["a"], "confidence": "high"}
    await cache.set("MOD-abc", "test query", payload)
    mock_redis.set.assert_called_once()
    call_args = mock_redis.set.call_args
    assert call_args.kwargs.get("ex") == 900 or call_args[1].get("ex") == 900 or 900 in call_args[0]


@pytest.mark.asyncio
async def test_cache_set_fail_open():
    cache = TutorCache.__new__(TutorCache)
    mock_redis = AsyncMock()
    mock_redis.set = AsyncMock(side_effect=ConnectionError("Redis down"))
    cache._redis = mock_redis

    # Should not raise
    payload = {"explanation": "test", "key_concepts": ["a"], "confidence": "high"}
    await cache.set("MOD-abc", "test query", payload)


# -----------------------------------------------------------------------
# Tutor Agent integration — cap enforcement and cache
# -----------------------------------------------------------------------


@pytest.mark.asyncio
async def test_tutor_lesson_cap_exceeded_returns_429():
    from httpx import ASGITransport, AsyncClient
    from main import app

    cap_result = CapCheckResult(
        allowed=False, current_count=11, cap=10, reset_at="2025-01-02T00:00:00+00:00"
    )
    mock_cap = AsyncMock(return_value=cap_result)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with patch("agents.learner.tutor._ai_cap_service.check_and_increment", mock_cap):
            resp = await client.post(
                "/ai/tutor/lesson",
                json={
                    "learner_id": "LRN-cap001",
                    "module_id": "MOD-xyz789",
                    "lesson_id": "LSN-les001",
                    "query": "Explain neural networks",
                    "learner_tier": "foundation",
                },
            )
    assert resp.status_code == 429
    assert "daily" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_tutor_lesson_cache_hit_returns_cached():
    from httpx import ASGITransport, AsyncClient
    from main import app

    cap_result = CapCheckResult(
        allowed=True, current_count=1, cap=50, reset_at="2025-01-02T00:00:00+00:00"
    )
    cached_response = {
        "explanation": "Cached explanation",
        "key_concepts": ["concept1"],
        "confidence": "high",
        "pacing": "standard",
        "retrieval_hits": 3,
    }

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        with (
            patch("agents.learner.tutor._ai_cap_service.check_and_increment", AsyncMock(return_value=cap_result)),
            patch("agents.learner.tutor._tutor_cache.get", AsyncMock(return_value=cached_response)),
        ):
            resp = await client.post(
                "/ai/tutor/lesson",
                json={
                    "learner_id": "LRN-cache01",
                    "module_id": "MOD-xyz789",
                    "lesson_id": "LSN-les001",
                    "query": "Explain neural networks",
                },
            )
    assert resp.status_code == 200
    data = resp.json()
    assert data["explanation"] == "Cached explanation"
    assert data["telemetry"]["cache_hit"] is True
