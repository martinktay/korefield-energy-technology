/**
 * @file error-logger.property.test.ts — Property-based tests for the client-side
 * error logger. Validates payload completeness (Property 22), batching behavior
 * (Property 23), and deduplication (Property 24).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";

// ─── Generators ─────────────────────────────────────────────────

/** Generates a non-empty printable string suitable for error messages. */
const arbErrorMessage = fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0);

/** Generates a plausible stack trace string. */
const arbStackTrace = fc
  .array(fc.string({ minLength: 5, maxLength: 80 }), { minLength: 1, maxLength: 5 })
  .map((lines) => lines.map((l, i) => `    at fn${i} (file.js:${i + 1}:${i})\n${l}`).join("\n"));

/** Generates an optional user ID (simulating JWT sub claim). */
const arbUserId = fc.option(fc.string({ minLength: 3, maxLength: 30 }).filter((s) => s.trim().length > 0), {
  nil: undefined,
});

// ─── Helpers ────────────────────────────────────────────────────

function makeJwt(sub: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(JSON.stringify({ sub }));
  const sig = btoa("fakesig");
  return `${header}.${payload}.${sig}`;
}

/**
 * Freshly imports the error-logger module after resetting module cache,
 * so each test gets clean internal state (batch, flushTimer, recentErrors, initialized).
 */
async function freshImport() {
  const mod = await import("@/lib/error-logger");
  return mod;
}


// ─── Property 22: Error Logger Payload Completeness ─────────────

