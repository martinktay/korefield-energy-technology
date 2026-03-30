/** @file rate-limiter.spec.ts — Property-based tests for the token bucket rate limiter. */

import * as fc from 'fast-check';
import { RateLimiter } from '../services/rate-limiter';

// ---------------------------------------------------------------------------
// Property 9: Rate limiter enforces maximum send rate
// ---------------------------------------------------------------------------

describe('Property 9: Rate limiter enforces maximum send rate', () => {
  /**
   * **Validates: Requirements 16.1, 16.2**
   *
   * For any configured maxPerSecond (2-5) and a burst of maxPerSecond + 1,
   * verify elapsed time meets minimum threshold. The token bucket starts
   * with maxPerSecond tokens, so acquiring one extra token must take at
   * least 1000/maxPerSecond ms (with a conservative 50% tolerance for
   * timer imprecision).
   */
  it(
    'should enforce minimum elapsed time when burst exceeds token capacity',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 5 }),
          async (maxPerSecond) => {
            // Acquire exactly 1 token beyond capacity to keep wait times short
            const burstSize = maxPerSecond + 1;
            const limiter = new RateLimiter(maxPerSecond);

            const start = Date.now();

            for (let i = 0; i < burstSize; i++) {
              await limiter.acquire();
            }

            const elapsedMs = Date.now() - start;

            // One extra token requires ~1000/maxPerSecond ms of waiting.
            // Use 50% of theoretical minimum as a conservative threshold.
            const theoreticalMinMs = (1 / maxPerSecond) * 1000;
            const conservativeMinMs = theoreticalMinMs * 0.5;

            expect(elapsedMs).toBeGreaterThanOrEqual(conservativeMinMs);
          },
        ),
        { numRuns: 20 },
      );
    },
    30_000,
  );
});
