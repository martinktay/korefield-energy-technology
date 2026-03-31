"""Property-based tests for the circuit breaker state machine.

Uses hypothesis to verify that the CircuitBreaker class transitions
correctly between CLOSED, OPEN, and HALF_OPEN states for any arbitrary
sequence of success/failure outcomes.  Tests exercise the state machine
directly — no HTTP endpoints are involved.

Each test references its design document property and validates specific
requirements from the production-readiness-hardening spec.
"""

from __future__ import annotations

import time
from unittest.mock import AsyncMock, patch

import pytest
from hypothesis import given, settings as h_settings, strategies as st

from agents.circuit_breaker import CircuitBreaker, CircuitOpenError, CircuitState


# ---------------------------------------------------------------------------
# Strategies
# ---------------------------------------------------------------------------

# Configurable thresholds (keep small for fast tests but realistic)
_threshold_st = st.integers(min_value=1, max_value=10)

# Cooldown in seconds (use small values so we can simulate elapsed time)
_cooldown_st = st.floats(min_value=0.1, max_value=5.0, allow_nan=False, allow_infinity=False)

# Window in seconds
_window_st = st.floats(min_value=1.0, max_value=120.0, allow_nan=False, allow_infinity=False)

# Outcome: True = success, False = failure
_outcome_st = st.booleans()

# Sequence of outcomes for state machine exploration
_outcome_sequence_st = st.lists(_outcome_st, min_size=1, max_size=50)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _succeeding_func() -> str:
    """Async function that always succeeds."""
    return "ok"


async def _failing_func() -> str:
    """Async function that always raises."""
    raise RuntimeError("LLM provider error")


# ---------------------------------------------------------------------------
# Property 18: Circuit Breaker State Machine
# Feature: production-readiness-hardening, Property 18
# Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6
# ---------------------------------------------------------------------------


