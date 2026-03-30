/**
 * @file pyodide-runner.ts — Client-side Python execution via a dedicated Web Worker.
 * Spawns a Web Worker that loads Pyodide (CPython compiled to WebAssembly) and
 * executes code off the main thread. Implements timeout-based termination: if
 * execution exceeds the configurable limit (default 10s), the worker is killed
 * and a fresh one is created for subsequent runs. Reports executionTimeMs in
 * every result.
 */

const DEFAULT_TIMEOUT_MS = 10_000;

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  error: string | null;
  executionTimeMs: number;
}

// ─── Worker Lifecycle ───────────────────────────────────────────

let worker: Worker | null = null;

function getOrCreateWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./pyodide-worker.ts", import.meta.url));
  }
  return worker;
}

function resetWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}

// ─── Public API ─────────────────────────────────────────────────

/**
 * Execute Python code in a Web Worker with timeout protection.
 * If execution exceeds the timeout, the worker is terminated and
 * a fresh one is created for subsequent runs.
 */
export async function runPython(
  code: string,
  options?: { timeoutMs?: number },
): Promise<ExecutionResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const w = getOrCreateWorker();

  return new Promise<ExecutionResult>((resolve) => {
    const timer = setTimeout(() => {
      resetWorker();
      resolve({
        stdout: "",
        stderr: "",
        error: "Execution terminated: time limit exceeded",
        executionTimeMs: timeoutMs,
      });
    }, timeoutMs);

    w.onmessage = (e: MessageEvent<ExecutionResult>) => {
      clearTimeout(timer);
      resolve(e.data);
    };

    w.onerror = (e) => {
      clearTimeout(timer);
      resetWorker();
      resolve({
        stdout: "",
        stderr: "",
        error: e.message || "Worker error",
        executionTimeMs: 0,
      });
    };

    w.postMessage({ type: "execute", code });
  });
}
