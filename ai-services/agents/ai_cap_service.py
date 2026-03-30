"""AI Cap Service — Redis-backed daily rate limiting for AI tutor hints.

Enforces per-user daily limits on AI tutor hint requests using atomic
Redis INCR counters keyed by learner ID and UTC date. Foundation learners
are capped at 10 requests/day, cohort learners at 50. Fails open when
Redis is unavailable.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone

import redis.asyncio as aioredis

from config import settings

logger = logging.getLogger("ai_services")


@dataclass
class CapCheckResult:
    """Result of a daily cap check."""

    allowed: bool
    current_count: int
    cap: int
    reset_at: str


class AiCapService:
    """Daily AI hint rate limiter backed by Redis."""

    FOUNDATION_CAP = 10
    COHORT_CAP = 50
    TTL_SECONDS = 48 * 3600  # 48 hours

    def __init__(self, redis_url: str | None = None) -> None:
        url = redis_url or getattr(settings, "redis_url", "redis://localhost:6379")
        self._redis: aioredis.Redis = aioredis.from_url(
            url, decode_responses=True
        )

    def _cap_for_tier(self, learner_tier: str) -> int:
        """Return the daily cap for the given learner tier."""
        if learner_tier == "foundation":
            return self.FOUNDATION_CAP
        return self.COHORT_CAP

    @staticmethod
    def _build_key(learner_id: str, date: datetime | None = None) -> str:
        """Build the Redis key for a learner's daily counter."""
        utc_date = (date or datetime.now(timezone.utc)).strftime("%Y-%m-%d")
        return f"ai_cap:{learner_id}:{utc_date}"

    @staticmethod
    def _next_reset_time() -> str:
        """Return the next midnight UTC as an ISO-8601 string."""
        now = datetime.now(timezone.utc)
        tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0)
        if tomorrow <= now:
            from datetime import timedelta
            tomorrow += timedelta(days=1)
        return tomorrow.isoformat()

    async def check_and_increment(
        self, learner_id: str, learner_tier: str = "cohort"
    ) -> CapCheckResult:
        """Atomically increment the daily counter and check against the cap.

        Returns a ``CapCheckResult`` indicating whether the request is allowed.
        Fails open (allows the request) when Redis is unreachable.
        """
        cap = self._cap_for_tier(learner_tier)
        key = self._build_key(learner_id)

        try:
            current_count = await self._redis.incr(key)

            # Set TTL only on first increment (NX = only if no TTL set)
            if current_count == 1:
                await self._redis.expire(key, self.TTL_SECONDS)

            allowed = current_count <= cap
            reset_at = self._next_reset_time()

            return CapCheckResult(
                allowed=allowed,
                current_count=current_count,
                cap=cap,
                reset_at=reset_at,
            )
        except Exception as exc:
            logger.warning(
                "ai_cap_redis_unavailable",
                extra={"learner_id": learner_id, "error": str(exc)},
            )
            # Fail-open: allow the request when Redis is down
            return CapCheckResult(
                allowed=True,
                current_count=0,
                cap=cap,
                reset_at=self._next_reset_time(),
            )