class TestCircuitBreakerStateMachine:
    """Property 18: Circuit Breaker State Machine.

    For any sequence of LLM call outcomes (success/failure), the circuit
    breaker should transition correctly: CLOSED → OPEN after
    failure_threshold failures within the window, OPEN rejects all calls,
    OPEN → HALF_OPEN after cooldown, HALF_OPEN → CLOSED on probe success,
    HALF_OPEN → OPEN on probe failure.

    **Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6**
    """

    # ---------------------------------------------------------------
    # 10.2  CLOSED → OPEN after threshold failures within window
    # ---------------------------------------------------------------

    @given(threshold=_threshold_st)
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_closed_to_open_after_threshold_failures(
        self,
        threshold: int,
    ) -> None:
        """After exactly *threshold* consecutive failures within the
        window the breaker must transition from CLOSED to OPEN."""
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=300,  # large so it stays OPEN
            window_seconds=600,
        )

        assert cb.state == CircuitState.CLOSED

        for i in range(threshold):
            with pytest.raises(RuntimeError):
                await cb.call(_failing_func)

        assert cb.state == CircuitState.OPEN, (
            f"Expected OPEN after {threshold} failures, got {cb.state}"
        )

    # ---------------------------------------------------------------
    # 10.3  OPEN rejects all calls with CircuitOpenError
    # ---------------------------------------------------------------

    @given(
        threshold=_threshold_st,
        extra_calls=st.integers(min_value=1, max_value=10),
    )
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_open_rejects_all_calls(
        self,
        threshold: int,
        extra_calls: int,
    ) -> None:
        """While OPEN (and cooldown has not elapsed), every call must
        raise CircuitOpenError."""
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=300,
            window_seconds=600,
        )

        # Drive to OPEN
        for _ in range(threshold):
            with pytest.raises(RuntimeError):
                await cb.call(_failing_func)

        assert cb.state == CircuitState.OPEN

        # All subsequent calls should be rejected
        for _ in range(extra_calls):
            with pytest.raises(CircuitOpenError):
                await cb.call(_succeeding_func)

        # State should remain OPEN
        assert cb.state == CircuitState.OPEN

    # ---------------------------------------------------------------
    # 10.4  OPEN → HALF_OPEN after cooldown elapses
    # ---------------------------------------------------------------

    @given(threshold=_threshold_st)
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_open_to_half_open_after_cooldown(
        self,
        threshold: int,
    ) -> None:
        """After the cooldown period elapses the breaker should
        transition from OPEN to HALF_OPEN on the next call attempt."""
        cooldown = 1.0
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=cooldown,
            window_seconds=600,
        )

        # Drive to OPEN
        for _ in range(threshold):
            with pytest.raises(RuntimeError):
                await cb.call(_failing_func)

        assert cb.state == CircuitState.OPEN

        # Simulate cooldown elapsed by patching time.time
        opened_at = cb._opened_at
        with patch("agents.circuit_breaker.time") as mock_time:
            mock_time.time.return_value = opened_at + cooldown + 0.1

            # The next call triggers the OPEN → HALF_OPEN transition
            # and then executes the function (success path)
            result = await cb.call(_succeeding_func)

        # After a successful probe the breaker resets to CLOSED
        # but it must have passed through HALF_OPEN
        assert cb.state == CircuitState.CLOSED
        assert result == "ok"

    # ---------------------------------------------------------------
    # 10.5  HALF_OPEN → CLOSED on probe success
    # ---------------------------------------------------------------

    @given(threshold=_threshold_st)
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_half_open_to_closed_on_success(
        self,
        threshold: int,
    ) -> None:
        """A successful probe call in HALF_OPEN should reset the breaker
        to CLOSED with a clean failure history."""
        cooldown = 1.0
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=cooldown,
            window_seconds=600,
        )

        # Drive to OPEN
        for _ in range(threshold):
            with pytest.raises(RuntimeError):
                await cb.call(_failing_func)

        assert cb.state == CircuitState.OPEN

        # Simulate cooldown elapsed
        opened_at = cb._opened_at
        with patch("agents.circuit_breaker.time") as mock_time:
            mock_time.time.return_value = opened_at + cooldown + 0.1
            result = await cb.call(_succeeding_func)

        assert cb.state == CircuitState.CLOSED, (
            f"Expected CLOSED after successful probe, got {cb.state}"
        )
        assert result == "ok"
        assert cb.failure_count == 0, (
            "Failure count should be reset to 0 after successful probe"
        )

    # ---------------------------------------------------------------
    # 10.6  HALF_OPEN → OPEN on probe failure
    # ---------------------------------------------------------------

    @given(threshold=_threshold_st)
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_half_open_to_open_on_failure(
        self,
        threshold: int,
    ) -> None:
        """A failed probe call in HALF_OPEN should reopen the breaker."""
        cooldown = 1.0
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=cooldown,
            window_seconds=600,
        )

        # Drive to OPEN
        for _ in range(threshold):
            with pytest.raises(RuntimeError):
                await cb.call(_failing_func)

        assert cb.state == CircuitState.OPEN

        # Simulate cooldown elapsed, then fail the probe
        opened_at = cb._opened_at
        with patch("agents.circuit_breaker.time") as mock_time:
            mock_time.time.return_value = opened_at + cooldown + 0.1
            with pytest.raises(RuntimeError):
                await cb.call(_failing_func)

        assert cb.state == CircuitState.OPEN, (
            f"Expected OPEN after failed probe, got {cb.state}"
        )

    # ---------------------------------------------------------------
    # Combined: arbitrary outcome sequences
    # ---------------------------------------------------------------

    @given(
        threshold=_threshold_st,
        outcomes=_outcome_sequence_st,
    )
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_arbitrary_outcome_sequence_respects_state_machine(
        self,
        threshold: int,
        outcomes: list[bool],
    ) -> None:
        """For any random sequence of success/failure outcomes the
        circuit breaker state must always be one of the three valid
        states and transitions must follow the documented rules."""
        cooldown = 0.5
        window = 600.0
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=cooldown,
            window_seconds=window,
        )

        fake_now = time.time()

        for outcome in outcomes:
            prev_state = cb.state

            with patch("agents.circuit_breaker.time") as mock_time:
                mock_time.time.return_value = fake_now

                if prev_state == CircuitState.OPEN:
                    if fake_now - cb._opened_at < cooldown:
                        # Cooldown not elapsed — must reject
                        with pytest.raises(CircuitOpenError):
                            await cb.call(
                                _succeeding_func if outcome else _failing_func,
                            )
                        assert cb.state == CircuitState.OPEN
                    else:
                        # Cooldown elapsed — transitions to HALF_OPEN
                        if outcome:
                            result = await cb.call(_succeeding_func)
                            assert cb.state == CircuitState.CLOSED
                            assert result == "ok"
                        else:
                            with pytest.raises(RuntimeError):
                                await cb.call(_failing_func)
                            assert cb.state == CircuitState.OPEN
                elif prev_state == CircuitState.HALF_OPEN:
                    if outcome:
                        result = await cb.call(_succeeding_func)
                        assert cb.state == CircuitState.CLOSED
                    else:
                        with pytest.raises(RuntimeError):
                            await cb.call(_failing_func)
                        assert cb.state == CircuitState.OPEN
                else:
                    # CLOSED
                    if outcome:
                        result = await cb.call(_succeeding_func)
                        assert cb.state == CircuitState.CLOSED
                    else:
                        with pytest.raises(RuntimeError):
                            await cb.call(_failing_func)
                        # May or may not have tripped to OPEN
                        if cb.failure_count >= threshold:
                            assert cb.state == CircuitState.OPEN
                        else:
                            assert cb.state == CircuitState.CLOSED

            # Advance time slightly for next iteration
            fake_now += 0.05

            # Ensure state is always valid
            assert cb.state in (
                CircuitState.CLOSED,
                CircuitState.OPEN,
                CircuitState.HALF_OPEN,
            ), f"Invalid state: {cb.state}"


