/**
 * @file pyodide-runner.property.test.ts — Property-based tests for the Pyodide
 * Web Worker lifecycle. Validates that Python code runs in a Web Worker, timeout
 * terminates the worker and a new one is available, and ExecutionResult always
 * contains executionTimeMs.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";

// ─── Web Worker Mock ────────────────────────────────────────────

type MessageHandler = ((e: MessageEvent) => void) | null;
type ErrorHandler = ((e: ErrorEvent) => void) | null;

interface MockWorkerInstance {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  onmessage: MessageHandler;
  onerror: ErrorHandler;
  _simulateResult: (data: {
    stdout: string;
    stderr: string;
    error: string | null;
    executionTimeMs: number;
  }) => void;
  _simulateError: (message: string) => void;
}

let workerInstances: MockWorkerInstance[] = [];

function createMockWorker(): MockWorkerInstance {
  const instance: MockWorkerInstance = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    onmessage: null,
    onerror: null,
    _simulateResult(data) {
      if (this.onmessage) {
        this.onmessage(new MessageEvent("message", { data }));
      }
    },
    _simulateError(message) {
      if (this.onerror) {
        this.onerror(new ErrorEvent("error", { message }));
      }
    },
  };
  workerInstances.push(instance);
  return instance;
}

describe("Pyodide Web Worker Lifecycle — Property 21", () => {
  /**
   * **Validates: Requirements 12.1, 12.2, 12.4, 12.5, 12.6**
   *
   * For any Python code execution, the code should run inside a Web Worker
   * (not the main thread). If execution exceeds the configured timeout, the
   * worker should be terminated and a new worker should be available for
   * subsequent executions. The ExecutionResult should always contain
   * executionTimeMs and, on timeout, a user-friendly error message.
   */

  let runPython: typeof import("@/lib/pyodide-runner").runPython;

  beforeEach(async () => {
    vi.useFakeTimers();
    workerInstances = [];

    // Reset modules so pyodide-runner's module-level `worker` is null
    vi.resetModules();
    vi.stubGlobal(
      "Worker",
      vi.fn().mockImplementation(() => createMockWorker()),
    );

    const mod = await import("@/lib/pyodide-runner");
    runPython = mod.runPython;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("code is sent to a Web Worker via postMessage for any Python code string", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 500 }),
        async (code) => {
          // Reset module state for each iteration
          workerInstances = [];
          vi.resetModules();
          vi.stubGlobal(
            "Worker",
            vi.fn().mockImplementation(() => createMockWorker()),
          );
          const mod = await import("@/lib/pyodide-runner");

          const promise = mod.runPython(code);

          // A Worker should have been constructed
          expect(workerInstances.length).toBeGreaterThanOrEqual(1);

          // The worker should have received the code via postMessage
          const latestWorker = workerInstances[workerInstances.length - 1];
          expect(latestWorker.postMessage).toHaveBeenCalledWith({
            type: "execute",
            code,
          });

          // Resolve the promise
          latestWorker._simulateResult({
            stdout: "",
            stderr: "",
            error: null,
            executionTimeMs: 5,
          });

          await promise;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("ExecutionResult always contains executionTimeMs as a non-negative number on success", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 0, maxLength: 200 }),
        fc.nat({ max: 10000 }),
        async (code, execTime) => {
          workerInstances = [];
          vi.resetModules();
          vi.stubGlobal(
            "Worker",
            vi.fn().mockImplementation(() => createMockWorker()),
          );
          const mod = await import("@/lib/pyodide-runner");

          const promise = mod.runPython(code);

          const latestWorker = workerInstances[workerInstances.length - 1];
          latestWorker._simulateResult({
            stdout: "ok",
            stderr: "",
            error: null,
            executionTimeMs: execTime,
          });

          const result = await promise;

          expect(result).toHaveProperty("executionTimeMs");
          expect(typeof result.executionTimeMs).toBe("number");
          expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("on timeout the worker is terminated and result contains executionTimeMs and error message", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.integer({ min: 100, max: 5000 }),
        async (code, timeoutMs) => {
          workerInstances = [];
          vi.resetModules();
          vi.stubGlobal(
            "Worker",
            vi.fn().mockImplementation(() => createMockWorker()),
          );
          const mod = await import("@/lib/pyodide-runner");

          const promise = mod.runPython(code, { timeoutMs });

          const workerBeforeTimeout =
            workerInstances[workerInstances.length - 1];

          // Advance time past the timeout — worker never responds
          vi.advanceTimersByTime(timeoutMs + 10);

          const result = await promise;

          // Worker should have been terminated
          expect(workerBeforeTimeout.terminate).toHaveBeenCalled();

          // Result must contain executionTimeMs
          expect(result).toHaveProperty("executionTimeMs");
          expect(typeof result.executionTimeMs).toBe("number");
          expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);

          // Result must contain a user-friendly error message about time
          expect(result.error).toBeTruthy();
          expect(typeof result.error).toBe("string");
          expect(result.error!.toLowerCase()).toContain("time");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("after timeout a new worker is created for the next execution", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 100, max: 2000 }),
        async (code1, code2, timeoutMs) => {
          workerInstances = [];
          vi.resetModules();
          vi.stubGlobal(
            "Worker",
            vi.fn().mockImplementation(() => createMockWorker()),
          );
          const mod = await import("@/lib/pyodide-runner");

          // First run — will timeout
          const promise1 = mod.runPython(code1, { timeoutMs });
          const firstWorker = workerInstances[workerInstances.length - 1];

          vi.advanceTimersByTime(timeoutMs + 10);
          await promise1;

          expect(firstWorker.terminate).toHaveBeenCalled();

          const workerCountAfterFirst = workerInstances.length;

          // Second run — should create a new worker
          const promise2 = mod.runPython(code2);
          const secondWorker = workerInstances[workerInstances.length - 1];

          // A new worker instance should have been created
          expect(workerInstances.length).toBe(workerCountAfterFirst + 1);
          expect(secondWorker).not.toBe(firstWorker);

          // The new worker should receive the second code
          expect(secondWorker.postMessage).toHaveBeenCalledWith({
            type: "execute",
            code: code2,
          });

          // Resolve second run
          secondWorker._simulateResult({
            stdout: "done",
            stderr: "",
            error: null,
            executionTimeMs: 10,
          });

          const result2 = await promise2;
          expect(result2.error).toBeNull();
          expect(result2).toHaveProperty("executionTimeMs");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("ExecutionResult always contains executionTimeMs on worker error", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (code, errorMsg) => {
          workerInstances = [];
          vi.resetModules();
          vi.stubGlobal(
            "Worker",
            vi.fn().mockImplementation(() => createMockWorker()),
          );
          const mod = await import("@/lib/pyodide-runner");

          const promise = mod.runPython(code);

          const latestWorker = workerInstances[workerInstances.length - 1];
          latestWorker._simulateError(errorMsg);

          const result = await promise;

          expect(result).toHaveProperty("executionTimeMs");
          expect(typeof result.executionTimeMs).toBe("number");
          expect(result.error).toBeTruthy();
        },
      ),
      { numRuns: 100 },
    );
  });
});
