/**
 * @file cache.service.ts
 * In-memory cache service with TTL-based expiration.
 * Serves as a development stub — will be replaced by ElastiCache Redis
 * when infrastructure modules are deployed.
 */
import { Injectable, Logger } from '@nestjs/common';

/**
 * Simple in-memory cache service stub.
 * Will be replaced with Redis (ElastiCache) in infrastructure tasks.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, { value: unknown; expiresAt: number }>();

  /** Retrieve a cached value by key. Returns null if missing or expired. */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  /** Store a value with a time-to-live in seconds. */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /** Remove a cached entry by key. */
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }
}
