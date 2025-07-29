import { act } from '@testing-library/react';

/**
 * Helper utilities for handling async operations in tests
 */

/**
 * Wraps an async operation in act() for React components
 * Ensures all updates are flushed before continuing
 */
export async function actAsync<T>(callback: () => Promise<T>): Promise<T> {
  let result: T;
  await act(async () => {
    result = await callback();
  });
  return result!;
}

/**
 * Waits for all pending promises to resolve
 * Useful for ensuring async operations complete before assertions
 */
export function flushPromises(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

/**
 * Waits for a condition to be true with timeout
 * @param condition Function that returns true when condition is met
 * @param timeout Maximum time to wait in milliseconds
 * @param interval Check interval in milliseconds
 */
export async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Safely cleans up EventEmitter listeners
 * @param emitter EventEmitter instance to clean up
 */
export function cleanupEventEmitter(emitter: any): void {
  if (emitter && typeof emitter.removeAllListeners === 'function') {
    emitter.removeAllListeners();
  }
}

/**
 * Mock timer helpers for tests using fake timers
 */
export const timerHelpers = {
  /**
   * Advances timers and flushes promises
   */
  async advanceTimersAndFlush(ms: number): Promise<void> {
    jest.advanceTimersByTime(ms);
    await flushPromises();
  },
  
  /**
   * Runs all timers and flushes promises
   */
  async runAllTimersAndFlush(): Promise<void> {
    jest.runAllTimers();
    await flushPromises();
  }
};

/**
 * Creates a deferred promise for testing async flows
 */
export function createDeferredPromise<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: any) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}

/**
 * Wraps a test function to ensure proper async cleanup
 */
export function withAsyncCleanup<T extends (...args: any[]) => any>(
  testFn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await testFn(...args);
    } finally {
      // Ensure all timers are cleared
      jest.clearAllTimers();
      // Flush any pending promises
      await flushPromises();
    }
  }) as T;
}