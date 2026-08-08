/**
 * In-Memory Cache with TTL support
 * Drop-in replacement that can be swapped for Redis later
 * Set REDIS_URL env var to enable Redis mode
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  createdAt: number;
}

class MemoryCache {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private hitCount = 0;
  private missCount = 0;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Cleanup expired entries every 60 seconds
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.missCount++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return entry.data;
  }

  /**
   * Set a cached value with TTL in seconds
   */
  async set<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
    });
  }

  /**
   * Delete a cached value
   */
  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<number> {
    const escaped = pattern
      .split("*")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join(".*");
    const regex = new RegExp(`^${escaped}$`);
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<void> {
    this.store.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  /**
   * Get cache stats
   */
  getStats() {
    const totalRequests = this.hitCount + this.missCount;
    return {
      entries: this.store.size,
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: totalRequests > 0 ? ((this.hitCount / totalRequests) * 100).toFixed(1) + "%" : "0%",
      memoryUsageEstimate: `~${Math.round(this.store.size * 0.5)}KB`,
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Get or Set pattern - fetch from cache or compute and cache
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttlSeconds);
    return data;
  }
}

// Singleton pattern for global cache
const globalForCache = globalThis as typeof globalThis & {
  __appCache?: MemoryCache;
};

export const cache = globalForCache.__appCache ?? new MemoryCache();

if (process.env.NODE_ENV !== "production") {
  globalForCache.__appCache = cache;
}

// Cache key generators
export const cacheKeys = {
  properties: (filters: string) => `properties:${filters}`,
  propertyDetail: (slug: string) => `property:${slug}`,
  agents: () => "agents:all",
  agentDetail: (id: number) => `agent:${id}`,
  stats: () => "admin:stats",
  cities: (city: string) => `city:${city}`,
};
