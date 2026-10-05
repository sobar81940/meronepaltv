/**
 * Simple in-memory cache for API responses
 * Reduces database queries and API calls significantly
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class Cache {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Get cached value if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.store.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set cache value with TTL
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Clear cache entries matching pattern
   */
  clearPattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    for (const key of this.store.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.store.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys()),
    };
  }
}

// Global cache instance
export const apiCache = new Cache();

/**
 * Middleware for caching GET responses
 */
export function withCache<T>(
  cacheKey: string,
  cacheTtl: number = 300,
  fn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = apiCache.get<T>(cacheKey);
  if (cached) {
    console.log(`📦 Cache HIT: ${cacheKey}`);
    return Promise.resolve(cached);
  }

  console.log(`📦 Cache MISS: ${cacheKey}`);
  // Execute function and cache result
  return fn().then(data => {
    apiCache.set(cacheKey, data, cacheTtl);
    return data;
  });
}

/**
 * Generate cache key for common patterns
 */
export const cacheKeys = {
  // Settings
  settings: () => 'settings:all',
  settingsByKey: (key: string) => `settings:${key}`,

  // Categories
  allCategories: () => 'categories:all',
  categoryBySlug: (slug: string) => `category:${slug}`,
  categoryNested: () => 'categories:nested',

  // Posts
  recentPosts: (limit: number) => `posts:recent:${limit}`,
  postsByCategory: (category: string, limit: number) => `posts:category:${category}:${limit}`,
  postsByTag: (tag: string, limit: number) => `posts:tag:${tag}:${limit}`,
  postsByProvince: (province: string) => `posts:province:${province}`,
  trendingPosts: (limit: number) => `posts:trending:${limit}`,
  headlines: (limit: number) => `posts:headlines:${limit}`,
  postStats: () => 'posts:stats',

  // Events
  allEvents: () => 'events:all',
  eventsByMonth: (month: string) => `events:month:${month}`,

  // Galleries
  allGalleries: () => 'galleries:all',
  galleriesByCategory: (category: string) => `galleries:category:${category}`,

  // Web Stories
  allWebStories: () => 'webstories:all',
  webStoriesByCategory: (category: string) => `webstories:category:${category}`,

  // Celebrities
  allCelebrities: () => 'celebrities:all',
  celebritiesByCategory: (category: string) => `celebrities:category:${category}`,
};

/**
 * Invalidate cache when data changes
 */
export const invalidateCache = {
  // Invalidate all settings cache
  settings: () => {
    apiCache.clearPattern(/^settings:/);
    console.log('🔄 Invalidated settings cache');
  },

  // Invalidate all categories cache
  categories: () => {
    apiCache.clearPattern(/^categor/);
    console.log('🔄 Invalidated categories cache');
  },

  // Invalidate posts cache
  posts: (category?: string) => {
    if (category) {
      apiCache.delete(cacheKeys.postsByCategory(category, 0));
    } else {
      apiCache.clearPattern(/^posts:/);
    }
    console.log('🔄 Invalidated posts cache');
  },

  // Invalidate events cache
  events: () => {
    apiCache.clearPattern(/^events:/);
    console.log('🔄 Invalidated events cache');
  },

  // Invalidate galleries cache
  galleries: () => {
    apiCache.clearPattern(/^galleries:/);
    console.log('🔄 Invalidated galleries cache');
  },

  // Invalidate web stories cache
  webstories: () => {
    apiCache.clearPattern(/^webstories:/);
    console.log('🔄 Invalidated webstories cache');
  },

  // Clear all cache
  all: () => {
    apiCache.clear();
    console.log('🔄 Cleared all cache');
  },
};

/**
 * Add cache headers to response
 */
export function getCacheHeaders(
  cacheTtl: number = 300,
  isPrivate: boolean = false
): { [key: string]: string } {
  const cacheControl = isPrivate
    ? `private, max-age=${cacheTtl}`
    : `public, max-age=${cacheTtl}, s-maxage=${cacheTtl}`;

  return {
    'Cache-Control': cacheControl,
    'Content-Type': 'application/json',
  };
}