# ---------------------------------------------------------------------------
# Property 19: Circuit Breaker Logs State Transitions
# Feature: production-readiness-hardening, Property 19
# Validates: Requirements 10.7
# ---------------------------------------------------------------------------


import logging as _logging
from contextlib import contextmanager
from typing import Generator


class _TransitionLogHandler(_logging.Handler):
    """Custom handler that collects circuit breaker transition records."""

    def __init__(self) -> None:
        super().__init__()
        self.records: list[_logging.LogRecord] = []

    def emit(self, record: _logging.LogRecord) -> None:
        if record.getMessage() == "circuit_breaker_transition":
            self.records.append(record)

    def clear(self) -> None:
        self.records.clear()

    def get_transitions(self) -> list[dict]:
        """Extract transition dicts from captured records."""
        return [
            {
                "previous_state": getattr(r, "previous_state", None),
                "new_state": getattr(r, "new_state", None),
                "failure_count": getattr(r, "failure_count", None),
                "timestamp": getattr(r, "timestamp", None),
            }
            for r in self.records
        ]


@contextmanager
def _capture_transition_logs() -> Generator[_TransitionLogHandler, None, None]:
    """Context manager that attaches a handler to the ai_services logger
    and yields it for inspection.  Compatible with Hypothesis (no pytest
    fixtures required)."""
    handler = _TransitionLogHandler()
    handler.setLevel(_logging.INFO)
    logger = _logging.getLogger("ai_services")
    logger.addHandler(handler)
    prev_level = logger.level
    logger.setLevel(_logging.INFO)
    try:
        yield handler
    finally:
        logger.removeHandler(handler)
        logger.setLevel(prev_level)


