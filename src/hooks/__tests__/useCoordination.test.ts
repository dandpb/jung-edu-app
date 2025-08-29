/**
 * Comprehensive test suite for useCoordination hook
 * Tests coordination functionality, localStorage integration, memory management, and error handling
 */

import { renderHook, act } from '@testing-library/react';
import { useCoordination } from '../useCoordination';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('useCoordination', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('Hook Interface and Initialization', () => {
    it('should return coordination hook interface', () => {
      const { result } = renderHook(() => useCoordination());

      expect(result.current).toHaveProperty('notify');
      expect(result.current).toHaveProperty('getMemory');
      expect(result.current).toHaveProperty('setMemory');
      expect(result.current).toHaveProperty('reportProgress');
      expect(result.current).toHaveProperty('updateMemory');

      expect(typeof result.current.notify).toBe('function');
      expect(typeof result.current.getMemory).toBe('function');
      expect(typeof result.current.setMemory).toBe('function');
      expect(typeof result.current.reportProgress).toBe('function');
      expect(typeof result.current.updateMemory).toBe('function');
    });

    it('should provide stable function references across re-renders', () => {
      const { result, rerender } = renderHook(() => useCoordination());

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      expect(secondRender.notify).toBe(firstRender.notify);
      expect(secondRender.getMemory).toBe(firstRender.getMemory);
      expect(secondRender.setMemory).toBe(firstRender.setMemory);
      expect(secondRender.reportProgress).toBe(firstRender.reportProgress);
      expect(secondRender.updateMemory).toBe(firstRender.updateMemory);
    });

    it('should handle hook re-initialization gracefully', () => {
      const { result, unmount } = renderHook(() => useCoordination());

      const notification = 'Test message';
      result.current.notify(notification);
      expect(consoleLogSpy).toHaveBeenCalledWith(`Coordination notification: ${notification}`);

      unmount();

      // Re-initialize
      const { result: newResult } = renderHook(() => useCoordination());
      newResult.current.notify('New message');
      expect(consoleLogSpy).toHaveBeenCalledWith('Coordination notification: New message');
    });
  });

  describe('Notification System', () => {
    it('should log notification messages', () => {
      const { result } = renderHook(() => useCoordination());

      const message = 'Test notification';
      result.current.notify(message);

      expect(consoleLogSpy).toHaveBeenCalledWith(`Coordination notification: ${message}`);
    });

    it('should handle empty notification messages', () => {
      const { result } = renderHook(() => useCoordination());

      result.current.notify('');

      expect(consoleLogSpy).toHaveBeenCalledWith('Coordination notification: ');
    });

    it('should handle special characters in notifications', () => {
      const { result } = renderHook(() => useCoordination());

      const specialMessage = 'Test with 🚀 emojis and \n newlines';
      result.current.notify(specialMessage);

      expect(consoleLogSpy).toHaveBeenCalledWith(`Coordination notification: ${specialMessage}`);
    });

    it('should handle long notification messages', () => {
      const { result } = renderHook(() => useCoordination());

      const longMessage = 'A'.repeat(1000);
      result.current.notify(longMessage);

      expect(consoleLogSpy).toHaveBeenCalledWith(`Coordination notification: ${longMessage}`);
    });

    it('should handle multiple rapid notifications', () => {
      const { result } = renderHook(() => useCoordination());

      for (let i = 0; i < 10; i++) {
        result.current.notify(`Message ${i}`);
      }

      expect(consoleLogSpy).toHaveBeenCalledTimes(10);
      expect(consoleLogSpy).toHaveBeenNthCalledWith(5, 'Coordination notification: Message 4');
    });
  });

  describe('Memory Management - Async Operations', () => {
    it('should store and retrieve simple values', async () => {
      const { result } = renderHook(() => useCoordination());

      const key = 'test-key';
      const value = 'test-value';

      await act(async () => {
        await result.current.setMemory(key, value);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `coordination_${key}`,
        JSON.stringify(value)
      );

      localStorageMock.getItem.mockReturnValue(JSON.stringify(value));

      const retrievedValue = await act(async () => {
        return await result.current.getMemory(key);
      });

      expect(retrievedValue).toBe(value);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(`coordination_${key}`);
    });

    it('should store and retrieve complex objects', async () => {
      const { result } = renderHook(() => useCoordination());

      const key = 'complex-key';
      const value = {
        id: 123,
        name: 'Test Object',
        nested: {
          array: [1, 2, 3],
          boolean: true,
          null_value: null,
          undefined_value: undefined
        },
        timestamp: new Date().toISOString()
      };

      await act(async () => {
        await result.current.setMemory(key, value);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `coordination_${key}`,
        JSON.stringify(value)
      );

      localStorageMock.getItem.mockReturnValue(JSON.stringify(value));

      const retrievedValue = await act(async () => {
        return await result.current.getMemory(key);
      });

      expect(retrievedValue).toEqual(value);
    });

    it('should handle arrays and nested data structures', async () => {
      const { result } = renderHook(() => useCoordination());

      const complexData = [
        { id: 1, items: ['a', 'b', 'c'] },
        { id: 2, items: [{ nested: true }, { nested: false }] },
        { id: 3, items: [] }
      ];

      await act(async () => {
        await result.current.setMemory('array-data', complexData);
      });

      localStorageMock.getItem.mockReturnValue(JSON.stringify(complexData));

      const retrieved = await act(async () => {
        return await result.current.getMemory('array-data');
      });

      expect(retrieved).toEqual(complexData);
    });

    it('should return null for non-existent keys', async () => {
      const { result } = renderHook(() => useCoordination());

      localStorageMock.getItem.mockReturnValue(null);

      const retrievedValue = await act(async () => {
        return await result.current.getMemory('non-existent-key');
      });

      expect(retrievedValue).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', async () => {
      const { result } = renderHook(() => useCoordination());

      const malformedJson = '{ invalid json }';
      localStorageMock.getItem.mockReturnValue(malformedJson);

      const retrievedValue = await act(async () => {
        return await result.current.getMemory('malformed-key');
      });

      expect(retrievedValue).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to get coordination memory for key malformed-key:',
        expect.any(SyntaxError)
      );
    });

    it('should handle localStorage setItem errors gracefully', async () => {
      const { result } = renderHook(() => useCoordination());

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      await act(async () => {
        await result.current.setMemory('test-key', 'test-value');
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to set coordination memory for key test-key:',
        expect.any(Error)
      );
    });

    it('should handle localStorage getItem errors gracefully', async () => {
      const { result } = renderHook(() => useCoordination());

      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage access denied');
      });

      const retrievedValue = await act(async () => {
        return await result.current.getMemory('error-key');
      });

      expect(retrievedValue).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to get coordination memory for key error-key:',
        expect.any(Error)
      );
    });

    it('should handle concurrent async operations', async () => {
      const { result } = renderHook(() => useCoordination());

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          act(async () => {
            await result.current.setMemory(`concurrent-${i}`, `value-${i}`);
          })
        );
      }

      await Promise.all(promises);

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(5);
      for (let i = 0; i < 5; i++) {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          `coordination_concurrent-${i}`,
          JSON.stringify(`value-${i}`)
        );
      }
    });
  });

  describe('Memory Management - Synchronous Operations', () => {
    it('should update memory synchronously', () => {
      const { result } = renderHook(() => useCoordination());

      const key = 'sync-key';
      const value = { sync: true, timestamp: Date.now() };

      act(() => {
        result.current.updateMemory?.(key, value);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `coordination_${key}`,
        JSON.stringify(value)
      );
    });

    it('should handle synchronous update errors gracefully', () => {
      const { result } = renderHook(() => useCoordination());

      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Synchronous storage error');
      });

      act(() => {
        result.current.updateMemory?.('error-key', 'error-value');
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to update coordination memory for key error-key:',
        expect.any(Error)
      );
    });

    it('should handle rapid synchronous updates', () => {
      const { result } = renderHook(() => useCoordination());

      act(() => {
        for (let i = 0; i < 50; i++) {
          result.current.updateMemory?.(`rapid-${i}`, `value-${i}`);
        }
      });

      expect(localStorageMock.setItem).toHaveBeenCalledTimes(50);
    });
  });

  describe('Progress Reporting', () => {
    it('should report progress with task name and percentage', () => {
      const { result } = renderHook(() => useCoordination());

      const taskName = 'data-processing';
      const progress = 75;

      result.current.reportProgress?.(taskName, progress);

      expect(consoleLogSpy).toHaveBeenCalledWith(`Task ${taskName}: ${progress}% complete`);
    });

    it('should handle zero progress', () => {
      const { result } = renderHook(() => useCoordination());

      result.current.reportProgress?.('initialization', 0);

      expect(consoleLogSpy).toHaveBeenCalledWith('Task initialization: 0% complete');
    });

    it('should handle 100% progress', () => {
      const { result } = renderHook(() => useCoordination());

      result.current.reportProgress?.('completion', 100);

      expect(consoleLogSpy).toHaveBeenCalledWith('Task completion: 100% complete');
    });

    it('should handle decimal progress values', () => {
      const { result } = renderHook(() => useCoordination());

      result.current.reportProgress?.('analysis', 33.33);

      expect(consoleLogSpy).toHaveBeenCalledWith('Task analysis: 33.33% complete');
    });

    it('should handle negative progress values', () => {
      const { result } = renderHook(() => useCoordination());

      result.current.reportProgress?.('invalid-task', -10);

      expect(consoleLogSpy).toHaveBeenCalledWith('Task invalid-task: -10% complete');
    });

    it('should handle progress values over 100%', () => {
      const { result } = renderHook(() => useCoordination());

      result.current.reportProgress?.('overflow-task', 150);

      expect(consoleLogSpy).toHaveBeenCalledWith('Task overflow-task: 150% complete');
    });

    it('should handle empty task names', () => {
      const { result } = renderHook(() => useCoordination());

      result.current.reportProgress?.('', 50);

      expect(consoleLogSpy).toHaveBeenCalledWith('Task : 50% complete');
    });

    it('should handle special characters in task names', () => {
      const { result } = renderHook(() => useCoordination());

      const taskName = 'task-with-special-chars@#$%^&*()';
      result.current.reportProgress?.(taskName, 25);

      expect(consoleLogSpy).toHaveBeenCalledWith(`Task ${taskName}: 25% complete`);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle null/undefined values in memory operations', async () => {
      const { result } = renderHook(() => useCoordination());

      // Test null
      await act(async () => {
        await result.current.setMemory('null-key', null);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'coordination_null-key',
        JSON.stringify(null)
      );

      // Test undefined
      await act(async () => {
        await result.current.setMemory('undefined-key', undefined);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'coordination_undefined-key',
        JSON.stringify(undefined)
      );
    });

    it('should handle circular references in objects', async () => {
      const { result } = renderHook(() => useCoordination());

      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      await act(async () => {
        await result.current.setMemory('circular-key', circularObj);
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to set coordination memory for key circular-key:',
        expect.any(TypeError)
      );
    });

    it('should handle very large objects', async () => {
      const { result } = renderHook(() => useCoordination());

      const largeObject = {
        data: Array.from({ length: 10000 }, (_, i) => ({
          id: i,
          value: `item-${i}`,
          metadata: {
            timestamp: Date.now(),
            random: Math.random(),
            description: `Description for item ${i}`.repeat(10)
          }
        }))
      };

      await act(async () => {
        await result.current.setMemory('large-object', largeObject);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'coordination_large-object',
        JSON.stringify(largeObject)
      );
    });

    it('should handle special characters in keys', async () => {
      const { result } = renderHook(() => useCoordination());

      const specialKey = 'key-with-special@#$%^&*()chars';
      const value = 'test-value';

      await act(async () => {
        await result.current.setMemory(specialKey, value);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `coordination_${specialKey}`,
        JSON.stringify(value)
      );
    });

    it('should handle empty string keys', async () => {
      const { result } = renderHook(() => useCoordination());

      await act(async () => {
        await result.current.setMemory('', 'empty-key-value');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'coordination_',
        JSON.stringify('empty-key-value')
      );
    });

    it('should handle function values gracefully', async () => {
      const { result } = renderHook(() => useCoordination());

      const functionValue = () => console.log('test');

      await act(async () => {
        await result.current.setMemory('function-key', functionValue);
      });

      // Functions cannot be serialized to JSON
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'coordination_function-key',
        JSON.stringify(functionValue)
      );
    });

    it('should handle symbol values', async () => {
      const { result } = renderHook(() => useCoordination());

      const symbolValue = Symbol('test');

      await act(async () => {
        await result.current.setMemory('symbol-key', symbolValue);
      });

      // Symbols cannot be serialized to JSON
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'coordination_symbol-key',
        JSON.stringify(symbolValue)
      );
    });

    it('should handle BigInt values', async () => {
      const { result } = renderHook(() => useCoordination());

      const bigIntValue = BigInt(9007199254740991);

      await act(async () => {
        await result.current.setMemory('bigint-key', bigIntValue);
      });

      // BigInt cannot be serialized to JSON without custom handling
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Failed to set coordination memory for key bigint-key:',
        expect.any(TypeError)
      );
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle rapid memory operations efficiently', async () => {
      const { result } = renderHook(() => useCoordination());

      const start = performance.now();

      const operations = [];
      for (let i = 0; i < 100; i++) {
        operations.push(
          act(async () => {
            await result.current.setMemory(`perf-key-${i}`, `value-${i}`);
          })
        );
      }

      await Promise.all(operations);

      const end = performance.now();
      const duration = end - start;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(100);
    });

    it('should handle mixed sync and async operations', () => {
      const { result } = renderHook(() => useCoordination());

      act(() => {
        // Mix of different operations
        result.current.notify('Starting mixed operations');
        result.current.updateMemory?.('sync-1', 'sync-value-1');
        result.current.reportProgress?.('mixed-task', 25);
        result.current.updateMemory?.('sync-2', 'sync-value-2');
        result.current.notify('Mixed operations in progress');
        result.current.reportProgress?.('mixed-task', 50);
      });

      expect(consoleLogSpy).toHaveBeenCalledTimes(4); // 2 notifications + 2 progress reports
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2); // 2 sync updates
    });

    it('should not cause memory leaks with repeated use', () => {
      const { result, unmount } = renderHook(() => useCoordination());

      // Perform many operations
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.notify(`Message ${i}`);
          result.current.updateMemory?.(`key-${i}`, `value-${i}`);
          result.current.reportProgress?.(`task-${i}`, i % 100);
        }
      });

      // Should not throw during cleanup
      expect(() => unmount()).not.toThrow();
    });

    it('should handle stress testing scenarios', async () => {
      const { result } = renderHook(() => useCoordination());

      // Stress test with concurrent operations
      const stressOperations = [];

      for (let i = 0; i < 50; i++) {
        stressOperations.push(
          act(async () => {
            result.current.notify(`Stress message ${i}`);
            await result.current.setMemory(`stress-key-${i}`, { 
              index: i, 
              data: Array(100).fill(i),
              timestamp: Date.now()
            });
            result.current.reportProgress?.(`stress-task-${i}`, (i / 50) * 100);
            result.current.updateMemory?.(`sync-stress-${i}`, `sync-value-${i}`);
          })
        );
      }

      await Promise.all(stressOperations);

      expect(consoleLogSpy).toHaveBeenCalledTimes(100); // 50 notifications + 50 progress reports
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(100); // 50 async + 50 sync
    });
  });

  describe('Key Prefixing and Namespacing', () => {
    it('should properly prefix all keys with coordination_', async () => {
      const { result } = renderHook(() => useCoordination());

      const testCases = [
        'simple-key',
        'complex.key.with.dots',
        'key-with-numbers123',
        'UPPERCASE_KEY',
        'mixedCaseKey'
      ];

      for (const key of testCases) {
        await act(async () => {
          await result.current.setMemory(key, `value-for-${key}`);
        });
      }

      testCases.forEach(key => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          `coordination_${key}`,
          JSON.stringify(`value-for-${key}`)
        );
      });
    });

    it('should maintain key consistency between set and get operations', async () => {
      const { result } = renderHook(() => useCoordination());

      const key = 'consistency-test';
      const value = { test: 'data' };

      await act(async () => {
        await result.current.setMemory(key, value);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `coordination_${key}`,
        JSON.stringify(value)
      );

      localStorageMock.getItem.mockReturnValue(JSON.stringify(value));

      await act(async () => {
        await result.current.getMemory(key);
      });

      expect(localStorageMock.getItem).toHaveBeenCalledWith(`coordination_${key}`);
    });

    it('should handle key prefixing for sync operations', () => {
      const { result } = renderHook(() => useCoordination());

      const key = 'sync-prefix-test';
      const value = 'sync-test-value';

      act(() => {
        result.current.updateMemory?.(key, value);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        `coordination_${key}`,
        JSON.stringify(value)
      );
    });
  });
});