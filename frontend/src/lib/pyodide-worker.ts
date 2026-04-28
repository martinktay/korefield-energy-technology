/**
 * @file pyodide-worker.ts — Dedicated Web Worker for Pyodide Python execution.
 * Loads the Pyodide runtime inside the worker thread and executes Python code
 * received via postMessage. Returns stdout, stderr, errors, and execution time
 * back to the main thread. Isolates Pyodide from the main UI thread to prevent
 * blocking during long-running or infinite-loop code.
 */

/* eslint-disable no-restricted-globals */

declare function importScripts(...urls: string[]): void;

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/";

let pyodideInstance: any = null;
let loadingPromise: Promise<any> | null = null;

/** Load Pyodide inside the worker (cached after first load). */
async function loadPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // Import Pyodide script into the worker
    importScripts(`${PYODIDE_CDN}pyodide.js`);
    pyodideInstance = await (self as any).loadPyodide({ indexURL: PYODIDE_CDN });
    return pyodideInstance;
  })();

  return loadingPromise;
}

/** Execute Python code and return captured output. */
async function executePython(code: string) {
  const start = performance.now();

  try {
    const pyodide = await loadPyodide();

    // Redirect stdout/stderr to capture output
    pyodide.runPython(`
import sys
from io import StringIO
_stdout_capture = StringIO()
_stderr_capture = StringIO()
sys.stdout = _stdout_capture
sys.stderr = _stderr_capture
`);

    try {
      await pyodide.runPythonAsync(code);
    } catch (err: any) {
      const stdout = pyodide.runPython("_stdout_capture.getvalue()");
      const stderr = pyodide.runPython("_stderr_capture.getvalue()");
      pyodide.runPython("sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__");

      return {
        stdout,
        stderr,
        error: String(err.message || err),
        executionTimeMs: Math.round(performance.now() - start),
      };
    }

    const stdout = pyodide.runPython("_stdout_capture.getvalue()");
    const stderr = pyodide.runPython("_stderr_capture.getvalue()");
    pyodide.runPython("sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__");

    return {
      stdout,
      stderr,
      error: null,
      executionTimeMs: Math.round(performance.now() - start),
    };
  } catch (err: any) {
    return {
      stdout: "",
      stderr: "",
      error: String(err.message || err),
      executionTimeMs: Math.round(performance.now() - start),
    };
  }
}

// ─── Message Handler ────────────────────────────────────────────

self.onmessage = async (e: MessageEvent) => {
  const { type, code } = e.data;

  if (type === "execute") {
    const result = await executePython(code);
    self.postMessage(result);
  }
};
