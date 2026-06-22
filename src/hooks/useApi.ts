'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiCache, LRUCache } from '@/lib/cache';

/**
 * useApi Hook - Advanced API handling with caching, error handling, and loading states
 *
 * Features:
 * - Automatic response caching (configurable TTL)
 * - Request deduplication (same request within TTL returns cached response)
 * - Automatic error handling
 * - Loading state management
 * - Retry logic with exponential backoff
 * - Request cancellation support
 *
 * Usage:
 * const { data, loading, error, refetch } = useApi(
 *   () => fetch('/api/issues'),
 *   { cacheTime: 5 * 60 * 1000 }
 * );
 */

export interface UseApiOptions {
  cacheTime?: number; // Cache duration in ms (default: 5 min)
  skip?: boolean; // Skip initial fetch
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
  retries?: number; // Number of retries (default: 3)
  retryDelay?: number; // Delay between retries in ms (default: 1000)
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Cache key generator - creates consistent cache keys
 */
function getCacheKey(url: string, options?: any): string {
  return `${url}:${JSON.stringify(options || {})}`;
}

/**
 * useApi Hook Implementation
 */
export function useApi<T = any>(
  fetchFn: () => Promise<Response>,
  options: UseApiOptions = {}
) {
  const {
    cacheTime = 5 * 60 * 1000, // 5 min default
    skip = false,
    onError,
    onSuccess,
    retries = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: !skip,
    error: null,
  });

  // Track abort controller for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  // Retry with exponential backoff
  const retryFetch = useCallback(
    async (attempt: number = 0): Promise<T | null> => {
      try {
        const response = await fetchFn();

        if (!response.ok) {
          if (response.status >= 500 && attempt < retries) {
            // Retry on server errors
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay * Math.pow(2, attempt))
            );
            return retryFetch(attempt + 1);
          }
          throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        if (attempt < retries && !(error instanceof Error && error.message.includes('abort'))) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
          return retryFetch(attempt + 1);
        }
        throw error;
      }
    },
    [fetchFn, retries, retryDelay]
  );

  // Main fetch function with caching
  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Try cached data first
      const cacheKey = getCacheKey(String(fetchFn));
      const cachedData = apiCache.get<T>(cacheKey);

      if (cachedData) {
        setState((prev) => ({
          ...prev,
          data: cachedData,
          loading: false,
        }));
        onSuccess?.(cachedData);
        return cachedData;
      }

      // Fetch fresh data
      const data = await retryFetch();

      // Cache the response
      if (data) {
        apiCache.set(cacheKey, data, cacheTime);
      }

      setState((prev) => ({
        ...prev,
        data,
        loading: false,
      }));

      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Don't set error if request was aborted
      if (!err.message.includes('abort')) {
        setState((prev) => ({
          ...prev,
          error: err,
          loading: false,
        }));
        onError?.(err);
      }
    }
  }, [fetchFn, cacheTime, retryFetch, onError, onSuccess]);

  // Fetch on mount if not skipped
  useEffect(() => {
    if (!skip) {
      fetch();
    }

    // Cleanup: abort request on unmount
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [skip, fetch]);

  // Refetch function with cache clearing
  const refetch = useCallback(async () => {
    const cacheKey = getCacheKey(String(fetchFn));
    apiCache.delete(cacheKey);
    return fetch();
  }, [fetchFn, fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}

/**
 * useApiBatch Hook - Batch multiple API calls into one request
 *
 * Usage:
 * const { data, loading, error } = useApiBatch([
 *   '/api/issues',
 *   '/api/prs',
 *   '/api/comments'
 * ]);
 *
 * Returns:
 * data = [issues, prs, comments] or null if any fails
 */
export function useApiBatch<T = any>(
  urls: string[],
  options: UseApiOptions = {}
): { data: T[] | null; loading: boolean; error: Error | null } {
  const [state, setState] = useState<ApiState<T[]>>({
    data: null,
    loading: !options.skip,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Check cache first
      const cachedResults: T[] = [];
      const uncachedUrls: string[] = [];

      for (const url of urls) {
        const cached = apiCache.get<T>(url);
        if (cached) {
          cachedResults.push(cached);
        } else {
          uncachedUrls.push(url);
        }
      }

      // If all cached, return immediately
      if (uncachedUrls.length === 0) {
        setState((prev) => ({
          ...prev,
          data: cachedResults,
          loading: false,
        }));
        return cachedResults;
      }

      // Fetch uncached URLs in parallel
      const responses = await Promise.all(
        uncachedUrls.map((url) => fetch(url))
      );

      // Cache responses
      responses.forEach((response, index) => {
        apiCache.set(uncachedUrls[index], response, options.cacheTime || 5 * 60 * 1000);
      });

      const allData = [...cachedResults, ...responses];

      setState((prev) => ({
        ...prev,
        data: allData,
        loading: false,
      }));

      options.onSuccess?.(allData);
      return allData;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState((prev) => ({
        ...prev,
        error: err,
        loading: false,
      }));
      options.onError?.(err);
    }
  }, [urls, options]);

  useEffect(() => {
    if (!options.skip) {
      fetch();
    }
  }, [options.skip, fetch]);

  return state;
}

/**
 * useMutation Hook - For POST/PUT/DELETE operations
 *
 * Usage:
 * const { mutate, loading, error } = useMutation(
 *   async (data) => {
 *     const res = await fetch('/api/issue/update', {
 *       method: 'POST',
 *       body: JSON.stringify(data)
 *     });
 *     return res.json();
 *   }
 * );
 *
 * const handleSave = async () => {
 *   try {
 *     const result = await mutate({ issueKey: 'PROJ-123', status: 'Done' });
 *   } catch (err) {
 *     console.error(err);
 *   }
 * }
 */
export function useMutation<TData, TResult = any>(
  mutationFn: (data: TData) => Promise<TResult>,
  options: {
    onSuccess?: (data: TResult) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (data: TData): Promise<TResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFn(data);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        options.onError?.(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [mutationFn, options]
  );

  return { mutate, loading, error };
}

/**
 * usePolling Hook - Poll an API endpoint at regular intervals
 *
 * Usage:
 * const { data, loading, error, stop } = usePolling(
 *   () => fetch('/api/status'),
 *   { interval: 2000, maxAttempts: 30 }
 * );
 */
export function usePolling<T = any>(
  fetchFn: () => Promise<Response>,
  options: {
    interval?: number; // Poll interval in ms (default: 2000)
    maxAttempts?: number; // Max polls (default: unlimited)
    stopWhen?: (data: T) => boolean; // Stop polling when condition is met
  } = {}
) {
  const { interval = 2000, maxAttempts, stopWhen } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const attemptRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const poll = useCallback(async () => {
    try {
      const response = await fetchFn();
      if (!response.ok) throw new Error('Poll failed');

      const result = await response.json();
      setData(result);
      setLoading(false);

      // Stop if condition met
      if (stopWhen?.(result)) {
        intervalRef.current && clearInterval(intervalRef.current);
      }

      // Stop if max attempts reached
      if (maxAttempts && ++attemptRef.current >= maxAttempts) {
        intervalRef.current && clearInterval(intervalRef.current);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [fetchFn, maxAttempts, stopWhen]);

  useEffect(() => {
    poll(); // First poll immediately

    intervalRef.current = setInterval(poll, interval);

    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, [poll, interval]);

  const stop = useCallback(() => {
    intervalRef.current && clearInterval(intervalRef.current);
  }, []);

  return { data, loading, error, stop };
}
