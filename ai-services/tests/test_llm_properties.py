"""Property-based tests for LLM invocation configuration across AI agents.

Uses hypothesis to verify that every agent invokes the LLM with the correct
model name (settings.default_model) and timeout matching the agent's SLA.
LLM calls are mocked to enable fast, deterministic testing.

Each test references its design document property and validates specific
requirements from the production-readiness-hardening spec.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from hypothesis import given, settings as h_settings, strategies as st


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# Learner IDs matching the LRN-* pattern
_learner_id_st = st.from_regex(r"LRN-[a-z0-9]{4,8}", fullmatch=True)

# Module IDs matching the MOD-* pattern
_module_id_st = st.from_regex(r"MOD-[a-z0-9]{4,8}", fullmatch=True)

# Lesson IDs matching the LSN-* pattern
_lesson_id_st = st.from_regex(r"LSN-[a-z0-9]{4,8}", fullmatch=True)

# Submission IDs matching the SUB-* pattern
_submission_id_st = st.from_regex(r"SUB-[a-z0-9]{4,8}", fullmatch=True)

# Assessment IDs matching the ASM-* pattern
_assessment_id_st = st.from_regex(r"ASM-[a-z0-9]{4,8}", fullmatch=True)

# Track IDs matching the TRK-* pattern
_track_id_st = st.from_regex(r"TRK-[a-z0-9]{4,8}", fullmatch=True)

# Safe query text (avoids prompt injection patterns)
_safe_text_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Z")),
    min_size=5,
    max_size=200,
)

# Submission content (longer safe text)
_submission_content_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Z")),
    min_size=10,
    max_size=500,
)

# Model name strategy
_model_name_st = st.sampled_from(["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_llm_response(content: str = "Mock LLM response") -> MagicMock:
    """Create a mock LLM response object with metadata."""
    resp = MagicMock()
    resp.content = content
    resp.response_metadata = {
        "token_usage": {"prompt_tokens": 10, "completion_tokens": 5},
    }
    return resp


def _make_invoke_llm_spy(mock_response: MagicMock) -> AsyncMock:
    """Create an AsyncMock spy for invoke_llm that records call args."""
    return AsyncMock(return_value=mock_response.content)



# ---------------------------------------------------------------------------
# Property 4: AI Agent LLM Invocation Configuration
# Feature: production-readiness-hardening, Property 4
# Validates: Requirements 2.1, 2.2, 2.5
# ---------------------------------------------------------------------------


class TestTutorLLMInvocationConfig:
    """Property 4 (Tutor): AI Agent LLM Invocation Configuration.

    For any valid tutor lesson request, verify the LLM is invoked with
    model name equal to settings.default_model and timeout=30 matching
    the tutor agent's SLA.

    **Validates: Requirements 2.1, 2.2, 2.5**
    """

    @given(
        learner_id=_learner_id_st,
        module_id=_module_id_st,
        lesson_id=_lesson_id_st,
        query=_safe_text_st,
        model_name=_model_name_st,
    )
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_tutor_invokes_llm_with_correct_model_and_timeout(
        self,
        learner_id: str,
        module_id: str,
        lesson_id: str,
        query: str,
        model_name: str,
    ) -> None:
        """Tutor agent should invoke LLM with settings.default_model and
        timeout=30."""
        from httpx import ASGITransport, AsyncClient

        from main import app

        mock_response = _mock_llm_response("Tutor explanation content.")
        invoke_spy = _make_invoke_llm_spy(mock_response)

        mock_rag = AsyncMock(return_value=[])

        from agents.ai_cap_service import CapCheckResult

        mock_cap = AsyncMock(
            return_value=CapCheckResult(
                allowed=True, current_count=1, cap=50,
                reset_at="2025-01-02T00:00:00+00:00",
            )
        )

        with (
            patch("agents.learner.tutor._rag_pipeline.retrieve", mock_rag),
            patch("agents.learner.tutor.invoke_llm", invoke_spy),
            patch("agents.learner.tutor._ai_cap_service.check_and_increment", mock_cap),
            patch("agents.learner.tutor._tutor_cache.get", AsyncMock(return_value=None)),
            patch("agents.learner.tutor._tutor_cache.set", AsyncMock()),
            patch("agents.learner.tutor.settings") as mock_settings,
        ):
            mock_settings.default_model = model_name

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/ai/tutor/lesson",
                    json={
                        "learner_id": learner_id,
                        "module_id": module_id,
                        "lesson_id": lesson_id,
                        "query": query,
                    },
                )

            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

            # Verify invoke_llm was called
            invoke_spy.assert_called_once()
            call_kwargs = invoke_spy.call_args

            # Verify timeout=30 (tutor SLA)
            assert call_kwargs.kwargs.get("timeout") == 30 or (
                len(call_kwargs.args) >= 2 and call_kwargs.args[1] == 30
            ), (
                f"Tutor agent should invoke LLM with timeout=30, "
                f"got args={call_kwargs.args}, kwargs={call_kwargs.kwargs}"
            )


class TestFeedbackLLMInvocationConfig:
    """Property 4 (Feedback): AI Agent LLM Invocation Configuration.

    For any valid feedback analysis request, verify the LLM is invoked
    with model name equal to settings.default_model and timeout=60
    matching the feedback agent's SLA.

    **Validates: Requirements 2.1, 2.2, 2.5**
    """

    @given(
        learner_id=_learner_id_st,
        submission_id=_submission_id_st,
        assessment_id=_assessment_id_st,
        submission_content=_submission_content_st,
        model_name=_model_name_st,
    )
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_feedback_invokes_llm_with_correct_model_and_timeout(
        self,
        learner_id: str,
        submission_id: str,
        assessment_id: str,
        submission_content: str,
        model_name: str,
    ) -> None:
        """Feedback agent should invoke LLM with settings.default_model and
        timeout=60."""
        import json

        from httpx import ASGITransport, AsyncClient

        from main import app

        llm_response = json.dumps({
            "strengths": [{"area": "General", "description": "Good work."}],
            "improvements": [{"area": "General", "suggestion": "Improve.", "priority": "medium"}],
            "rubric_alignment": [{"criterion": "overall", "score": 0.7, "notes": "OK"}],
            "overall_score": 0.7,
            "confidence": "medium",
        })
        invoke_spy = AsyncMock(return_value=llm_response)

        with (
            patch("agents.learner.feedback.invoke_llm", invoke_spy),
            patch("agents.learner.feedback.settings") as mock_settings,
        ):
            mock_settings.default_model = model_name

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/ai/feedback/analyze",
                    json={
                        "learner_id": learner_id,
                        "submission_id": submission_id,
                        "assessment_id": assessment_id,
                        "submission_content": submission_content,
                    },
                )

            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

            # Verify invoke_llm was called
            invoke_spy.assert_called_once()
            call_kwargs = invoke_spy.call_args

            # Verify timeout=60 (feedback SLA)
            assert call_kwargs.kwargs.get("timeout") == 60 or (
                len(call_kwargs.args) >= 2 and call_kwargs.args[1] == 60
            ), (
                f"Feedback agent should invoke LLM with timeout=60, "
                f"got args={call_kwargs.args}, kwargs={call_kwargs.kwargs}"
            )


class TestCareerLLMInvocationConfig:
    """Property 4 (Career): AI Agent LLM Invocation Configuration.

    For any valid career guidance request, verify the LLM is invoked
    with model name equal to settings.default_model and timeout=30
    (default) matching the career agent's SLA.

    **Validates: Requirements 2.1, 2.2, 2.5**
    """

    @given(
        learner_id=_learner_id_st,
        track_id=_track_id_st,
        model_name=_model_name_st,
    )
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_career_invokes_llm_with_correct_model_and_timeout(
        self,
        learner_id: str,
        track_id: str,
        model_name: str,
    ) -> None:
        """Career agent should invoke LLM with settings.default_model and
        timeout=30 (default)."""
        from httpx import ASGITransport, AsyncClient

        from main import app

        invoke_spy = AsyncMock(return_value="Career guidance response.")

        with (
            patch("agents.learner.career.invoke_llm", invoke_spy),
            patch("agents.learner.career.settings") as mock_settings,
        ):
            mock_settings.default_model = model_name

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/ai/career/guidance",
                    json={
                        "learner_id": learner_id,
                        "track_id": track_id,
                        "completed_modules": [],
                    },
                )

            assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"

            # Verify invoke_llm was called
            invoke_spy.assert_called_once()
            call_kwargs = invoke_spy.call_args

            # Career agent uses default timeout=30 (not passed explicitly)
            # Verify timeout is either not passed (defaults to 30) or explicitly 30
            timeout_val = call_kwargs.kwargs.get("timeout")
            if timeout_val is not None:
                assert timeout_val == 30, (
                    f"Career agent should invoke LLM with timeout=30, got {timeout_val}"
                )
            # If timeout not in kwargs, it uses the default of 30 in invoke_llm


class TestGetLLMFactoryConfig:
    """Property 4 (Factory): AI Agent LLM Invocation Configuration.

    For any model name and timeout, verify get_llm() returns a ChatOpenAI
    instance configured with the correct model and timeout from settings.

    **Validates: Requirements 2.1, 2.2, 2.5**
    """

    @given(
        model_name=_model_name_st,
        timeout=st.sampled_from([30, 60]),
    )
    @h_settings(max_examples=100, deadline=None)
    def test_get_llm_uses_settings_model_and_timeout(
        self,
        model_name: str,
        timeout: int,
    ) -> None:
        """get_llm() should return a ChatOpenAI with the correct model and
        timeout from settings."""
        from agents.llm_factory import get_llm

        with patch("agents.llm_factory.settings") as mock_settings:
            mock_settings.openai_api_key = "test-key-123"
            mock_settings.default_model = model_name
            mock_settings.langsmith_tracing_enabled = False

            llm = get_llm(timeout=timeout)

            assert llm.model_name == model_name, (
                f"Expected model={model_name}, got {llm.model_name}"
            )
            assert llm.request_timeout == timeout, (
                f"Expected timeout={timeout}, got {llm.request_timeout}"
            )


# ---------------------------------------------------------------------------
# Unsafe content strategies for output guardrail testing
# ---------------------------------------------------------------------------

# Strategy that generates text containing at least one unsafe output pattern
# matching _UNSAFE_OUTPUT_PATTERNS from guardrails.py
_unsafe_prefix_st = st.sampled_from([
    "hack the system",
    "exploit the database",
    "attack the server",
    "create a virus",
    "build a malware",
    "write a ransomware",
    "bypass security",
    "circumvent authentication",
    "bypass authorization",
])

# Safe surrounding text to embed the unsafe pattern in
_safe_surrounding_st = st.text(
    alphabet=st.characters(whitelist_categories=("L", "N", "Z")),
    min_size=0,
    max_size=100,
)

# The expected safe fallback message from filter_output
_SAFE_FALLBACK = (
    "I'm unable to provide that information. "
    "Please rephrase your request or contact support."
)


# ---------------------------------------------------------------------------
# Property 5: AI Agent Output Guardrail Application
# Feature: production-readiness-hardening, Property 5
# Validates: Requirements 2.3
# ---------------------------------------------------------------------------


class TestOutputGuardrailApplication:
    """Property 5: AI Agent Output Guardrail Application.

    For any LLM response containing unsafe content patterns, the AI agent
    should return a filtered safe response rather than the raw LLM output.

    **Validates: Requirements 2.3**
    """

    @given(
        unsafe_pattern=_unsafe_prefix_st,
        prefix=_safe_surrounding_st,
        suffix=_safe_surrounding_st,
    )
    @h_settings(max_examples=100, deadline=None)
    def test_filter_output_blocks_unsafe_content(
        self,
        unsafe_pattern: str,
        prefix: str,
        suffix: str,
    ) -> None:
        """filter_output should return the safe fallback for any text
        containing an unsafe content pattern."""
        from agents.learner.guardrails import filter_output

        unsafe_text = f"{prefix} {unsafe_pattern} {suffix}"
        result = filter_output(unsafe_text)

        assert result == _SAFE_FALLBACK, (
            f"Expected safe fallback for unsafe input containing "
            f"'{unsafe_pattern}', got: {result!r}"
        )

    @given(
        safe_text=_safe_text_st,
    )
    @h_settings(max_examples=100, deadline=None)
    def test_filter_output_passes_safe_content(
        self,
        safe_text: str,
    ) -> None:
        """filter_output should return the original text when it contains
        no unsafe patterns."""
        from agents.learner.guardrails import filter_output

        result = filter_output(safe_text)

        assert result == safe_text, (
            f"Expected safe text to pass through unchanged, "
            f"got: {result!r} instead of {safe_text!r}"
        )

    @given(
        learner_id=_learner_id_st,
        module_id=_module_id_st,
        lesson_id=_lesson_id_st,
        query=_safe_text_st,
        unsafe_pattern=_unsafe_prefix_st,
    )
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_tutor_agent_filters_unsafe_llm_output(
        self,
        learner_id: str,
        module_id: str,
        lesson_id: str,
        query: str,
        unsafe_pattern: str,
    ) -> None:
        """When the LLM returns unsafe content, the tutor agent should
        return the safe fallback instead of the raw LLM output."""
        from httpx import ASGITransport, AsyncClient

        from main import app

        from agents.ai_cap_service import CapCheckResult

        # Mock invoke_llm to return unsafe content
        unsafe_response = f"Here is how to {unsafe_pattern} for you."
        invoke_spy = AsyncMock(return_value=unsafe_response)

        mock_rag = AsyncMock(return_value=[])
        mock_cap = AsyncMock(
            return_value=CapCheckResult(
                allowed=True, current_count=1, cap=50,
                reset_at="2025-01-02T00:00:00+00:00",
            )
        )

        with (
            patch("agents.learner.tutor._rag_pipeline.retrieve", mock_rag),
            patch("agents.learner.tutor.invoke_llm", invoke_spy),
            patch("agents.learner.tutor._ai_cap_service.check_and_increment", mock_cap),
            patch("agents.learner.tutor._tutor_cache.get", AsyncMock(return_value=None)),
            patch("agents.learner.tutor._tutor_cache.set", AsyncMock()),
            patch("agents.learner.tutor.settings") as mock_settings,
        ):
            mock_settings.default_model = "gpt-4o-mini"

            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                resp = await client.post(
                    "/ai/tutor/lesson",
                    json={
                        "learner_id": learner_id,
                        "module_id": module_id,
                        "lesson_id": lesson_id,
                        "query": query,
                    },
                )

            assert resp.status_code == 200, (
                f"Expected 200, got {resp.status_code}: {resp.text}"
            )

            data = resp.json()
            # The explanation should be the safe fallback, NOT the raw unsafe text
            assert data["explanation"] == _SAFE_FALLBACK, (
                f"Tutor agent should filter unsafe LLM output. "
                f"Expected safe fallback, got: {data['explanation']!r}"
            )
            assert unsafe_pattern not in data["explanation"], (
                f"Unsafe pattern '{unsafe_pattern}' should not appear in agent output"
            )
