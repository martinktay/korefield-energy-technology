"""Tutor Cache — Redis-backed response cache for tutor queries.

Caches complete tutor responses keyed by module ID and a SHA-256 hash of
the normalized query string. TTL is 15 minutes. Fails open on Redis
errors for both reads and writes.
"""

from __future__ import annotations

import hashlib
import json
import logging

import redis.asyncio as aioredis

from config import settings

logger = logging.getLogger("ai_services")


class TutorCache:
    """Redis cache for tutor lesson delivery responses."""

    TTL_SECONDS = 15 * 60  # 15 minutes

    def __init__(self, redis_url: str | None = None) -> None:
        url = redis_url or getattr(settings, "redis_url", "redis://localhost:6379")
        self._redis: aioredis.Redis = aioredis.from_url(
            url, decode_responses=True
        )

    @staticmethod
    def _cache_key(module_id: str, query: str) -> str:
        """Build the cache key from module ID and normalized query hash."""
        normalized = query.strip().lower()
        query_hash = hashlib.sha256(normalized.encode()).hexdigest()
        return f"tutor_cache:{module_id}:{query_hash}"

    async def get(self, module_id: str, query: str) -> dict | None:
        """Retrieve a cached tutor response.

        Returns ``None`` on cache miss or Redis failure (fail-open).
        """
        key = self._cache_key(module_id, query)
        try:
            raw = await self._redis.get(key)
            if raw is None:
                return None
            return json.loads(raw)
        except Exception as exc:
            logger.warning(
                "tutor_cache_read_failed",
                extra={"key": key, "error": str(exc)},
            )
            return None

    async def set(self, module_id: str, query: str, response: dict) -> None:
        """Store a tutor response in the cache with TTL.

        Non-blocking on Redis failure (fire-and-forget).
        """
        key = self._cache_key(module_id, query)
        try:
            await self._redis.set(key, json.dumps(response), ex=self.TTL_SECONDS)
        except Exception as exc:
            logger.warning(
                "tutor_cache_write_failed",
                extra={"key": key, "error": str(exc)},
            )
