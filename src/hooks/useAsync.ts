'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useAsync Hook - Generic async operation handler
 *
 * Handles loading, error, and success states for any async operation
 *
 * Usage:
 * const { execute, loading, data, error } = useAsync(async () => {
 *   return await someAsyncOperation();
 * });
 *
 * useEffect(() => {
 *   execute();
 * }, [execute]);
 */

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T, A extends any[] = []>(
  asyncFunction: (...args: A) => Promise<T>,
  immediate = false,
  dependencies: any[] = []
) {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const executeRef = useRef<(...args: A) => Promise<T | null>>();

  // Execute async function
  const execute = useCallback(
    async (...args: A) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await asyncFunction(...args);
        setState({ data: response, loading: false, error: null });
        return response;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, loading: false, error: err });
        return null;
      }
    },
    [asyncFunction]
  );

  executeRef.current = execute;

  // Execute on mount if immediate
  useEffect(() => {
    if (immediate) {
      executeRef.current?.();
    }
  }, dependencies);

  return {
    execute,
    ...state,
  };
}
