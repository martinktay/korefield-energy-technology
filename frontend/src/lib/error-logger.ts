/**
 * @file error-logger.ts — Client-side error logger with batching and deduplication.
 * Captures unhandled exceptions and promise rejections via window.onerror and
 * window.onunhandledrejection. Batches errors (flush every 5s or at 10 errors)
 * and deduplicates identical message+stack within a 60s window. POSTs to
 * /logs/client-errors using raw fetch (not apiFetch) to avoid circular error
 * handling. On network failure, errors are silently discarded.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const FLUSH_INTERVAL_MS = 5_000;
const MAX_BATCH_SIZE = 10;
const DEDUP_WINDOW_MS = 60_000;

interface ErrorPayload {
  message: string;
  stack: string;
  pageUrl: string;
  userAgent: string;
  timestamp: string;
  userId: string | null;
}

// ─── State ──────────────────────────────────────────────────────

let batch: ErrorPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const recentErrors = new Map<string, number>();
let initialized = false;

// ─── Helpers ────────────────────────────────────────────────────

function dedupKey(message: string, stack: string): string {
  return `${message}::${stack}`;
}

function getUserId(): string | null {
  try {
    const token = localStorage.getItem("kf_token");
    if (!token) return null;
    // Attempt to decode JWT payload for user ID
    const parts = token.split(".");
    if (parts.length !== 3) return token;
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub ?? payload.userId ?? null;
  } catch {
    return null;
  }
}

function isDuplicate(message: string, stack: string): boolean {
  const key = dedupKey(message, stack);
  const lastSeen = recentErrors.get(key);
  const now = Date.now();

  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    return true;
  }

  recentErrors.set(key, now);

  recentErrors.forEach((ts, k) => {
    if (now - ts >= DEDUP_WINDOW_MS) recentErrors.delete(k);
  });

  return false;
}

function enqueueError(message: string, stack: string): void {
  if (isDuplicate(message, stack)) return;

  const payload: ErrorPayload = {
    message,
    stack,
    pageUrl: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    timestamp: new Date().toISOString(),
    userId: getUserId(),
  };

  batch.push(payload);

  // Flush immediately if batch is full
  if (batch.length >= MAX_BATCH_SIZE) {
    flush();
    return;
  }

  // Start flush timer if not already running
  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
  }
}

function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (batch.length === 0) return;

  const toSend = batch;
  batch = [];

  // Use raw fetch (not apiFetch) to avoid circular error handling
  fetch(`${API_BASE}/logs/client-errors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ errors: toSend }),
  }).catch(() => {
    // Silently discard on network failure
  });
}

// ─── Public API ─────────────────────────────────────────────────

/** Initialize the error logger by attaching global error handlers. */
export function initErrorLogger(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  window.onerror = (_message, _source, _lineno, _colno, error) => {
    const message = error?.message ?? String(_message);
    const stack = error?.stack ?? `${_source}:${_lineno}:${_colno}`;
    enqueueError(message, stack);
  };

  window.onunhandledrejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? (reason.stack ?? "") : "";
    enqueueError(message, stack);
  };
}
