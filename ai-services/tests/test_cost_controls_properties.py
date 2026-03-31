"""Property-based tests for AI cost controls and cohort economics.

Uses hypothesis to verify universal correctness properties across
randomized inputs. Each test references its design document property
and validates specific requirements.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from hypothesis import given, settings as h_settings, strategies as st

from agents.llm_factory import MODEL_PRICING, compute_cost


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

model_names_st = st.sampled_from(list(MODEL_PRICING.keys()))
token_count_st = st.integers(min_value=0, max_value=10_000_000)
# At least one token count must be > 0 so the fallback path is not triggered
positive_token_count_st = st.integers(min_value=1, max_value=10_000_000)


# ---------------------------------------------------------------------------
# Property 1: Metering computation correctness
# Feature: ai-cost-controls-cohort-economics, Property 1: Metering computation correctness
# Validates: Requirements 1.1, 1.2, 1.3
# ---------------------------------------------------------------------------


class TestMeteringComputationCorrectness:
    """Property 1: Metering computation correctness.

    For any LLM response containing token usage metadata (prompt_tokens,
    completion_tokens) and any model name present in the pricing table,
    the computed estimated_cost_usd shall equal
    (prompt_tokens × input_price_per_token) + (completion_tokens × output_price_per_token),
    and the persisted AWE record shall contain the extracted token_count_input,
    token_count_output, model_name, and computed estimated_cost_usd.

    **Validates: Requirements 1.1, 1.2, 1.3**
    """

    @given(
        model_name=model_names_st,
        prompt_tokens=token_count_st,
        completion_tokens=token_count_st,
    )
    @h_settings(max_examples=150)
    def test_compute_cost_matches_formula(
        self, model_name: str, prompt_tokens: int, completion_tokens: int
    ) -> None:
        """compute_cost() equals the manual pricing formula for any valid model and token counts."""
        pricing = MODEL_PRICING[model_name]
        expected = (prompt_tokens * pricing["input"]) + (
            completion_tokens * pricing["output"]
        )

        result = compute_cost(model_name, prompt_tokens, completion_tokens)

        assert result == pytest.approx(expected, abs=1e-12), (
            f"compute_cost({model_name!r}, {prompt_tokens}, {completion_tokens}) "
            f"returned {result}, expected {expected}"
        )

    @given(
        model_name=model_names_st,
        prompt_tokens=token_count_st,
        completion_tokens=token_count_st,
    )
    @h_settings(max_examples=150)
    def test_cost_is_non_negative(
        self, model_name: str, prompt_tokens: int, completion_tokens: int
    ) -> None:
        """Computed cost is always >= 0 for non-negative token counts."""
        result = compute_cost(model_name, prompt_tokens, completion_tokens)
        assert result >= 0.0

    @given(
        model_name=model_names_st,
        prompt_tokens=positive_token_count_st,
        completion_tokens=token_count_st,
    )
    @h_settings(max_examples=150)
    @pytest.mark.asyncio
    async def test_awe_record_contains_metering_fields(
        self, model_name: str, prompt_tokens: int, completion_tokens: int
    ) -> None:
        """The persisted AWE record contains token_count_input, token_count_output,
        model_name, and computed estimated_cost_usd matching the formula.

        We ensure prompt_tokens >= 1 so the code recognises metadata as present
        (both-zero triggers the character-based fallback, tested by Property 2)."""
        expected_cost = compute_cost(model_name, prompt_tokens, completion_tokens)

        # Build a fake LLM response with token usage metadata
        mock_response = MagicMock()
        mock_response.content = "test response"
        mock_response.response_metadata = {
            "token_usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
            }
        }

        mock_llm = AsyncMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        persisted_records: list[dict] = []

        async def capture_persist(**kwargs):
            persisted_records.append(kwargs)

        # The circuit breaker's call() awaits the function, so we mock it
        # to directly return the mock_response (already resolved).
        async def fake_cb_call(fn, *a, **kw):
            return await fn(*a, **kw)

        with (
            patch("agents.llm_factory.get_llm", return_value=mock_llm),
            patch(
                "agents.llm_factory._circuit_breaker.call",
                side_effect=fake_cb_call,
            ),
            patch(
                "agents.llm_factory._persist_awe_record",
                side_effect=capture_persist,
            ),
        ):
            from agents.llm_factory import invoke_llm

            await invoke_llm(
                "test prompt",
                agent_type="tutor_hint",
                learner_id="LRN-test01",
                cohort_id="COH-test01",
                learner_tier="cohort",
            )

        assert len(persisted_records) == 1
        record = persisted_records[0]

        # Requirement 1.1: extracted token counts
        assert record["token_count_input"] == prompt_tokens
        assert record["token_count_output"] == completion_tokens
        # Requirement 1.2: model_name present
        assert record["model_name"] == "gpt-4o-mini"  # tutor_hint → gpt-4o-mini
        # Requirement 1.3: estimated_cost_usd matches formula
        assert record["estimated_cost_usd"] == pytest.approx(
            compute_cost("gpt-4o-mini", prompt_tokens, completion_tokens), abs=1e-12
        )


# ---------------------------------------------------------------------------
# Property 2: Character-based token estimation fallback
# Feature: ai-cost-controls-cohort-economics, Property 2: Character-based token estimation fallback
# Validates: Requirements 1.4
# ---------------------------------------------------------------------------


class TestCharacterBasedTokenEstimationFallback:
    """Property 2: Character-based token estimation fallback.

    For any input string and output string where the LLM response metadata
    does not include token usage data, the estimated token_count_input shall
    equal len(input_string) // 4 and token_count_output shall equal
    len(output_string) // 4.

    **Validates: Requirements 1.4**
    """

    @given(
        input_string=st.text(min_size=0, max_size=5000),
        output_string=st.text(min_size=0, max_size=5000),
    )
    @h_settings(max_examples=150)
    @pytest.mark.asyncio
    async def test_fallback_token_estimation_matches_char_div_4(
        self, input_string: str, output_string: str
    ) -> None:
        """When token metadata is absent, token counts equal len(text) // 4."""
        expected_input_tokens = len(input_string) // 4
        expected_output_tokens = len(output_string) // 4

        # Build a fake LLM response with NO token usage metadata
        mock_response = MagicMock()
        mock_response.content = output_string
        mock_response.response_metadata = {}

        mock_llm = AsyncMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        persisted_records: list[dict] = []

        async def capture_persist(**kwargs):
            persisted_records.append(kwargs)

        async def fake_cb_call(fn, *a, **kw):
            return await fn(*a, **kw)

        with (
            patch("agents.llm_factory.get_llm", return_value=mock_llm),
            patch(
                "agents.llm_factory._circuit_breaker.call",
                side_effect=fake_cb_call,
            ),
            patch(
                "agents.llm_factory._persist_awe_record",
                side_effect=capture_persist,
            ),
        ):
            from agents.llm_factory import invoke_llm

            await invoke_llm(
                input_string,
                agent_type="tutor_hint",
                learner_id="LRN-prop2",
                cohort_id="COH-prop2",
                learner_tier="cohort",
            )

        assert len(persisted_records) == 1
        record = persisted_records[0]

        assert record["token_count_input"] == expected_input_tokens, (
            f"Expected input tokens {expected_input_tokens}, got {record['token_count_input']}"
        )
        assert record["token_count_output"] == expected_output_tokens, (
            f"Expected output tokens {expected_output_tokens}, got {record['token_count_output']}"
        )

    @given(
        input_string=st.text(min_size=0, max_size=5000),
        output_string=st.text(min_size=0, max_size=5000),
    )
    @h_settings(max_examples=150)
    @pytest.mark.asyncio
    async def test_fallback_triggers_only_when_metadata_absent(
        self, input_string: str, output_string: str
    ) -> None:
        """Fallback path is used when response_metadata has no token_usage or usage keys."""
        mock_response = MagicMock()
        mock_response.content = output_string
        # Explicitly empty — no token_usage, no usage key
        mock_response.response_metadata = {}

        mock_llm = AsyncMock()
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        persisted_records: list[dict] = []

        async def capture_persist(**kwargs):
            persisted_records.append(kwargs)

        async def fake_cb_call(fn, *a, **kw):
            return await fn(*a, **kw)

        with (
            patch("agents.llm_factory.get_llm", return_value=mock_llm),
            patch(
                "agents.llm_factory._circuit_breaker.call",
                side_effect=fake_cb_call,
            ),
            patch(
                "agents.llm_factory._persist_awe_record",
                side_effect=capture_persist,
            ),
        ):
            from agents.llm_factory import invoke_llm

            await invoke_llm(
                input_string,
                agent_type="tutor_hint",
                learner_id="LRN-prop2b",
                cohort_id="COH-prop2b",
                learner_tier="cohort",
            )

        assert len(persisted_records) == 1
        record = persisted_records[0]

        # Cost should be computed from the fallback token estimates
        expected_cost = compute_cost(
            "gpt-4o-mini",
            len(input_string) // 4,
            len(output_string) // 4,
        )
        assert record["estimated_cost_usd"] == pytest.approx(expected_cost, abs=1e-12)


