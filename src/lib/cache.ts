/**
 * Response Cache - In-memory cache for API responses
 * Use for frequently accessed data with short TTL (5 min - 1 hour)
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ResponseCache {
  private cache = new Map<string, CacheEntry<any>>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Set cache value with TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in milliseconds (default 5 minutes)
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000) {
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!);
    }

    // Set new cache entry
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // Set auto-expiry timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  /**
   * Get cache value
   * @param key - Cache key
   * @returns Cached data or null if expired/missing
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    if (!this.cache.has(key)) return false;

    const entry = this.cache.get(key)!;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    // Clear all timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    // Clear cache
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
      })),
    };
  }
}

export const apiCache = new ResponseCache();

/**
 * Browser-side IndexedDB wrapper for large data sets
 * Use for storing 100K+ records locally
 */

export class IndexedDBStore {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;

  constructor(dbName: string, storeName: string) {
    this.dbName = dbName;
    this.storeName = storeName;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        }
      };
    });
  }

  /**
   * Add data to store
   */
  async add<T>(data: T[]): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);

      data.forEach((item) => {
        store.add(item);
      });

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  /**
   * Get all data from store
   */
  async getAll<T>(): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T[]);
    });
  }

  /**
   * Get data by index
   */
  async getByIndex<T>(indexName: string, value: any): Promise<T[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result as T[]);
    });
  }

  /**
   * Clear store
   */
  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
    });
  }

  /**
   * Get store size
   */
  async getSize(): Promise<number> {
    const data = await this.getAll();
    return data.length;
  }
}

/**
 * LRU Cache - Limited size with least-recently-used eviction
 */

export class LRUCache<T> {
  private cache = new Map<string, T>();
  private maxSize: number;
  private accessOrder: string[] = [];

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T) {
    // Remove if exists (will re-add at end)
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
    }

    // Add to cache
    this.cache.set(key, value);
    this.accessOrder.push(key);

    // Evict LRU if over capacity
    if (this.cache.size > this.maxSize) {
      const lruKey = this.accessOrder.shift()!;
      this.cache.delete(lruKey);
    }
  }

  get(key: string): T | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);

    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  getSize(): number {
    return this.cache.size;
  }
}

/**
 * Memoization helper for expensive functions
 */

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: { ttl?: number; maxSize?: number } = {}
): T {
  const cache = new LRUCache(options.maxSize || 100);
  const ttlCache = new Map<string, number>();
  const { ttl = 5 * 60 * 1000 } = options; // 5 min default

  return ((...args: any[]) => {
    const key = JSON.stringify(args);

    // Check TTL
    if (ttlCache.has(key)) {
      const expiry = ttlCache.get(key)!;
      if (Date.now() > expiry) {
        cache.delete(key);
        ttlCache.delete(key);
      } else if (cache.has(key)) {
        return cache.get(key);
      }
    } else if (cache.has(key)) {
      return cache.get(key);
    }

    // Call function and cache result
    const result = fn(...args);
    cache.set(key, result);
    ttlCache.set(key, Date.now() + ttl);

    return result;
  }) as T;
}
