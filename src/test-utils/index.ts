/**
 * Central export for all test utilities
 * Import from here in your test files for cleaner imports
 */

// Mock providers
export * from './mocks/llmProvider';

// Data builders
export * from './builders/moduleBuilder';
export * from './builders/quizBuilder';

// Test helpers and utilities
export * from './helpers/testHelpers';

// Common test setup
export const setupTest = () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  // Restore all mocks after each test
  afterEach(() => {
    jest.restoreAllMocks();
  });
};

// Performance testing setup
export const setupPerformanceTest = () => {
  let performanceMarks: Map<string, number> = new Map();

  beforeEach(() => {
    performanceMarks.clear();
  });

  const mark = (label: string) => {
    performanceMarks.set(label, performance.now());
  };

  const measure = (startLabel: string, endLabel?: string): number => {
    const start = performanceMarks.get(startLabel);
    if (!start) throw new Error(`No mark found for ${startLabel}`);
    
    const end = endLabel ? performanceMarks.get(endLabel) : performance.now();
    if (endLabel && !end) throw new Error(`No mark found for ${endLabel}`);
    
    return (end || performance.now()) - start;
  };

  return { mark, measure };
};

// Common test scenarios
export const testScenarios = {
  /**
   * Test a service with retry logic
   */
  withRetries: async (
    serviceFn: () => Promise<any>,
    expectedRetries: number,
    mockImplementation: jest.Mock
  ) => {
    // First N-1 calls fail, last one succeeds
    for (let i = 0; i < expectedRetries - 1; i++) {
      mockImplementation.mockRejectedValueOnce(new Error('Temporary failure'));
    }
    mockImplementation.mockResolvedValueOnce({ success: true });

    const result = await serviceFn();
    
    expect(mockImplementation).toHaveBeenCalledTimes(expectedRetries);
    return result;
  },

  /**
   * Test rate limiting behavior
   */
  withRateLimit: async (
    serviceFn: () => Promise<any>,
    rateLimit: number,
    timeWindow: number
  ) => {
    const calls: number[] = [];
    
    for (let i = 0; i < rateLimit + 2; i++) {
      calls.push(performance.now());
      try {
        await serviceFn();
      } catch (e) {
        // Expected for calls beyond rate limit
      }
    }

    // Check that calls within rate limit succeeded
    expect(calls.slice(0, rateLimit).length).toBe(rateLimit);
    
    // Check timing
    const duration = calls[calls.length - 1] - calls[0];
    expect(duration).toBeGreaterThanOrEqual(timeWindow);
  },

  /**
   * Test caching behavior
   */
  withCache: async (
    serviceFn: (key: string) => Promise<any>,
    mockImplementation: jest.Mock
  ) => {
    mockImplementation.mockResolvedValue({ data: 'test' });

    // First call should hit the service
    const result1 = await serviceFn('key1');
    expect(mockImplementation).toHaveBeenCalledTimes(1);

    // Second call with same key should use cache
    const result2 = await serviceFn('key1');
    expect(mockImplementation).toHaveBeenCalledTimes(1);
    expect(result2).toEqual(result1);

    // Different key should hit service again
    await serviceFn('key2');
    expect(mockImplementation).toHaveBeenCalledTimes(2);
  }
};

// Re-export commonly used testing library functions
export { render, screen, fireEvent, waitFor, act, renderHook } from '@testing-library/react';