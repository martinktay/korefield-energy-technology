/**
 * @file rate-limiter.ts — Token bucket rate limiter for SES API calls.
 * Enforces a configurable maximum send rate (emails per second) to stay
 * within AWS SES account limits. The `acquire()` method blocks (async delay)
 * until a token is available.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default SES sandbox sending rate (emails per second). */
const DEFAULT_MAX_PER_SECOND = 14;

// ---------------------------------------------------------------------------
// RateLimiter
// ---------------------------------------------------------------------------

export class RateLimiter {
  private readonly maxPerSecond: number;
  private tokens: number;
  private lastRefillTime: number;

  /**
   * @param maxPerSecond Maximum number of tokens (sends) allowed per second.
   *                     Must be a positive integer; defaults to 14.
   */
  constructor(maxPerSecond: number) {
    this.maxPerSecond = Math.max(1, Math.floor(maxPerSecond));
    this.tokens = this.maxPerSecond;
    this.lastRefillTime = Date.now();
  }

  /**
   * Acquires a single token. If no tokens are available, blocks (async delay)
   * until the bucket refills enough to provide one.
   */
  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Calculate how long to wait for the next token
    const timeSinceRefill = Date.now() - this.lastRefillTime;
    const msPerToken = 1_000 / this.maxPerSecond;
    const waitMs = Math.max(0, msPerToken - timeSinceRefill);

    await this.delay(waitMs);

    // Refill after waiting and consume a token
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  /**
   * Refills tokens based on elapsed time since the last refill.
   * Tokens accumulate at `maxPerSecond` per second, capped at `maxPerSecond`.
   */
  private refill(): void {
    const now = Date.now();
    const elapsedMs = now - this.lastRefillTime;

    if (elapsedMs <= 0) {
      return;
    }

    const newTokens = (elapsedMs / 1_000) * this.maxPerSecond;
    this.tokens = Math.min(this.maxPerSecond, this.tokens + newTokens);
    this.lastRefillTime = now;
  }

  /** Async delay helper. */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ---------------------------------------------------------------------------
// Factory — reads config from environment
// ---------------------------------------------------------------------------

/**
 * Creates a RateLimiter configured from the `SES_MAX_SEND_RATE` environment
 * variable. Falls back to the default of 14/sec on missing or invalid values,
 * logging a warning.
 */
export function createRateLimiter(): RateLimiter {
  const raw = process.env.SES_MAX_SEND_RATE;

  if (raw === undefined || raw === '') {
    return new RateLimiter(DEFAULT_MAX_PER_SECOND);
  }

  const parsed = parseInt(raw, 10);

  if (isNaN(parsed) || parsed <= 0) {
    console.warn(
      `[RateLimiter] Invalid SES_MAX_SEND_RATE="${raw}". Falling back to default of ${DEFAULT_MAX_PER_SECOND}/sec.`,
    );
    return new RateLimiter(DEFAULT_MAX_PER_SECOND);
  }

  return new RateLimiter(parsed);
}