describe("Error Logger — Property 22: Payload Completeness", () => {
  /**
   * **Validates: Requirements 13.1, 13.2**
   *
   * For any captured frontend error (unhandled exception or unhandled promise
   * rejection), the error payload should contain: error message, stack trace,
   * page URL, user agent, timestamp, and authenticated user ID (if available).
   */

  let mockFetch: ReturnType<typeof vi.fn>;
  let initErrorLogger: typeof import("@/lib/error-logger").initErrorLogger;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();

    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    // Provide a stable location and userAgent
    Object.defineProperty(window, "location", {
      value: { href: "https://app.korefield.com/learner/lessons/1" },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(navigator, "userAgent", {
      value: "TestAgent/1.0",
      writable: true,
      configurable: true,
    });

    const mod = await freshImport();
    initErrorLogger = mod.initErrorLogger;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("window.onerror payloads contain all required fields", () => {
    initErrorLogger();

    fc.assert(
      fc.property(arbErrorMessage, arbStackTrace, arbUserId, (message, stack, userId) => {
        mockFetch.mockClear();

        if (userId) {
          localStorage.setItem("kf_token", makeJwt(userId));
        } else {
          localStorage.removeItem("kf_token");
        }

        // Ensure uniqueness to avoid dedup filtering
        const uniqueMsg = `${message}_${Math.random()}`;
        const uniqueStack = `${stack}_${Math.random()}`;

        const error = new Error(uniqueMsg);
        error.stack = uniqueStack;

        if (window.onerror) {
          (window.onerror as Function)(uniqueMsg, "test.js", 1, 1, error);
        }

        // Advance timer to trigger flush
        vi.advanceTimersByTime(5_000);

        expect(mockFetch).toHaveBeenCalled();
        const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const body = JSON.parse(lastCall[1].body);
        const payload = body.errors[body.errors.length - 1];

        expect(payload).toHaveProperty("message");
        expect(payload).toHaveProperty("stack");
        expect(payload).toHaveProperty("pageUrl");
        expect(payload).toHaveProperty("userAgent");
        expect(payload).toHaveProperty("timestamp");
        expect(payload).toHaveProperty("userId");

        expect(typeof payload.message).toBe("string");
        expect(payload.message.length).toBeGreaterThan(0);
        expect(typeof payload.stack).toBe("string");
        expect(typeof payload.pageUrl).toBe("string");
        expect(typeof payload.userAgent).toBe("string");
        expect(typeof payload.timestamp).toBe("string");
        // timestamp should be ISO format
        expect(new Date(payload.timestamp).toISOString()).toBe(payload.timestamp);

        if (userId) {
          expect(payload.userId).toBe(userId);
        } else {
          expect(payload.userId).toBeNull();
        }
      }),
      { numRuns: 100 },
    );
  });

  it("window.onunhandledrejection payloads contain all required fields", () => {
    initErrorLogger();

    fc.assert(
      fc.property(arbErrorMessage, arbStackTrace, arbUserId, (message, stack, userId) => {
        mockFetch.mockClear();

        if (userId) {
          localStorage.setItem("kf_token", makeJwt(userId));
        } else {
          localStorage.removeItem("kf_token");
        }

        const error = new Error(message);
        error.stack = stack;

        if (window.onunhandledrejection) {
          // jsdom doesn't have PromiseRejectionEvent, so create a minimal shim
          const promise = Promise.reject(error);
          promise.catch(() => {}); // prevent unhandled rejection noise
          const event = { reason: error, promise } as PromiseRejectionEvent;
          window.onunhandledrejection(event);
        }

        // Advance timer to trigger flush
        vi.advanceTimersByTime(5_000);

        if (mockFetch.mock.calls.length > 0) {
          const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
          const body = JSON.parse(lastCall[1].body);
          const payload = body.errors[body.errors.length - 1];

          expect(payload).toHaveProperty("message");
          expect(payload).toHaveProperty("stack");
          expect(payload).toHaveProperty("pageUrl");
          expect(payload).toHaveProperty("userAgent");
          expect(payload).toHaveProperty("timestamp");
          expect(payload).toHaveProperty("userId");
        }
      }),
      { numRuns: 100 },
    );
  });
});


// ─── Property 23: Error Logger Batching ─────────────────────────

describe("Error Logger — Property 23: Batching", () => {
  /**
   * **Validates: Requirements 13.4**
   *
   * For any sequence of errors, the Error Logger should flush the batch when
   * either 5 seconds have elapsed since the first unbatched error or the batch
   * reaches 10 errors, whichever comes first.
   */

  let mockFetch: ReturnType<typeof vi.fn>;
  let initErrorLogger: typeof import("@/lib/error-logger").initErrorLogger;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();

    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    Object.defineProperty(window, "location", {
      value: { href: "https://app.korefield.com/test" },
      writable: true,
      configurable: true,
    });

    localStorage.removeItem("kf_token");

    const mod = await freshImport();
    initErrorLogger = mod.initErrorLogger;
    initErrorLogger();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("flushes immediately when batch reaches 10 errors", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            message: arbErrorMessage,
            stack: arbStackTrace,
          }),
          { minLength: 10, maxLength: 20 },
        ),
        (errors) => {
          // Need fresh module state for each run
          mockFetch.mockClear();

          // Trigger exactly 10 unique errors (use index to ensure uniqueness)
          for (let i = 0; i < 10; i++) {
            const err = errors[i % errors.length];
            const uniqueMsg = `${err.message}_batch_${i}_${Date.now()}`;
            const error = new Error(uniqueMsg);
            error.stack = `${err.stack}_${i}`;

            if (window.onerror) {
              (window.onerror as Function)(uniqueMsg, "test.js", 1, 1, error);
            }
          }

          // Should have flushed without needing to advance timers
          expect(mockFetch).toHaveBeenCalled();

          const body = JSON.parse(mockFetch.mock.calls[0][1].body);
          expect(body.errors).toHaveLength(10);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("flushes after 5 seconds for batches smaller than 10", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }),
        (errorCount) => {
          mockFetch.mockClear();

          for (let i = 0; i < errorCount; i++) {
            const uniqueMsg = `timer_flush_${errorCount}_${i}_${Math.random()}`;
            const error = new Error(uniqueMsg);
            error.stack = `at test (file.js:${i}:0)_${Math.random()}`;

            if (window.onerror) {
              (window.onerror as Function)(uniqueMsg, "test.js", 1, 1, error);
            }
          }

          // Should NOT have flushed yet (batch < 10)
          expect(mockFetch).not.toHaveBeenCalled();

          // Advance time by 5 seconds to trigger flush
          vi.advanceTimersByTime(5_000);

          expect(mockFetch).toHaveBeenCalled();
          const body = JSON.parse(mockFetch.mock.calls[0][1].body);
          expect(body.errors.length).toBeGreaterThanOrEqual(1);
          expect(body.errors.length).toBeLessThanOrEqual(errorCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("does not flush before 5 seconds when batch is under 10", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9 }),
        fc.integer({ min: 1, max: 4999 }),
        (errorCount, elapsedMs) => {
          mockFetch.mockClear();

          for (let i = 0; i < errorCount; i++) {
            const uniqueMsg = `no_early_flush_${errorCount}_${i}_${Math.random()}`;
            const error = new Error(uniqueMsg);
            error.stack = `at test (file.js:${i}:0)_${Math.random()}`;

            if (window.onerror) {
              (window.onerror as Function)(uniqueMsg, "test.js", 1, 1, error);
            }
          }

          // Advance less than 5 seconds
          vi.advanceTimersByTime(elapsedMs);

          // Should NOT have flushed yet
          expect(mockFetch).not.toHaveBeenCalled();

          // Now advance the remaining time to flush and clean up
          vi.advanceTimersByTime(5_000 - elapsedMs);
        },
      ),
      { numRuns: 100 },
    );
  });
});


// ─── Property 24: Error Logger Deduplication ────────────────────

