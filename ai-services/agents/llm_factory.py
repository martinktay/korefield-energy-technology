"""Shared LLM factory with timeout, tracing, circuit breaker, and metering.

Provides a single ``get_llm()`` entry point that returns a configured
``ChatOpenAI`` instance.  All AI agents import from here so model name,
API key, timeout, and tracing are managed in one place.

A module-level singleton ``CircuitBreaker`` wraps every LLM invocation
via ``invoke_llm()`` so cascading failures from an unresponsive provider
do not take down the service.

Also provides model tiering via ``get_model_for_agent()`` and per-call
metering that persists token counts, cost, and metadata to the
``agent_workflow_executions`` table.
"""

from __future__ import annotations

import logging
import time
import uuid

import asyncpg
from langchain_openai import ChatOpenAI

from agents.circuit_breaker import CircuitBreaker, CircuitOpenError
from config import settings

logger = logging.getLogger("ai_services")

# Module-level singleton circuit breaker instance
_circuit_breaker = CircuitBreaker(
    failure_threshold=5,
    cooldown_seconds=30,
    window_seconds=60,
)

# ---------------------------------------------------------------------------
# Model pricing ($ per token)
# ---------------------------------------------------------------------------

MODEL_PRICING: dict[str, dict[str, float]] = {
    "gpt-4o":      {"input": 2.50 / 1_000_000, "output": 10.00 / 1_000_000},
    "gpt-4o-mini": {"input": 0.15 / 1_000_000, "output": 0.60 / 1_000_000},
}

# ---------------------------------------------------------------------------
# Agent → model mapping (cohort tier)
# ---------------------------------------------------------------------------

AGENT_MODEL_MAP: dict[str, str] = {
    "tutor_hint":        "gpt-4o-mini",
    "tutor_summarize":   "gpt-4o-mini",
    "dropout_risk":      "gpt-4o-mini",
    "feedback_analysis": "gpt-4o",
    "executive_report":  "gpt-4o",
    "career_support":    "gpt-4o",
}


def get_model_for_agent(agent_type: str, learner_tier: str = "cohort") -> str:
    """Return the appropriate OpenAI model for a given agent type and tier.

    Foundation tier always returns ``gpt-4o-mini`` regardless of agent type.
    For cohort tier, the model is looked up in ``AGENT_MODEL_MAP``.
    Unknown agent types fall back to ``settings.default_model`` with a warning.
    """
    if learner_tier == "foundation":
        return "gpt-4o-mini"

    model = AGENT_MODEL_MAP.get(agent_type)
    if model is None:
        logger.warning(
            "unknown_agent_type_fallback",
            extra={"agent_type": agent_type, "fallback_model": settings.default_model},
        )
        return settings.default_model
    return model


class LLMNotConfiguredError(Exception):
    """Raised when the LLM API key is missing or empty."""


def get_llm(timeout: int = 30, model: str | None = None) -> ChatOpenAI:
    """Return a configured ``ChatOpenAI`` with timeout and tracing.

    Args:
        timeout: Per-request timeout in seconds.
        model: Optional model override. Defaults to ``settings.default_model``.

    Returns:
        A ready-to-use ``ChatOpenAI`` instance.

    Raises:
        LLMNotConfiguredError: If ``settings.openai_api_key`` is missing.
    """
    if not settings.openai_api_key:
        raise LLMNotConfiguredError("LLM API key not configured")

    resolved_model = model or settings.default_model

    callbacks: list = []
    if settings.langsmith_tracing_enabled:
        try:
            from langsmith import Client
            from langchain_core.tracers import LangChainTracer

            client = Client(
                api_key=settings.langsmith_api_key,
            )
            callbacks.append(
                LangChainTracer(
                    client=client,
                    project_name=settings.langsmith_project,
                )
            )
            logger.debug("langsmith_tracing_attached")
        except Exception as exc:  # pragma: no cover
            logger.warning("langsmith_tracing_failed", extra={"error": str(exc)})

    return ChatOpenAI(
        model=resolved_model,
        api_key=settings.openai_api_key,
        timeout=timeout,
        callbacks=callbacks,
    )


# ---------------------------------------------------------------------------
# Metering helpers
# ---------------------------------------------------------------------------

