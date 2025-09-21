/**
 * Performance optimization utilities for ZFlo
 */

export interface CacheOptions {
  maxSize?: number;
  ttl?: number; // Time to live in milliseconds
}

/**
 * Simple LRU cache for expensive operations
 */
export class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize ?? 100;
    this.ttl = options.ttl ?? 300000; // 5 minutes default
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    // Remove if exists
    this.cache.delete(key);

    // Check size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Memoization decorator for expensive functions
 */
export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: CacheOptions = {}
): T {
  const cache = new LRUCache<string, ReturnType<T>>(options);

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const cached = cache.get(key);

    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    const typedResult = result as ReturnType<T>;
    cache.set(key, typedResult);
    return typedResult;
  }) as T;
}

/**
 * Batch processing utility for large arrays
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R> | R,
  batchSize = 50
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) => Promise.resolve(processor(item)))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Debounce utility for frequent operations
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | undefined;

  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}