# ---------------------------------------------------------------------------
# Property 9: Foundation tier always selects mini model
# Feature: ai-cost-controls-cohort-economics, Property 9: Foundation tier always selects mini model
# Validates: Requirements 4.5
# ---------------------------------------------------------------------------


class TestFoundationTierAlwaysSelectsMiniModel:
    """Property 9: Foundation tier always selects mini model.

    For any agent_type string (including unknown types), when learner_tier
    is "foundation", get_model_for_agent(agent_type, "foundation") shall
    return "gpt-4o-mini".

    **Validates: Requirements 4.5**
    """

    @given(agent_type=st.text(min_size=0, max_size=200))
    @h_settings(max_examples=150)
    def test_foundation_tier_always_returns_mini(self, agent_type: str) -> None:
        """get_model_for_agent() returns 'gpt-4o-mini' for any agent_type when tier is foundation."""
        from agents.llm_factory import get_model_for_agent

        result = get_model_for_agent(agent_type, "foundation")

        assert result == "gpt-4o-mini", (
            f"Expected 'gpt-4o-mini' for agent_type={agent_type!r} with foundation tier, "
            f"got {result!r}"
        )


# ---------------------------------------------------------------------------
# Property 10: Unknown agent type falls back to default model
# Feature: ai-cost-controls-cohort-economics, Property 10: Unknown agent type falls back to default model
# Validates: Requirements 4.10
# ---------------------------------------------------------------------------