def compute_cost(
    model_name: str,
    token_count_input: int,
    token_count_output: int,
) -> float:
    """Compute estimated USD cost from token counts and model pricing."""
    pricing = MODEL_PRICING.get(model_name)
    if pricing is None:
        return 0.0
    return (token_count_input * pricing["input"]) + (token_count_output * pricing["output"])


async def _persist_awe_record(
    *,
    prompt: str,
    response_text: str,
    model_name: str,
    token_count_input: int,
    token_count_output: int,
    estimated_cost_usd: float,
    latency_ms: int,
    agent_type: str | None,
    learner_id: str | None,
    cohort_id: str | None,
    cache_hit: bool = False,
) -> None:
    """Persist an AWE metering record to PostgreSQL via asyncpg."""
    record_id = f"AWE-{uuid.uuid4().hex[:8]}"
    try:
        conn = await asyncpg.connect(settings.database_url)
        try:
            await conn.execute(
                """
                INSERT INTO agent_workflow_executions (
                    id, agent_type, status, input_text, output_text,
                    token_count_input, token_count_output, model_name,
                    estimated_cost_usd, cohort_id, learner_id,
                    latency_ms, cache_hit
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                """,
                record_id,
                agent_type,
                "completed",
                prompt[:500],
                response_text[:500],
                token_count_input,
                token_count_output,
                model_name,
                estimated_cost_usd,
                cohort_id,
                learner_id,
                latency_ms,
                cache_hit,
            )
        finally:
            await conn.close()
    except Exception as exc:
        logger.error("awe_record_write_failed", extra={"error": str(exc)})


# ---------------------------------------------------------------------------
# Main invocation entry point
# ---------------------------------------------------------------------------

async def invoke_llm(
    prompt: str,
    timeout: int = 30,
    agent_type: str | None = None,
    learner_id: str | None = None,
    cohort_id: str | None = None,
    learner_tier: str = "cohort",
) -> str:
    """Invoke the LLM through the circuit breaker with metering.

    When ``agent_type`` is provided the model is resolved via
    ``get_model_for_agent()``.  Token usage is extracted from the
    response metadata, cost is computed, and an AWE record is persisted.

    Args:
        prompt: The prompt text to send.
        timeout: Per-request timeout in seconds.
        agent_type: Optional agent type for model selection and metering.
        learner_id: Optional learner ID for metering.
        cohort_id: Optional cohort ID for metering.
        learner_tier: Learner tier (``"foundation"`` or ``"cohort"``).

    Returns:
        The LLM response content as a string.

    Raises:
        LLMNotConfiguredError: If API key is missing.
        CircuitOpenError: If the circuit breaker is open.
    """
    # Resolve model
    model_name: str = settings.default_model
    if agent_type:
        model_name = get_model_for_agent(agent_type, learner_tier)

    llm = get_llm(timeout=timeout, model=model_name)

    start_time = time.time()
    response = await _circuit_breaker.call(llm.ainvoke, prompt)
    latency_ms = round((time.time() - start_time) * 1000)

    response_text: str = response.content

    # Extract token usage from response metadata
    metadata = getattr(response, "response_metadata", {}) or {}
    usage = metadata.get("token_usage") or metadata.get("usage") or {}

    token_count_input = usage.get("prompt_tokens", 0) or usage.get("input_tokens", 0)
    token_count_output = usage.get("completion_tokens", 0) or usage.get("output_tokens", 0)

    # Fallback: character-based estimation when metadata absent
    if not token_count_input and not token_count_output:
        logger.warning(
            "token_metadata_absent_fallback",
            extra={"model": model_name, "agent_type": agent_type},
        )
        token_count_input = len(prompt) // 4
        token_count_output = len(response_text) // 4

    estimated_cost_usd = compute_cost(model_name, token_count_input, token_count_output)

    # Persist metering record (fire-and-forget, errors logged)
    await _persist_awe_record(
        prompt=prompt,
        response_text=response_text,
        model_name=model_name,
        token_count_input=token_count_input,
        token_count_output=token_count_output,
        estimated_cost_usd=estimated_cost_usd,
        latency_ms=latency_ms,
        agent_type=agent_type,
        learner_id=learner_id,
        cohort_id=cohort_id,
    )

    return response_text
