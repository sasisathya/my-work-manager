'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * useDebounce Hook - Debounce a value with configurable delay
 *
 * Useful for:
 * - Search input (wait for user to stop typing)
 * - Window resize handlers
 * - Auto-save functionality
 *
 * Usage:
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 300);
 *
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 */

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useThrottle Hook - Throttle a value with minimum interval
 *
 * Useful for:
 * - Scroll event handlers
 * - Mouse move tracking
 * - Frequent state updates
 *
 * Usage:
 * const throttledScroll = useThrottle(scrollPosition, 100);
 */

export function useThrottle<T>(value: T, interval: number = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdatedRef = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();

    if (now >= lastUpdatedRef.current + interval) {
      lastUpdatedRef.current = now;
      setThrottledValue(value);
    } else {
      const timer = setTimeout(() => {
        lastUpdatedRef.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}