class TestUnknownAgentTypeFallbackToDefaultModel:
    """Property 10: Unknown agent type falls back to default model.

    For any string that is not a recognized agent_type in the
    AGENT_MODEL_MAP, get_model_for_agent(unknown_type, "cohort") shall
    return the value of settings.default_model.

    **Validates: Requirements 4.10**
    """

    @given(
        agent_type=st.text(min_size=0, max_size=200).filter(
            lambda x: x not in {
                "tutor_hint",
                "tutor_summarize",
                "dropout_risk",
                "feedback_analysis",
                "executive_report",
                "career_support",
            }
        ),
    )
    @h_settings(max_examples=150)
    def test_unknown_agent_type_returns_default_model(self, agent_type: str) -> None:
        """get_model_for_agent() returns settings.default_model for any unrecognized agent_type with cohort tier."""
        from agents.llm_factory import AGENT_MODEL_MAP, get_model_for_agent
        from config import settings

        # Precondition: agent_type is truly unknown
        assert agent_type not in AGENT_MODEL_MAP

        result = get_model_for_agent(agent_type, "cohort")

        assert result == settings.default_model, (
            f"Expected settings.default_model ({settings.default_model!r}) for unknown "
            f"agent_type={agent_type!r}, got {result!r}"
        )


# ---------------------------------------------------------------------------
# Property 4: Daily cap enforcement by learner tier
# Feature: ai-cost-controls-cohort-economics, Property 4: Daily cap enforcement by learner tier
# Validates: Requirements 2.1, 2.2, 2.3
# ---------------------------------------------------------------------------


