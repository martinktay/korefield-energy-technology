/**
 * @file api.ts — Shared API client for communicating with the NestJS backend.
 * Uses the NEXT_PUBLIC_API_URL env var, defaulting to http://localhost:3001.
 * Includes retry logic with exponential backoff, request timeouts, structured
 * error classes, and an uploadFile helper with progress tracking.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 500;

// ─── Error Types ────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isRetryable(): boolean {
    return this.status >= 500 || this.status === 408 || this.status === 429;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(url: string) {
    super(`Request timed out: ${url}`);
    this.name = "TimeoutError";
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kf_token");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Core Fetch ─────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { timeout?: number; retries?: number },
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = getToken();
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options?.retries ?? MAX_RETRIES;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        let body: unknown;
        try { body = await res.json(); } catch { body = undefined; }
        const err = new ApiError(
          `API error: ${res.status} ${res.statusText}`,
          res.status,
          res.statusText,
          body,
        );

        if (err.isRetryable && attempt < maxRetries) {
          lastError = err;
          await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
          continue;
        }

        throw err;
      }

      if (res.status === 204) return undefined as T;
      return res.json();
    } catch (err) {
      clearTimeout(timer);

      if (err instanceof ApiError) throw err;

      if (err instanceof DOMException && err.name === "AbortError") {
        if (attempt < maxRetries) {
          lastError = new TimeoutError(url);
          await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
          continue;
        }
        throw new TimeoutError(url);
      }

      if (attempt < maxRetries) {
        lastError = new NetworkError(
          err instanceof Error ? err.message : "Network request failed",
        );
        await sleep(RETRY_BASE_MS * Math.pow(2, attempt));
        continue;
      }

      throw new NetworkError(
        err instanceof Error ? err.message : "Network request failed",
      );
    }
  }

  throw lastError ?? new NetworkError("Request failed after retries");
}

// ─── Upload Helper ──────────────────────────────────────────────

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

/**
 * Upload a file to S3 via presigned URL with progress tracking.
 * 1. Requests a presigned URL from the backend
 * 2. Uploads the file directly to S3 using XMLHttpRequest for progress
 * 3. Returns the final file URL
 */
export async function uploadFile(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<{ file_url: string; s3_key: string }> {
  const presign = await apiFetch<{
    upload_url: string;
    file_url: string;
    s3_key: string;
  }>("/content/upload/presign", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type,
    }),
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new ApiError(
          `Upload failed: ${xhr.status}`,
          xhr.status,
          xhr.statusText,
        ));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new NetworkError("File upload failed — check your connection"));
    });

    xhr.addEventListener("timeout", () => {
      reject(new TimeoutError(presign.upload_url));
    });

    xhr.open("PUT", presign.upload_url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.timeout = 300_000;
    xhr.send(file);
  });

  return { file_url: presign.file_url, s3_key: presign.s3_key };
}