class TestCircuitBreakerLogging:
    """Property 19: Circuit Breaker Logs State Transitions.

    For any state transition, verify a log entry is emitted with previous
    state, new state, failure count, and timestamp.

    **Validates: Requirements 10.7**
    """

    # ---------------------------------------------------------------
    # CLOSED → OPEN transition emits log
    # ---------------------------------------------------------------

    @given(threshold=_threshold_st)
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_closed_to_open_logs_transition(
        self,
        threshold: int,
    ) -> None:
        """Driving the breaker from CLOSED → OPEN must emit a log entry
        with previous_state='closed', new_state='open', a non-negative
        failure_count, and a numeric timestamp."""
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=300,
            window_seconds=600,
        )

        with _capture_transition_logs() as handler:
            for _ in range(threshold):
                with pytest.raises(RuntimeError):
                    await cb.call(_failing_func)

        logs = handler.get_transitions()
        closed_to_open = [
            l for l in logs
            if l["previous_state"] == "closed" and l["new_state"] == "open"
        ]
        assert len(closed_to_open) >= 1, (
            f"Expected at least one CLOSED→OPEN log entry, got {logs}"
        )
        entry = closed_to_open[0]
        assert isinstance(entry["failure_count"], int) and entry["failure_count"] >= 0
        assert isinstance(entry["timestamp"], float) and entry["timestamp"] > 0

    # ---------------------------------------------------------------
    # OPEN → HALF_OPEN transition emits log
    # ---------------------------------------------------------------

    @given(threshold=_threshold_st)
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_open_to_half_open_logs_transition(
        self,
        threshold: int,
    ) -> None:
        """After cooldown elapses, the OPEN → HALF_OPEN transition must
        emit a log entry with the correct states, failure count, and
        timestamp."""
        cooldown = 1.0
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=cooldown,
            window_seconds=600,
        )

        # Drive to OPEN
        for _ in range(threshold):
            with pytest.raises(RuntimeError):
                await cb.call(_failing_func)

        assert cb.state == CircuitState.OPEN

        opened_at = cb._opened_at
        with _capture_transition_logs() as handler:
            with patch("agents.circuit_breaker.time") as mock_time:
                mock_time.time.return_value = opened_at + cooldown + 0.1
                # Successful probe triggers OPEN→HALF_OPEN then HALF_OPEN→CLOSED
                await cb.call(_succeeding_func)

        logs = handler.get_transitions()
        open_to_half = [
            l for l in logs
            if l["previous_state"] == "open" and l["new_state"] == "half_open"
        ]
        assert len(open_to_half) >= 1, (
            f"Expected OPEN→HALF_OPEN log entry, got {logs}"
        )
        entry = open_to_half[0]
        assert isinstance(entry["failure_count"], int) and entry["failure_count"] >= 0
        assert isinstance(entry["timestamp"], float) and entry["timestamp"] > 0

    # ---------------------------------------------------------------
    # HALF_OPEN → CLOSED transition emits log (probe success)
    # ---------------------------------------------------------------

    @given(threshold=_threshold_st)
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_half_open_to_closed_logs_transition(
        self,
        threshold: int,
    ) -> None:
        """A successful probe in HALF_OPEN must emit a log entry for the
        HALF_OPEN → CLOSED transition."""
        cooldown = 1.0
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=cooldown,
            window_seconds=600,
        )

        # Drive to OPEN
        for _ in range(threshold):
            with pytest.raises(RuntimeError):
                await cb.call(_failing_func)

        opened_at = cb._opened_at
        with _capture_transition_logs() as handler:
            with patch("agents.circuit_breaker.time") as mock_time:
                mock_time.time.return_value = opened_at + cooldown + 0.1
                await cb.call(_succeeding_func)

        logs = handler.get_transitions()
        half_to_closed = [
            l for l in logs
            if l["previous_state"] == "half_open" and l["new_state"] == "closed"
        ]
        assert len(half_to_closed) >= 1, (
            f"Expected HALF_OPEN→CLOSED log entry, got {logs}"
        )
        entry = half_to_closed[0]
        assert isinstance(entry["failure_count"], int) and entry["failure_count"] >= 0
        assert isinstance(entry["timestamp"], float) and entry["timestamp"] > 0

    # ---------------------------------------------------------------
    # HALF_OPEN → OPEN transition emits log (probe failure)
    # ---------------------------------------------------------------

    @given(threshold=_threshold_st)
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_half_open_to_open_logs_transition(
        self,
        threshold: int,
    ) -> None:
        """A failed probe in HALF_OPEN must emit a log entry for the
        HALF_OPEN → OPEN transition."""
        cooldown = 1.0
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=cooldown,
            window_seconds=600,
        )

        # Drive to OPEN
        for _ in range(threshold):
            with pytest.raises(RuntimeError):
                await cb.call(_failing_func)

        opened_at = cb._opened_at
        with _capture_transition_logs() as handler:
            with patch("agents.circuit_breaker.time") as mock_time:
                mock_time.time.return_value = opened_at + cooldown + 0.1
                with pytest.raises(RuntimeError):
                    await cb.call(_failing_func)

        logs = handler.get_transitions()
        half_to_open = [
            l for l in logs
            if l["previous_state"] == "half_open" and l["new_state"] == "open"
        ]
        assert len(half_to_open) >= 1, (
            f"Expected HALF_OPEN→OPEN log entry, got {logs}"
        )
        entry = half_to_open[0]
        assert isinstance(entry["failure_count"], int) and entry["failure_count"] >= 0
        assert isinstance(entry["timestamp"], float) and entry["timestamp"] > 0

    # ---------------------------------------------------------------
    # Arbitrary transitions: every state change emits a valid log
    # ---------------------------------------------------------------

    @given(
        threshold=_threshold_st,
        outcomes=_outcome_sequence_st,
    )
    @h_settings(max_examples=100, deadline=None)
    @pytest.mark.asyncio
    async def test_all_transitions_logged_with_required_fields(
        self,
        threshold: int,
        outcomes: list[bool],
    ) -> None:
        """For any arbitrary sequence of success/failure outcomes, every
        state transition must produce a log entry containing
        previous_state, new_state, failure_count (int >= 0), and
        timestamp (positive float)."""
        cooldown = 0.5
        cb = CircuitBreaker(
            failure_threshold=threshold,
            cooldown_seconds=cooldown,
            window_seconds=600,
        )

        fake_now = time.time()

        with _capture_transition_logs() as handler:
            for outcome in outcomes:
                prev_state = cb.state

                with patch("agents.circuit_breaker.time") as mock_time:
                    mock_time.time.return_value = fake_now

                    if prev_state == CircuitState.OPEN:
                        if fake_now - cb._opened_at < cooldown:
                            with pytest.raises(CircuitOpenError):
                                await cb.call(
                                    _succeeding_func if outcome else _failing_func,
                                )
                        else:
                            if outcome:
                                await cb.call(_succeeding_func)
                            else:
                                with pytest.raises(RuntimeError):
                                    await cb.call(_failing_func)
                    elif prev_state == CircuitState.HALF_OPEN:
                        if outcome:
                            await cb.call(_succeeding_func)
                        else:
                            with pytest.raises(RuntimeError):
                                await cb.call(_failing_func)
                    else:
                        if outcome:
                            await cb.call(_succeeding_func)
                        else:
                            with pytest.raises(RuntimeError):
                                await cb.call(_failing_func)

                fake_now += 0.05

        # Validate every logged transition has the required fields
        logs = handler.get_transitions()
        for entry in logs:
            assert entry["previous_state"] is not None, (
                f"Log entry missing previous_state: {entry}"
            )
            assert entry["new_state"] is not None, (
                f"Log entry missing new_state: {entry}"
            )
            assert entry["previous_state"] != entry["new_state"], (
                f"Log entry has same previous and new state: {entry}"
            )
            assert isinstance(entry["failure_count"], int) and entry["failure_count"] >= 0, (
                f"Log entry has invalid failure_count: {entry}"
            )
            assert isinstance(entry["timestamp"], float) and entry["timestamp"] > 0, (
                f"Log entry has invalid timestamp: {entry}"
            )
