import { CacheService } from './cache.service';

describe('CacheService', () => {
  let cache: CacheService;

  beforeEach(() => {
    cache = new CacheService();
  });

  it('should return null for missing keys', async () => {
    expect(await cache.get('nonexistent')).toBeNull();
  });

  it('should store and retrieve values', async () => {
    await cache.set('key1', { data: 'hello' }, 60);
    const result = await cache.get<{ data: string }>('key1');
    expect(result).toEqual({ data: 'hello' });
  });

  it('should return null for expired entries', async () => {
    await cache.set('expired', 'value', 0); // 0 second TTL = already expired
    // Small delay to ensure expiry
    await new Promise((r) => setTimeout(r, 10));
    expect(await cache.get('expired')).toBeNull();
  });

  it('should delete entries', async () => {
    await cache.set('to-delete', 'value', 60);
    await cache.del('to-delete');
    expect(await cache.get('to-delete')).toBeNull();
  });
});