class TestDailyCapEnforcementByLearnerTier:
    """Property 4: Daily cap enforcement by learner tier.

    For any learner tier (foundation with cap=10, cohort with cap=50),
    after exactly `cap` allowed requests on a given UTC day, the next
    request shall be rejected with `allowed=False`, and the response
    shall include a `reset_at` timestamp and a message indicating the
    daily limit.

    **Validates: Requirements 2.1, 2.2, 2.3**
    """

    @given(learner_tier=st.sampled_from(["foundation", "cohort"]))
    @h_settings(max_examples=100)
    @pytest.mark.asyncio
    async def test_requests_up_to_cap_are_allowed(
        self, learner_tier: str
    ) -> None:
        """All requests up to the cap limit are allowed for any tier."""
        from agents.ai_cap_service import AiCapService

        expected_cap = 10 if learner_tier == "foundation" else 50

        # Track the simulated Redis counter per key
        counters: dict[str, int] = {}

        async def mock_incr(key: str) -> int:
            counters[key] = counters.get(key, 0) + 1
            return counters[key]

        async def mock_expire(key: str, ttl: int) -> None:
            pass

        service = AiCapService.__new__(AiCapService)
        mock_redis = AsyncMock()
        mock_redis.incr = AsyncMock(side_effect=mock_incr)
        mock_redis.expire = AsyncMock(side_effect=mock_expire)
        service._redis = mock_redis

        learner_id = f"LRN-prop4-{learner_tier}"

        for i in range(1, expected_cap + 1):
            result = await service.check_and_increment(learner_id, learner_tier)
            assert result.allowed is True, (
                f"Request {i}/{expected_cap} should be allowed for {learner_tier} tier, "
                f"but got allowed=False"
            )
            assert result.current_count == i
            assert result.cap == expected_cap

    @given(learner_tier=st.sampled_from(["foundation", "cohort"]))
    @h_settings(max_examples=100)
    @pytest.mark.asyncio
    async def test_request_after_cap_is_rejected(
        self, learner_tier: str
    ) -> None:
        """The request immediately after the cap is reached is rejected with reset_at."""
        from agents.ai_cap_service import AiCapService

        expected_cap = 10 if learner_tier == "foundation" else 50

        counters: dict[str, int] = {}

        async def mock_incr(key: str) -> int:
            counters[key] = counters.get(key, 0) + 1
            return counters[key]

        async def mock_expire(key: str, ttl: int) -> None:
            pass

        service = AiCapService.__new__(AiCapService)
        mock_redis = AsyncMock()
        mock_redis.incr = AsyncMock(side_effect=mock_incr)
        mock_redis.expire = AsyncMock(side_effect=mock_expire)
        service._redis = mock_redis

        learner_id = f"LRN-prop4-reject-{learner_tier}"

        # Exhaust the cap
        for _ in range(expected_cap):
            result = await service.check_and_increment(learner_id, learner_tier)
            assert result.allowed is True

        # The next request (cap + 1) must be rejected
        result = await service.check_and_increment(learner_id, learner_tier)

        assert result.allowed is False, (
            f"Request {expected_cap + 1} should be rejected for {learner_tier} tier "
            f"(cap={expected_cap}), but got allowed=True"
        )
        assert result.current_count == expected_cap + 1
        assert result.cap == expected_cap
        assert result.reset_at is not None and len(result.reset_at) > 0, (
            "Rejected response must include a non-empty reset_at timestamp"
        )


# ---------------------------------------------------------------------------
# Property 5: Cap Redis key pattern generation
# Feature: ai-cost-controls-cohort-economics, Property 5: Cap Redis key pattern generation
# Validates: Requirements 2.4, 2.6
# ---------------------------------------------------------------------------


