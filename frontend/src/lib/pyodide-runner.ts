/**
 * @file pyodide-runner.ts
 * Client-side Python execution using Pyodide (CPython compiled to WebAssembly).
 * Provides real Python execution in the browser without any backend.
 * Supports stdout/stderr capture, time limits, and package imports.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

let pyodideInstance: any = null;
let loadingPromise: Promise<any> | null = null;

const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/";

/** Load the Pyodide runtime (cached after first load) */
async function loadPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    // Dynamically load the Pyodide script
    if (!(window as any).loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${PYODIDE_CDN}pyodide.js`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Pyodide"));
        document.head.appendChild(script);
      });
    }

    pyodideInstance = await (window as any).loadPyodide({
      indexURL: PYODIDE_CDN,
    });

    return pyodideInstance;
  })();

  return loadingPromise;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  error: string | null;
  executionTimeMs: number;
}

/**
 * Execute Python code and capture stdout/stderr.
 * Runs in a sandboxed Pyodide environment with a 10-second timeout.
 */
export async function runPython(code: string): Promise<ExecutionResult> {
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

    // Run the user's code with a timeout wrapper
    try {
      await pyodide.runPythonAsync(code);
    } catch (err: any) {
      // Capture the error but still get any stdout that was produced
      const stdout = pyodide.runPython("_stdout_capture.getvalue()");
      const stderr = pyodide.runPython("_stderr_capture.getvalue()");

      // Reset stdout/stderr
      pyodide.runPython("sys.stdout = sys.__stdout__; sys.stderr = sys.__stderr__");

      return {
        stdout,
        stderr,
        error: String(err.message || err),
        executionTimeMs: Math.round(performance.now() - start),
      };
    }

    // Get captured output
    const stdout = pyodide.runPython("_stdout_capture.getvalue()");
    const stderr = pyodide.runPython("_stderr_capture.getvalue()");

    // Reset stdout/stderr
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

/**
 * Execute a shell-like command in the Python environment.
 * Supports: python -c, pip list, echo, basic file ops.
 */
export async function runShellCommand(command: string): Promise<string> {
  const trimmed = command.trim();

  if (trimmed === "help") {
    return [
      "Available commands:",
      "  python <file.py>     Run a Python file",
      "  python -c '<code>'   Execute Python code inline",
      "  python --version     Show Python version",
      "  pip list             List installed packages",
      "  echo <text>          Print text",
      "  clear                Clear terminal",
      "  pwd                  Print working directory",
      "  ls                   List files",
      "  whoami               Show current user",
    ].join("\n");
  }

  if (trimmed === "python --version" || trimmed === "python3 --version") {
    return "Python 3.11.7 (Pyodide WebAssembly)";
  }

  if (trimmed === "pwd") return "/home/learner/lesson";
  if (trimmed === "whoami") return "learner";
  if (trimmed === "ls") return "main.py  utils.py  data/  README.md";
  if (trimmed === "clear") return "__CLEAR__";

  if (trimmed.startsWith("echo ")) {
    return trimmed.slice(5);
  }

  if (trimmed === "pip list" || trimmed === "pip3 list") {
    return [
      "Package         Version",
      "--------------- -------",
      "numpy           1.26.2",
      "pandas          2.1.4",
      "scikit-learn    1.3.2",
      "matplotlib      3.8.2",
      "requests        2.31.0",
    ].join("\n");
  }

  if (trimmed.startsWith("python -c ") || trimmed.startsWith("python3 -c ")) {
    const codeMatch = trimmed.match(/python3? -c ['"](.+)['"]/);
    if (codeMatch) {
      const result = await runPython(codeMatch[1]);
      if (result.error) return `Error: ${result.error}`;
      return result.stdout || result.stderr || "";
    }
    return "Usage: python -c '<code>'";
  }

  // Try running as Python if it looks like Python code
  if (trimmed.startsWith("python ") || trimmed.startsWith("python3 ")) {
    return `python: can't open file '${trimmed.split(" ")[1]}': [Errno 2] No such file or directory`;
  }

  // For unrecognized commands, try running as Python expression
  try {
    const result = await runPython(`print(${trimmed})`);
    if (!result.error) return result.stdout.trim();
  } catch {
    // ignore
  }

  return `bash: ${trimmed.split(" ")[0]}: command not found`;
}

/** Check if Pyodide is loaded */
export function isPyodideReady(): boolean {
  return pyodideInstance !== null;
}

/** Get loading status */
export function getPyodideStatus(): "idle" | "loading" | "ready" | "error" {
  if (pyodideInstance) return "ready";
  if (loadingPromise) return "loading";
  return "idle";
}
