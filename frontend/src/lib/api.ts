/**
 * Shared API client for communicating with the NestJS backend.
 * Uses the NEXT_PUBLIC_API_URL env var, defaulting to http://localhost:3001.
 * All methods return typed responses and handle errors gracefully.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
  return res.json();
}