class TestCapRedisKeyPatternGeneration:
    """Property 5: Cap Redis key pattern generation.

    For any learner_id matching the ``LRN-*`` format and any UTC date,
    the generated Redis key shall match the pattern
    ``ai_cap:{learner_id}:{YYYY-MM-DD}``, and two different dates for
    the same learner shall produce different keys.

    **Validates: Requirements 2.4, 2.6**
    """

    # Strategies -----------------------------------------------------------

    _learner_id_st = st.text(min_size=1, max_size=20).map(lambda x: f"LRN-{x}")
    _date_st = st.dates()

    # Tests ----------------------------------------------------------------

    @given(learner_id=_learner_id_st, date=_date_st)
    @h_settings(max_examples=150, deadline=None)
    def test_key_matches_expected_pattern(
        self, learner_id: str, date
    ) -> None:
        """The key built by _build_key equals ai_cap:{learner_id}:{YYYY-MM-DD}."""
        from datetime import datetime as dt, timezone as tz

        utc_dt = dt(date.year, date.month, date.day, tzinfo=tz.utc)

        from agents.ai_cap_service import AiCapService

        key = AiCapService._build_key(learner_id, utc_dt)

        expected = f"ai_cap:{learner_id}:{date.strftime('%Y-%m-%d')}"
        assert key == expected, f"Expected {expected!r}, got {key!r}"

    @given(learner_id=_learner_id_st, date=_date_st)
    @h_settings(max_examples=150)
    def test_key_starts_with_prefix(
        self, learner_id: str, date
    ) -> None:
        """Every generated key starts with 'ai_cap:'."""
        from datetime import datetime as dt, timezone as tz

        utc_dt = dt(date.year, date.month, date.day, tzinfo=tz.utc)

        from agents.ai_cap_service import AiCapService

        key = AiCapService._build_key(learner_id, utc_dt)
        assert key.startswith("ai_cap:"), f"Key {key!r} missing 'ai_cap:' prefix"

    @given(
        learner_id=_learner_id_st,
        date_a=_date_st,
        date_b=_date_st,
    )
    @h_settings(max_examples=150)
    def test_different_dates_produce_different_keys(
        self, learner_id: str, date_a, date_b
    ) -> None:
        """Two different dates for the same learner produce different keys."""
        from datetime import datetime as dt, timezone as tz
        from hypothesis import assume

        assume(date_a != date_b)

        from agents.ai_cap_service import AiCapService

        key_a = AiCapService._build_key(
            learner_id, dt(date_a.year, date_a.month, date_a.day, tzinfo=tz.utc)
        )
        key_b = AiCapService._build_key(
            learner_id, dt(date_b.year, date_b.month, date_b.day, tzinfo=tz.utc)
        )
        assert key_a != key_b, (
            f"Same key {key_a!r} generated for dates {date_a} and {date_b}"
        )

    @given(learner_id=_learner_id_st)
    @h_settings(max_examples=100)
    @pytest.mark.asyncio
    async def test_check_and_increment_uses_correct_key_pattern(
        self, learner_id: str
    ) -> None:
        """check_and_increment passes a key matching ai_cap:{learner_id}:{YYYY-MM-DD} to Redis INCR."""
        import re

        from agents.ai_cap_service import AiCapService

        service = AiCapService.__new__(AiCapService)
        mock_redis = AsyncMock()
        mock_redis.incr = AsyncMock(return_value=1)
        mock_redis.expire = AsyncMock()
        service._redis = mock_redis

        await service.check_and_increment(learner_id, "cohort")

        mock_redis.incr.assert_called_once()
        actual_key = mock_redis.incr.call_args[0][0]

        pattern = re.compile(
            r"^ai_cap:" + re.escape(learner_id) + r":\d{4}-\d{2}-\d{2}$"
        )
        assert pattern.match(actual_key), (
            f"Redis INCR key {actual_key!r} does not match expected pattern "
            f"ai_cap:{learner_id}:YYYY-MM-DD"
        )


# ---------------------------------------------------------------------------
# Property 6: Tutor cache key generation
# Feature: ai-cost-controls-cohort-economics, Property 6: Tutor cache key generation
# Validates: Requirements 3.2
# ---------------------------------------------------------------------------


