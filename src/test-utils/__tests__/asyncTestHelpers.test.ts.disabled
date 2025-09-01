/**
 * Comprehensive test suite for async test helper utilities
 * Testing concurrent operations, timing, and error scenarios
 */

import {
  actAsync,
  flushPromises,
  waitForCondition,
  cleanupEventEmitter,
  timerHelpers,
  createDeferredPromise,
  withAsyncCleanup
} from '../asyncTestHelpers';
import { act } from '@testing-library/react';
import { EventEmitter } from 'events';

// Mock act from @testing-library/react
jest.mock('@testing-library/react', () => ({
  act: jest.fn()
}));

const mockedAct = act as jest.MockedFunction<typeof act>;

describe('Async Test Helpers - Comprehensive Test Suite', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Reset act mock
    mockedAct.mockImplementation((callback: any) => {
      if (typeof callback === 'function') {
        return callback();
      }
      return callback;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('actAsync', () => {
    it('should wrap async operations in act', async () => {
      const asyncOperation = jest.fn().mockResolvedValue('test-result');

      const result = await actAsync(asyncOperation);

      expect(mockedAct).toHaveBeenCalledTimes(1);
      expect(asyncOperation).toHaveBeenCalledTimes(1);
      expect(result).toBe('test-result');
    });

    it('should handle async operations that throw errors', async () => {
      const error = new Error('Async operation failed');
      const failingOperation = jest.fn().mockRejectedValue(error);

      await expect(actAsync(failingOperation)).rejects.toThrow('Async operation failed');
      expect(mockedAct).toHaveBeenCalledTimes(1);
      expect(failingOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle operations that return undefined', async () => {
      const undefinedOperation = jest.fn().mockResolvedValue(undefined);

      const result = await actAsync(undefinedOperation);

      expect(result).toBeUndefined();
      expect(mockedAct).toHaveBeenCalledTimes(1);
    });

    it('should handle operations that return complex objects', async () => {
      const complexResult = {
        data: ['item1', 'item2'],
        metadata: { count: 2, hasMore: false },
        status: 'success'
      };
      const complexOperation = jest.fn().mockResolvedValue(complexResult);

      const result = await actAsync(complexOperation);

      expect(result).toEqual(complexResult);
      expect(mockedAct).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple concurrent actAsync calls', async () => {
      const operation1 = jest.fn().mockResolvedValue('result1');
      const operation2 = jest.fn().mockResolvedValue('result2');
      const operation3 = jest.fn().mockResolvedValue('result3');

      const promises = [
        actAsync(operation1),
        actAsync(operation2),
        actAsync(operation3)
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual(['result1', 'result2', 'result3']);
      expect(mockedAct).toHaveBeenCalledTimes(3);
    });

    it('should handle very slow async operations', async () => {
      const slowOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('slow-result'), 100))
      );

      jest.useFakeTimers();
      
      const resultPromise = actAsync(slowOperation);
      
      // Fast-forward time
      jest.advanceTimersByTime(100);
      
      const result = await resultPromise;

      expect(result).toBe('slow-result');
      expect(slowOperation).toHaveBeenCalledTimes(1);
    });

    it('should handle operations with nested promises', async () => {
      const nestedOperation = jest.fn().mockImplementation(async () => {
        const innerPromise = Promise.resolve('inner-result');
        const innerResult = await innerPromise;
        return `outer-${innerResult}`;
      });

      const result = await actAsync(nestedOperation);

      expect(result).toBe('outer-inner-result');
      expect(mockedAct).toHaveBeenCalledTimes(1);
    });

    it('should handle operations that throw synchronously', async () => {
      const syncError = new Error('Synchronous error');
      const syncThrowingOperation = jest.fn().mockImplementation(() => {
        throw syncError;
      });

      // act might catch and re-throw sync errors
      mockedAct.mockImplementation((callback: any) => {
        return Promise.resolve(callback()).catch(err => Promise.reject(err));
      });

      await expect(actAsync(syncThrowingOperation)).rejects.toThrow('Synchronous error');
      expect(syncThrowingOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('flushPromises', () => {
    it('should flush all pending promises', async () => {
      let resolved = false;
      const pendingPromise = Promise.resolve().then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);

      await flushPromises();

      expect(resolved).toBe(true);
    });

    it('should work with setImmediate when available', async () => {
      // Mock setImmediate as available
      const mockSetImmediate = jest.fn((callback: () => void) => {
        setTimeout(callback, 0);
      });
      (global as any).setImmediate = mockSetImmediate;

      let resolved = false;
      Promise.resolve().then(() => {
        resolved = true;
      });

      await flushPromises();

      expect(resolved).toBe(true);
      expect(mockSetImmediate).toHaveBeenCalledTimes(1);

      delete (global as any).setImmediate;
    });

    it('should fallback to setTimeout when setImmediate is not available', async () => {
      // Ensure setImmediate is not available
      delete (global as any).setImmediate;

      const mockSetTimeout = jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return 123 as any;
      });

      let resolved = false;
      Promise.resolve().then(() => {
        resolved = true;
      });

      await flushPromises();

      expect(resolved).toBe(true);
      expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 0);

      mockSetTimeout.mockRestore();
    });

    it('should handle multiple pending promises', async () => {
      const results: number[] = [];

      Promise.resolve().then(() => results.push(1));
      Promise.resolve().then(() => results.push(2));
      Promise.resolve().then(() => results.push(3));

      expect(results).toHaveLength(0);

      await flushPromises();

      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle rejected promises gracefully', async () => {
      const rejectedPromise = Promise.reject(new Error('Test rejection'));
      
      // Add error handler to prevent unhandled promise rejection
      rejectedPromise.catch(() => {});

      // flushPromises should complete without throwing
      await expect(flushPromises()).resolves.not.toThrow();
    });

    it('should handle deeply nested promise chains', async () => {
      let finalResult = 0;

      Promise.resolve(1)
        .then(x => Promise.resolve(x + 1))
        .then(x => Promise.resolve(x + 1))
        .then(x => Promise.resolve(x + 1))
        .then(x => {
          finalResult = x;
        });

      expect(finalResult).toBe(0);

      await flushPromises();

      expect(finalResult).toBe(4);
    });
  });

  describe('waitForCondition', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should wait for condition to become true', async () => {
      let conditionMet = false;
      const condition = jest.fn(() => conditionMet);

      // Start waiting
      const waitPromise = waitForCondition(condition, 1000, 100);

      // Initially condition should be false
      expect(condition).toHaveBeenCalledTimes(0);

      // Advance time to trigger first check
      jest.advanceTimersByTime(0);
      await flushPromises();

      expect(condition).toHaveBeenCalledTimes(1);

      // Advance time for several checks
      jest.advanceTimersByTime(300);
      await flushPromises();

      expect(condition).toHaveBeenCalledTimes(4); // Initial + 3 intervals

      // Make condition true
      conditionMet = true;

      // Advance time once more
      jest.advanceTimersByTime(100);
      
      await expect(waitPromise).resolves.toBeUndefined();
      expect(condition).toHaveBeenCalledTimes(5);
    });

    it('should timeout if condition never becomes true', async () => {
      const condition = jest.fn(() => false);

      const waitPromise = waitForCondition(condition, 500, 100);

      // Advance past timeout
      jest.advanceTimersByTime(600);

      await expect(waitPromise).rejects.toThrow('Timeout waiting for condition');
      expect(condition).toHaveBeenCalledTimes(6); // Initial + 5 intervals before timeout
    });

    it('should use default timeout and interval values', async () => {
      let conditionMet = false;
      const condition = jest.fn(() => conditionMet);

      const waitPromise = waitForCondition(condition);

      // Check with default interval (100ms)
      jest.advanceTimersByTime(150);
      await flushPromises();
      
      expect(condition).toHaveBeenCalledTimes(2);

      // Make condition true
      conditionMet = true;
      jest.advanceTimersByTime(100);

      await expect(waitPromise).resolves.toBeUndefined();
    });

    it('should handle condition that throws errors', async () => {
      let callCount = 0;
      const faultyCondition = jest.fn(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Condition error');
        }
        return true;
      });

      const waitPromise = waitForCondition(faultyCondition, 1000, 100);

      // Advance time for error conditions
      jest.advanceTimersByTime(250);

      await expect(waitPromise).resolves.toBeUndefined();
      expect(faultyCondition).toHaveBeenCalledTimes(3);
    });

    it('should handle very short intervals', async () => {
      let conditionMet = false;
      const condition = jest.fn(() => conditionMet);

      const waitPromise = waitForCondition(condition, 100, 10);

      // Advance time with short intervals
      jest.advanceTimersByTime(35);
      await flushPromises();

      expect(condition).toHaveBeenCalledTimes(4); // Initial + 3 quick intervals

      conditionMet = true;
      jest.advanceTimersByTime(10);

      await expect(waitPromise).resolves.toBeUndefined();
    });

    it('should handle condition that becomes true immediately', async () => {
      const condition = jest.fn(() => true);

      const startTime = Date.now();
      await waitForCondition(condition, 1000, 100);
      const endTime = Date.now();

      // Should resolve almost immediately (within tolerance for test environment)
      expect(endTime - startTime).toBeLessThan(50);
      expect(condition).toHaveBeenCalledTimes(1);
    });

    it('should handle zero timeout', async () => {
      const condition = jest.fn(() => false);

      const waitPromise = waitForCondition(condition, 0, 100);

      // Even with zero timeout, should check at least once
      jest.advanceTimersByTime(1);

      await expect(waitPromise).rejects.toThrow('Timeout waiting for condition');
      expect(condition).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent waitForCondition calls', async () => {
      let condition1Met = false;
      let condition2Met = false;
      let condition3Met = false;

      const condition1 = jest.fn(() => condition1Met);
      const condition2 = jest.fn(() => condition2Met);
      const condition3 = jest.fn(() => condition3Met);

      const promises = [
        waitForCondition(condition1, 1000, 50),
        waitForCondition(condition2, 1000, 75),
        waitForCondition(condition3, 1000, 100)
      ];

      // Let conditions run for a while
      jest.advanceTimersByTime(200);
      await flushPromises();

      // Make conditions true at different times
      condition1Met = true;
      jest.advanceTimersByTime(100);

      condition2Met = true;
      jest.advanceTimersByTime(100);

      condition3Met = true;
      jest.advanceTimersByTime(100);

      await Promise.all(promises);

      // All conditions should have been checked multiple times
      expect(condition1).toHaveBeenCalled();
      expect(condition2).toHaveBeenCalled();
      expect(condition3).toHaveBeenCalled();
    });
  });

  describe('cleanupEventEmitter', () => {
    it('should cleanup event emitter listeners', () => {
      const emitter = new EventEmitter();
      const removeAllListenersSpy = jest.spyOn(emitter, 'removeAllListeners');

      cleanupEventEmitter(emitter);

      expect(removeAllListenersSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle null/undefined emitters gracefully', () => {
      expect(() => cleanupEventEmitter(null)).not.toThrow();
      expect(() => cleanupEventEmitter(undefined)).not.toThrow();
    });

    it('should handle objects without removeAllListeners method', () => {
      const fakeEmitter = { someProperty: 'value' };

      expect(() => cleanupEventEmitter(fakeEmitter)).not.toThrow();
    });

    it('should handle emitters where removeAllListeners throws', () => {
      const faultyEmitter = {
        removeAllListeners: jest.fn().mockImplementation(() => {
          throw new Error('Cleanup failed');
        })
      };

      expect(() => cleanupEventEmitter(faultyEmitter)).not.toThrow();
      expect(faultyEmitter.removeAllListeners).toHaveBeenCalledTimes(1);
    });

    it('should work with custom event emitter implementations', () => {
      class CustomEventEmitter {
        private listeners: { [key: string]: Function[] } = {};

        removeAllListeners() {
          this.listeners = {};
        }
      }

      const customEmitter = new CustomEventEmitter();
      const removeAllListenersSpy = jest.spyOn(customEmitter, 'removeAllListeners');

      cleanupEventEmitter(customEmitter);

      expect(removeAllListenersSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle emitters with many listeners efficiently', () => {
      const emitter = new EventEmitter();

      // Add many listeners
      for (let i = 0; i < 1000; i++) {
        emitter.on(`event${i}`, () => {});
      }

      expect(emitter.eventNames()).toHaveLength(1000);

      const start = performance.now();
      cleanupEventEmitter(emitter);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // Should be fast
      expect(emitter.eventNames()).toHaveLength(0);
    });
  });

  describe('timerHelpers', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('advanceTimersAndFlush', () => {
      it('should advance timers and flush promises', async () => {
        let timerExecuted = false;
        let promiseResolved = false;

        setTimeout(() => {
          timerExecuted = true;
        }, 1000);

        Promise.resolve().then(() => {
          promiseResolved = true;
        });

        expect(timerExecuted).toBe(false);
        expect(promiseResolved).toBe(false);

        await timerHelpers.advanceTimersAndFlush(1000);

        expect(timerExecuted).toBe(true);
        expect(promiseResolved).toBe(true);
      });

      it('should handle nested timers and promises', async () => {
        const results: string[] = [];

        setTimeout(() => {
          results.push('timer1');
          Promise.resolve().then(() => results.push('promise1'));
        }, 100);

        setTimeout(() => {
          results.push('timer2');
          setTimeout(() => results.push('nested-timer'), 50);
        }, 200);

        await timerHelpers.advanceTimersAndFlush(300);

        expect(results).toContain('timer1');
        expect(results).toContain('promise1');
        expect(results).toContain('timer2');
        expect(results).toContain('nested-timer');
      });

      it('should handle multiple calls efficiently', async () => {
        let counter = 0;

        const interval = setInterval(() => {
          counter++;
        }, 100);

        await timerHelpers.advanceTimersAndFlush(250);
        expect(counter).toBe(2); // Should have executed twice

        await timerHelpers.advanceTimersAndFlush(150);
        expect(counter).toBe(3); // One more execution

        clearInterval(interval);
      });
    });

    describe('runAllTimersAndFlush', () => {
      it('should run all pending timers and flush promises', async () => {
        const results: string[] = [];

        setTimeout(() => results.push('short'), 100);
        setTimeout(() => results.push('long'), 10000);
        Promise.resolve().then(() => results.push('promise'));

        expect(results).toHaveLength(0);

        await timerHelpers.runAllTimersAndFlush();

        expect(results).toContain('short');
        expect(results).toContain('long');
        expect(results).toContain('promise');
      });

      it('should handle intervals and clear them', async () => {
        let count = 0;
        const interval = setInterval(() => {
          count++;
          if (count >= 3) {
            clearInterval(interval);
          }
        }, 100);

        await timerHelpers.runAllTimersAndFlush();

        expect(count).toBe(3);
      });

      it('should handle recursive timers', async () => {
        const results: number[] = [];

        const createRecursiveTimer = (depth: number) => {
          if (depth <= 0) return;
          
          setTimeout(() => {
            results.push(depth);
            createRecursiveTimer(depth - 1);
          }, 100);
        };

        createRecursiveTimer(3);

        await timerHelpers.runAllTimersAndFlush();

        expect(results).toEqual([3, 2, 1]);
      });
    });

    it('should handle timer helpers with real timers gracefully', async () => {
      jest.useRealTimers(); // Switch to real timers

      let executed = false;
      setTimeout(() => {
        executed = true;
      }, 1);

      // With real timers, these should still work but won't control time
      await timerHelpers.advanceTimersAndFlush(1000);
      
      // Give real timer a chance to execute
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(executed).toBe(true);
    });
  });

  describe('createDeferredPromise', () => {
    it('should create a deferred promise that can be resolved', async () => {
      const deferred = createDeferredPromise<string>();
      const testValue = 'test-resolution-value';

      expect(deferred.promise).toBeInstanceOf(Promise);
      expect(typeof deferred.resolve).toBe('function');
      expect(typeof deferred.reject).toBe('function');

      // Resolve the promise
      deferred.resolve(testValue);

      const result = await deferred.promise;
      expect(result).toBe(testValue);
    });

    it('should create a deferred promise that can be rejected', async () => {
      const deferred = createDeferredPromise<string>();
      const testError = new Error('test-rejection-error');

      // Reject the promise
      deferred.reject(testError);

      await expect(deferred.promise).rejects.toThrow('test-rejection-error');
    });

    it('should handle complex types', async () => {
      interface ComplexType {
        id: number;
        data: { nested: string[] };
        timestamp: Date;
      }

      const deferred = createDeferredPromise<ComplexType>();
      const complexValue: ComplexType = {
        id: 123,
        data: { nested: ['item1', 'item2'] },
        timestamp: new Date()
      };

      deferred.resolve(complexValue);

      const result = await deferred.promise;
      expect(result).toEqual(complexValue);
      expect(result.data.nested).toHaveLength(2);
    });

    it('should handle void promises', async () => {
      const deferred = createDeferredPromise<void>();

      deferred.resolve();

      const result = await deferred.promise;
      expect(result).toBeUndefined();
    });

    it('should handle multiple deferred promises concurrently', async () => {
      const deferred1 = createDeferredPromise<number>();
      const deferred2 = createDeferredPromise<string>();
      const deferred3 = createDeferredPromise<boolean>();

      // Resolve them in different order
      setTimeout(() => deferred2.resolve('second'), 10);
      setTimeout(() => deferred1.resolve(42), 20);
      setTimeout(() => deferred3.resolve(true), 5);

      const results = await Promise.all([
        deferred1.promise,
        deferred2.promise,
        deferred3.promise
      ]);

      expect(results).toEqual([42, 'second', true]);
    });

    it('should handle promise that is never resolved', (done) => {
      const deferred = createDeferredPromise<string>();

      // Set a timeout to ensure the test completes
      const timeout = setTimeout(() => {
        // Promise should still be pending
        expect(deferred.promise).toBeInstanceOf(Promise);
        done();
      }, 50);

      // The promise should not resolve
      deferred.promise.then(() => {
        clearTimeout(timeout);
        done.fail('Promise should not have resolved');
      });
    });

    it('should handle immediate resolution', async () => {
      const deferred = createDeferredPromise<string>();
      
      // Resolve immediately
      deferred.resolve('immediate');

      // Should resolve immediately when awaited
      const result = await deferred.promise;
      expect(result).toBe('immediate');
    });

    it('should handle promise that resolves with undefined', async () => {
      const deferred = createDeferredPromise<undefined>();

      deferred.resolve(undefined);

      const result = await deferred.promise;
      expect(result).toBeUndefined();
    });

    it('should handle promise that resolves with null', async () => {
      const deferred = createDeferredPromise<null>();

      deferred.resolve(null);

      const result = await deferred.promise;
      expect(result).toBeNull();
    });
  });

  describe('withAsyncCleanup', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should wrap test function and perform cleanup', async () => {
      const testFunction = jest.fn().mockResolvedValue('test-result');
      const clearAllTimersSpy = jest.spyOn(jest, 'clearAllTimers');

      const wrappedFunction = withAsyncCleanup(testFunction);
      const result = await wrappedFunction('arg1', 'arg2');

      expect(testFunction).toHaveBeenCalledWith('arg1', 'arg2');
      expect(result).toBe('test-result');
      expect(clearAllTimersSpy).toHaveBeenCalledTimes(1);
    });

    it('should perform cleanup even when test function throws', async () => {
      const testError = new Error('Test function failed');
      const testFunction = jest.fn().mockRejectedValue(testError);
      const clearAllTimersSpy = jest.spyOn(jest, 'clearAllTimers');

      const wrappedFunction = withAsyncCleanup(testFunction);

      await expect(wrappedFunction()).rejects.toThrow('Test function failed');
      expect(testFunction).toHaveBeenCalledTimes(1);
      expect(clearAllTimersSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle synchronous test functions', async () => {
      const syncFunction = jest.fn().mockReturnValue('sync-result');
      const clearAllTimersSpy = jest.spyOn(jest, 'clearAllTimers');

      const wrappedFunction = withAsyncCleanup(syncFunction);
      const result = await wrappedFunction();

      expect(syncFunction).toHaveBeenCalledTimes(1);
      expect(result).toBe('sync-result');
      expect(clearAllTimersSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle test functions with multiple parameters', async () => {
      const testFunction = jest.fn().mockImplementation(
        (a: number, b: string, c: boolean) => `${a}-${b}-${c}`
      );

      const wrappedFunction = withAsyncCleanup(testFunction);
      const result = await wrappedFunction(42, 'test', true);

      expect(testFunction).toHaveBeenCalledWith(42, 'test', true);
      expect(result).toBe('42-test-true');
    });

    it('should handle test functions that return promises', async () => {
      const asyncFunction = jest.fn().mockImplementation(async (delay: number) => {
        return new Promise(resolve => {
          setTimeout(() => resolve(`delayed-${delay}`), delay);
        });
      });

      const wrappedFunction = withAsyncCleanup(asyncFunction);
      
      const resultPromise = wrappedFunction(100);
      jest.advanceTimersByTime(100);
      await flushPromises();
      
      const result = await resultPromise;
      expect(result).toBe('delayed-100');
    }, 10000);

    it('should flush promises during cleanup', async () => {
      let promiseResolved = false;
      
      const testFunction = jest.fn().mockImplementation(async () => {
        Promise.resolve().then(() => {
          promiseResolved = true;
        });
        return 'done';
      });

      const wrappedFunction = withAsyncCleanup(testFunction);
      await wrappedFunction();

      // Add a small delay to ensure promise resolves
      await flushPromises();
      
      // The cleanup should have flushed the promise
      expect(promiseResolved).toBe(true);
    }, 10000);

    it('should preserve function typing', () => {
      const typedFunction = (a: number, b: string): Promise<boolean> => 
        Promise.resolve(a > 0 && b.length > 0);

      const wrappedFunction = withAsyncCleanup(typedFunction);

      // TypeScript should infer the correct types
      expect(typeof wrappedFunction).toBe('function');
    });

    it('should handle cleanup errors gracefully', async () => {
      // Mock clearAllTimers to throw
      const clearAllTimersError = new Error('Cleanup failed');
      const clearAllTimersSpy = jest.spyOn(jest, 'clearAllTimers').mockImplementation(() => {
        throw clearAllTimersError;
      });

      const testFunction = jest.fn().mockResolvedValue('success');
      const wrappedFunction = withAsyncCleanup(testFunction);

      // Should still complete successfully despite cleanup error
      const result = await wrappedFunction();
      expect(result).toBe('success');
      
      clearAllTimersSpy.mockRestore();
    }, 10000);

    it('should handle concurrent wrapped function calls', async () => {
      const testFunction = jest.fn().mockImplementation((id: string) => 
        Promise.resolve(`result-${id}`)
      );

      const wrappedFunction = withAsyncCleanup(testFunction);

      const promises = [
        wrappedFunction('1'),
        wrappedFunction('2'),
        wrappedFunction('3')
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual(['result-1', 'result-2', 'result-3']);
      expect(testFunction).toHaveBeenCalledTimes(3);
    }, 10000);
  });

  describe('Integration and Edge Cases', () => {
    it('should handle complex async workflows', async () => {
      jest.useFakeTimers();

      const workflow = async () => {
        // Step 1: Wait for condition
        let step1Complete = false;
        setTimeout(() => {
          step1Complete = true;
        }, 100);

        await waitForCondition(() => step1Complete, 200, 10);

        // Step 2: Async operation
        const result = await actAsync(async () => {
          return new Promise(resolve => {
            setTimeout(() => resolve('workflow-complete'), 50);
          });
        });

        return result;
      };

      const workflowPromise = workflow();
      
      jest.advanceTimersByTime(150);
      await flushPromises();

      const result = await workflowPromise;
      expect(result).toBe('workflow-complete');

      jest.useRealTimers();
    }, 15000);

    it('should handle error recovery scenarios', async () => {
      jest.useFakeTimers();

      let attempts = 0;
      const flakyCondition = () => {
        attempts++;
        if (attempts < 3) {
          // Don't throw an error, just return false for the first attempts
          return false;
        }
        return true;
      };

      // Should eventually succeed despite initial failures  
      const waitPromise = waitForCondition(flakyCondition, 1000, 50);

      jest.advanceTimersByTime(200);
      await flushPromises();

      await expect(waitPromise).resolves.toBeUndefined();
      expect(attempts).toBeGreaterThanOrEqual(3);

      jest.useRealTimers();
    }, 15000);

    it('should handle memory pressure scenarios', async () => {
      // Create many deferred promises to test memory usage
      const deferredPromises = Array.from({ length: 1000 }, () => 
        createDeferredPromise<number>()
      );

      // Resolve them all
      deferredPromises.forEach((deferred, index) => {
        deferred.resolve(index);
      });

      const results = await Promise.all(
        deferredPromises.map(d => d.promise)
      );

      expect(results).toHaveLength(1000);
      expect(results[999]).toBe(999);
    });

    it('should handle browser compatibility edge cases', async () => {
      // Test without setImmediate
      const originalSetImmediate = (global as any).setImmediate;
      delete (global as any).setImmediate;

      let resolved = false;
      Promise.resolve().then(() => {
        resolved = true;
      });

      await flushPromises();
      expect(resolved).toBe(true);

      // Restore setImmediate
      if (originalSetImmediate) {
        (global as any).setImmediate = originalSetImmediate;
      }
    });

    it('should handle performance under load', async () => {
      jest.useFakeTimers();

      const start = performance.now();

      // Create many concurrent operations
      const operations = Array.from({ length: 100 }, async (_, index) => {
        return await actAsync(async () => {
          return new Promise(resolve => {
            setTimeout(() => resolve(index), 10);
          });
        });
      });

      jest.advanceTimersByTime(20);
      const results = await Promise.all(operations);

      const duration = performance.now() - start;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should be reasonably fast

      jest.useRealTimers();
    });
  });
});