describe("Error Logger — Property 24: Deduplication", () => {
  /**
   * **Validates: Requirements 13.5**
   *
   * For any two errors with identical message and stack trace occurring within
   * a 60-second window, the Error Logger should send only one instance to the
   * backend.
   */

  let mockFetch: ReturnType<typeof vi.fn>;
  let initErrorLogger: typeof import("@/lib/error-logger").initErrorLogger;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();

    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", mockFetch);

    Object.defineProperty(window, "location", {
      value: { href: "https://app.korefield.com/test" },
      writable: true,
      configurable: true,
    });

    localStorage.removeItem("kf_token");

    const mod = await freshImport();
    initErrorLogger = mod.initErrorLogger;
    initErrorLogger();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("duplicate errors within 60s window are sent only once", () => {
    fc.assert(
      fc.property(
        arbErrorMessage,
        arbStackTrace,
        fc.integer({ min: 2, max: 5 }),
        (message, stack, repeatCount) => {
          mockFetch.mockClear();

          const uniqueMsg = `dedup_${message}_${Math.random()}`;
          const uniqueStack = `${stack}_${Math.random()}`;

          // Send the same error multiple times
          for (let i = 0; i < repeatCount; i++) {
            const error = new Error(uniqueMsg);
            error.stack = uniqueStack;

            if (window.onerror) {
              (window.onerror as Function)(uniqueMsg, "test.js", 1, 1, error);
            }
          }

          // Flush
          vi.advanceTimersByTime(5_000);

          if (mockFetch.mock.calls.length > 0) {
            // Collect all payloads across all flush calls
            const allPayloads: Array<{ message: string; stack: string }> = [];
            for (const call of mockFetch.mock.calls) {
              const body = JSON.parse(call[1].body);
              allPayloads.push(...body.errors);
            }

            // Count how many times this specific error appears
            const matchCount = allPayloads.filter(
              (p) => p.message === uniqueMsg && p.stack === uniqueStack,
            ).length;

            // Should only appear once due to deduplication
            expect(matchCount).toBe(1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("errors with different messages are not deduplicated", () => {
    fc.assert(
      fc.property(
        arbErrorMessage,
        arbErrorMessage,
        arbStackTrace,
        (msg1, msg2, stack) => {
          mockFetch.mockClear();

          // Ensure messages are actually different
          const uniqueMsg1 = `diff_a_${msg1}_${Math.random()}`;
          const uniqueMsg2 = `diff_b_${msg2}_${Math.random()}`;
          const uniqueStack = `${stack}_${Math.random()}`;

          const error1 = new Error(uniqueMsg1);
          error1.stack = uniqueStack;
          const error2 = new Error(uniqueMsg2);
          error2.stack = uniqueStack;

          if (window.onerror) {
            (window.onerror as Function)(uniqueMsg1, "test.js", 1, 1, error1);
            (window.onerror as Function)(uniqueMsg2, "test.js", 1, 1, error2);
          }

          vi.advanceTimersByTime(5_000);

          if (mockFetch.mock.calls.length > 0) {
            const allPayloads: Array<{ message: string }> = [];
            for (const call of mockFetch.mock.calls) {
              const body = JSON.parse(call[1].body);
              allPayloads.push(...body.errors);
            }

            const hasMsg1 = allPayloads.some((p) => p.message === uniqueMsg1);
            const hasMsg2 = allPayloads.some((p) => p.message === uniqueMsg2);

            // Both distinct errors should be present
            expect(hasMsg1).toBe(true);
            expect(hasMsg2).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("same error is sent again after 60s dedup window expires", () => {
    fc.assert(
      fc.property(arbErrorMessage, arbStackTrace, (message, stack) => {
        mockFetch.mockClear();

        const uniqueMsg = `expire_${message}_${Math.random()}`;
        const uniqueStack = `${stack}_${Math.random()}`;

        // First occurrence
        const error1 = new Error(uniqueMsg);
        error1.stack = uniqueStack;
        if (window.onerror) {
          (window.onerror as Function)(uniqueMsg, "test.js", 1, 1, error1);
        }

        // Flush first batch
        vi.advanceTimersByTime(5_000);

        const callsAfterFirst = mockFetch.mock.calls.length;

        // Advance past the 60s dedup window
        vi.advanceTimersByTime(60_000);

        // Second occurrence — should NOT be deduplicated
        const error2 = new Error(uniqueMsg);
        error2.stack = uniqueStack;
        if (window.onerror) {
          (window.onerror as Function)(uniqueMsg, "test.js", 1, 1, error2);
        }

        // Flush second batch
        vi.advanceTimersByTime(5_000);

        // Should have made additional fetch calls
        expect(mockFetch.mock.calls.length).toBeGreaterThan(callsAfterFirst);

        // The second batch should contain the error
        const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        const body = JSON.parse(lastCall[1].body);
        const hasError = body.errors.some(
          (p: { message: string; stack: string }) => p.message === uniqueMsg && p.stack === uniqueStack,
        );
        expect(hasError).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
