"""Circuit breaker for LLM API fault tolerance.

Implements a three-state circuit breaker (CLOSED → OPEN → HALF_OPEN) that
wraps all LLM invocations.  When the upstream LLM provider experiences
repeated failures the breaker opens, rejecting calls immediately with
``CircuitOpenError`` until a cooldown period elapses and a probe request
is allowed through.

State transitions are logged for operational observability.
"""

from __future__ import annotations

import logging
import time
from collections import deque
from enum import Enum
from typing import Any, Awaitable, Callable, TypeVar

logger = logging.getLogger("ai_services")

T = TypeVar("T")


class CircuitState(Enum):
    """Possible states of the circuit breaker."""

    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitOpenError(Exception):
    """Raised when the circuit breaker is open and rejecting calls."""


class CircuitBreaker:
    """Async-compatible circuit breaker for LLM API calls.

    Args:
        failure_threshold: Number of failures within *window_seconds*
            before transitioning from CLOSED → OPEN.  Default ``5``.
        cooldown_seconds: Seconds to wait in OPEN state before
            transitioning to HALF_OPEN.  Default ``30``.
        window_seconds: Rolling window in seconds for counting
            failures.  Default ``60``.
    """

    def __init__(
        self,
        failure_threshold: int = 5,
        cooldown_seconds: float = 30,
        window_seconds: float = 60,
    ) -> None:
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.window_seconds = window_seconds

        self._state = CircuitState.CLOSED
        self._failures: deque[float] = deque()
        self._opened_at: float = 0.0

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def state(self) -> CircuitState:
        """Current circuit breaker state."""
        return self._state

    @property
    def failure_count(self) -> int:
        """Number of failures within the current window."""
        self._prune_old_failures()
        return len(self._failures)

    # ------------------------------------------------------------------
    # Core logic
    # ------------------------------------------------------------------

    async def call(
        self,
        func: Callable[..., Awaitable[T]],
        *args: Any,
        **kwargs: Any,
    ) -> T:
        """Execute *func* through the circuit breaker.

        Raises:
            CircuitOpenError: If the breaker is OPEN and cooldown has
                not yet elapsed.
        """
        now = time.time()

        if self._state == CircuitState.OPEN:
            if now - self._opened_at >= self.cooldown_seconds:
                self._transition(CircuitState.HALF_OPEN)
            else:
                raise CircuitOpenError("Service temporarily degraded")

        try:
            result = await func(*args, **kwargs)
        except Exception:
            self._record_failure(now)
            raise

        # Successful call in HALF_OPEN → reset to CLOSED
        if self._state == CircuitState.HALF_OPEN:
            self._reset()

        return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _record_failure(self, now: float | None = None) -> None:
        """Record a failure and potentially open the circuit."""
        now = now or time.time()
        self._failures.append(now)
        self._prune_old_failures()

        if self._state == CircuitState.HALF_OPEN:
            # Probe failed — reopen
            self._opened_at = now
            self._transition(CircuitState.OPEN)
        elif self._state == CircuitState.CLOSED:
            if len(self._failures) >= self.failure_threshold:
                self._opened_at = now
                self._transition(CircuitState.OPEN)

    def _prune_old_failures(self) -> None:
        """Remove failures outside the rolling window."""
        cutoff = time.time() - self.window_seconds
        while self._failures and self._failures[0] < cutoff:
            self._failures.popleft()

    def _reset(self) -> None:
        """Reset to CLOSED state with a clean failure history."""
        self._failures.clear()
        self._transition(CircuitState.CLOSED)

    def _transition(self, new_state: CircuitState) -> None:
        """Log and apply a state transition."""
        prev = self._state
        if prev == new_state:
            return
        self._state = new_state
        logger.info(
            "circuit_breaker_transition",
            extra={
                "previous_state": prev.value,
                "new_state": new_state.value,
                "failure_count": len(self._failures),
                "timestamp": time.time(),
            },
        )
