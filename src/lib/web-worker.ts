/**
 * Web Worker utility - Offload heavy computation to background thread
 * Prevents UI blocking and improves responsiveness
 */

'use client';

import { useState, useEffect } from 'react';

export interface WorkerMessage {
  id: string;
  operation: string;
  data: any;
}

export interface WorkerResponse {
  id: string;
  result?: any;
  error?: string;
}

export class WorkerPool {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (reason?: any) => void;
      timeout: NodeJS.Timeout;
    }
  >();

  constructor(scriptPath: string = '/workers/data-processor.js') {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      try {
        this.worker = new Worker(scriptPath);
        this.worker.onmessage = this.handleMessage.bind(this);
        this.worker.onerror = this.handleError.bind(this);
      } catch (error) {
        console.warn('[Worker] Failed to initialize:', error);
      }
    }
  }

  /**
   * Run operation in worker thread
   */
  async run<T>(operation: string, data: any, timeout: number = 30000): Promise<T> {
    if (!this.worker) {
      // Fallback to main thread if worker not available
      console.warn('[Worker] Worker not available, running on main thread');
      return this.runMainThread(operation, data);
    }

    const id = `${operation}:${Date.now()}:${Math.random()}`;
    const message: WorkerMessage = { id, operation, data };

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Worker operation timeout: ${operation}`));
      }, timeout);

      // Store request handler
      this.pendingRequests.set(id, { resolve, reject, timeout: timeoutHandle });

      // Send message to worker
      try {
        this.worker!.postMessage(message);
      } catch (error) {
        this.pendingRequests.delete(id);
        clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  /**
   * Handle messages from worker
   */
  private handleMessage(event: MessageEvent<WorkerResponse>) {
    const { id, result, error } = event.data;
    const pending = this.pendingRequests.get(id);

    if (!pending) {
      console.warn('[Worker] Received message for unknown request:', id);
      return;
    }

    this.pendingRequests.delete(id);
    clearTimeout(pending.timeout);

    if (error) {
      pending.reject(new Error(error));
    } else {
      pending.resolve(result);
    }
  }

  /**
   * Handle worker errors
   */
  private handleError(error: ErrorEvent) {
    console.error('[Worker] Error:', error.message);

    // Reject all pending requests
    this.pendingRequests.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(error);
    });

    this.pendingRequests.clear();

    // Try to restart worker
    this.terminate();
  }

  /**
   * Fallback: Run on main thread if worker unavailable
   */
  private async runMainThread(operation: string, data: any): Promise<any> {
    // Simulate async operation
    return new Promise((resolve) => {
      setTimeout(() => {
        const result = this.executeOperation(operation, data);
        resolve(result);
      }, 0);
    });
  }

  /**
   * Execute operation (shared with worker)
   */
  private executeOperation(operation: string, data: any): any {
    switch (operation) {
      case 'filter':
        return data.filter((item: any) => item.status === data.filterValue);

      case 'sort':
        return [...data].sort(
          (a: any, b: any) => b[data.sortKey] - a[data.sortKey]
        );

      case 'aggregate':
        return {
          total: data.length,
          pending: data.filter((d: any) => d.status === 'pending').length,
          completed: data.filter((d: any) => d.status === 'completed').length,
          inProgress: data.filter((d: any) => d.status === 'in_progress').length,
        };

      case 'search':
        return data.filter((item: any) =>
          JSON.stringify(item)
            .toLowerCase()
            .includes(data.query.toLowerCase())
        );

      case 'deduplicate':
        return Array.from(new Map(data.map((item: any) => [item.id, item])).values());

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  /**
   * Terminate worker
   */
  terminate() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.pendingRequests.clear();
  }
}

// Singleton instance
let workerPool: WorkerPool | null = null;

export function getWorkerPool(): WorkerPool {
  if (!workerPool) {
    workerPool = new WorkerPool();
  }
  return workerPool;
}

/**
 * React Hook for using Web Workers
 */

export function useWebWorker<T = any>(operation: string, data: any) {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!data) return;

    setLoading(true);
    setError(null);

    const pool = getWorkerPool();
    pool
      .run<T>(operation, data)
      .then((res) => {
        setResult(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [operation, JSON.stringify(data)]);

  return { result, loading, error };
}