class TestTutorCacheKeyGeneration:
    """Property 6: Tutor cache key generation.

    For any module_id and query string, the cache key shall equal
    ``tutor_cache:{module_id}:{sha256(query.strip().lower())}``, and two
    queries differing only in leading/trailing whitespace or casing shall
    produce the same cache key.

    **Validates: Requirements 3.2**
    """

    @given(
        module_id=st.text(min_size=1, max_size=50),
        query=st.text(min_size=1, max_size=500),
    )
    @h_settings(max_examples=150, deadline=None)
    def test_cache_key_matches_expected_pattern(
        self, module_id: str, query: str
    ) -> None:
        """_cache_key() equals tutor_cache:{module_id}:{sha256(normalized_query)}."""
        import hashlib

        from agents.tutor_cache import TutorCache

        normalized = query.strip().lower()
        expected_hash = hashlib.sha256(normalized.encode()).hexdigest()
        expected_key = f"tutor_cache:{module_id}:{expected_hash}"

        result = TutorCache._cache_key(module_id, query)
        assert result == expected_key, f"Expected {expected_key!r}, got {result!r}"

    @given(
        module_id=st.text(min_size=1, max_size=50),
        query=st.text(min_size=1, max_size=500),
        leading_ws=st.text(alphabet=" \t\n\r", min_size=0, max_size=5),
        trailing_ws=st.text(alphabet=" \t\n\r", min_size=0, max_size=5),
    )
    @h_settings(max_examples=150, deadline=None)
    def test_whitespace_normalization_produces_same_key(
        self, module_id: str, query: str, leading_ws: str, trailing_ws: str
    ) -> None:
        """Queries differing only in leading/trailing whitespace produce the same key."""
        from agents.tutor_cache import TutorCache

        key_original = TutorCache._cache_key(module_id, query)
        key_padded = TutorCache._cache_key(module_id, leading_ws + query + trailing_ws)

        assert key_original == key_padded, (
            f"Whitespace-padded query produced different key: "
            f"{key_original!r} vs {key_padded!r}"
        )

    @given(
        module_id=st.text(min_size=1, max_size=50),
        query=st.from_regex(r"[a-zA-Z0-9 ]{1,100}", fullmatch=True),
    )
    @h_settings(max_examples=150, deadline=None)
    def test_case_normalization_produces_same_key(
        self, module_id: str, query: str
    ) -> None:
        """Queries differing only in ASCII casing produce the same key."""
        from agents.tutor_cache import TutorCache

        key_lower = TutorCache._cache_key(module_id, query.lower())
        key_upper = TutorCache._cache_key(module_id, query.upper())

        assert key_lower == key_upper, (
            f"Case-different queries produced different keys: "
            f"{key_lower!r} vs {key_upper!r}"
        )


# ---------------------------------------------------------------------------
# Property 7: Tutor cache response round-trip
# Feature: ai-cost-controls-cohort-economics, Property 7: Tutor cache response round-trip
# Validates: Requirements 3.5
# ---------------------------------------------------------------------------


class TestTutorCacheResponseRoundTrip:
    """Property 7: Tutor cache response round-trip.

    For any valid tutor response object containing explanation, key_concepts,
    and confidence fields, serializing the response to the cache and
    deserializing it back shall produce an object equal to the original.

    **Validates: Requirements 3.5**
    """

    @given(
        explanation=st.text(min_size=0, max_size=2000),
        key_concepts=st.lists(st.text(min_size=1, max_size=100), min_size=0, max_size=10),
        confidence=st.floats(min_value=0.0, max_value=1.0, allow_nan=False),
    )
    @h_settings(max_examples=150, deadline=None)
    @pytest.mark.asyncio
    async def test_response_round_trip_preserves_data(
        self, explanation: str, key_concepts: list[str], confidence: float
    ) -> None:
        """set() then get() returns an object equal to the original response."""
        from agents.tutor_cache import TutorCache

        original = {
            "explanation": explanation,
            "key_concepts": key_concepts,
            "confidence": confidence,
        }

        # In-memory store simulating Redis
        store: dict[str, str] = {}

        async def mock_set(key: str, value: str, ex: int | None = None) -> None:
            store[key] = value

        async def mock_get(key: str) -> str | None:
            return store.get(key)

        cache = TutorCache.__new__(TutorCache)
        mock_redis = AsyncMock()
        mock_redis.set = AsyncMock(side_effect=mock_set)
        mock_redis.get = AsyncMock(side_effect=mock_get)
        cache._redis = mock_redis

        module_id = "MOD-roundtrip"
        query = "test query"

        await cache.set(module_id, query, original)
        result = await cache.get(module_id, query)

        assert result is not None, "Cache returned None after set()"
        assert result["explanation"] == original["explanation"]
        assert result["key_concepts"] == original["key_concepts"]
        assert result["confidence"] == pytest.approx(original["confidence"], abs=1e-12)
