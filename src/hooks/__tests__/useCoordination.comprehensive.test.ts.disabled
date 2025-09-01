/**
 * useCoordination Hook - Comprehensive Tests
 * Tests covering all coordination functionality including notifications,
 * memory management, progress reporting, and error handling
 */

import { renderHook, act } from '@testing-library/react';
import { useCoordination } from '../useCoordination';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

// Mock console methods
const mockConsole = {
  log: jest.spyOn(console, 'log').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {})
};

describe('useCoordination Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockImplementation(() => {});
  });

  afterAll(() => {
    mockConsole.log.mockRestore();
    mockConsole.warn.mockRestore();
  });

  describe('Hook Interface', () => {
    it('should return all expected methods', () => {
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

    it('should maintain consistent interface across re-renders', () => {
      const { result, rerender } = renderHook(() => useCoordination());

      const firstRender = result.current;
      
      rerender();
      
      const secondRender = result.current;

      // Functions should be the same reference (memoized)
      expect(firstRender.notify).toBe(secondRender.notify);
      expect(firstRender.getMemory).toBe(secondRender.getMemory);
      expect(firstRender.setMemory).toBe(secondRender.setMemory);
      expect(firstRender.reportProgress).toBe(secondRender.reportProgress);
      expect(firstRender.updateMemory).toBe(secondRender.updateMemory);
    });
  });

  describe('Notification System', () => {
    it('should log notification messages', () => {
      const { result } = renderHook(() => useCoordination());

      act(() => {
        result.current.notify('Test notification message');
      });

      expect(mockConsole.log).toHaveBeenCalledWith('Coordination notification: Test notification message');
    });

    it('should handle empty notification messages', () => {
      const { result } = renderHook(() => useCoordination());

      act(() => {
        result.current.notify('');
      });

      expect(mockConsole.log).toHaveBeenCalledWith('Coordination notification: ');
    });

    it('should handle special characters in notifications', () => {
      const { result } = renderHook(() => useCoordination());

      const specialMessage = 'Special chars: !@#$%^&*()_+ 中文 🚀';

      act(() => {
        result.current.notify(specialMessage);
      });

      expect(mockConsole.log).toHaveBeenCalledWith(`Coordination notification: ${specialMessage}`);
    });

    it('should handle very long notification messages', () => {
      const { result } = renderHook(() => useCoordination());

      const longMessage = 'a'.repeat(1000);

      act(() => {
        result.current.notify(longMessage);
      });

      expect(mockConsole.log).toHaveBeenCalledWith(`Coordination notification: ${longMessage}`);
    });
  });

  describe('Memory Management - Get', () => {
    it('should retrieve stored memory successfully', async () => {
      const testData = { key: 'value', nested: { data: 123 } };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));

      const { result } = renderHook(() => useCoordination());

      const retrievedData = await act(async () => {
        return await result.current.getMemory('test_key');
      });

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('coordination_test_key');
      expect(retrievedData).toEqual(testData);
    });

    it('should return null for non-existent memory keys', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useCoordination());

      const retrievedData = await act(async () => {
        return await result.current.getMemory('non_existent_key');
      });

      expect(retrievedData).toBeNull();
    });

    it('should handle JSON parsing errors gracefully', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json {');

      const { result } = renderHook(() => useCoordination());

      const retrievedData = await act(async () => {
        return await result.current.getMemory('invalid_key');
      });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to get coordination memory for key invalid_key:',
        expect.any(Error)
      );
      expect(retrievedData).toBeNull();
    });

    it('should handle localStorage access errors', async () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      const { result } = renderHook(() => useCoordination());

      const retrievedData = await act(async () => {
        return await result.current.getMemory('error_key');
      });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to get coordination memory for key error_key:',
        expect.any(Error)
      );
      expect(retrievedData).toBeNull();
    });
  });

  describe('Memory Management - Set', () => {
    it('should store memory data successfully', async () => {
      const testData = { key: 'value', number: 42, array: [1, 2, 3] };

      const { result } = renderHook(() => useCoordination());

      await act(async () => {
        await result.current.setMemory('test_key', testData);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coordination_test_key',
        JSON.stringify(testData)
      );
    });

    it('should handle complex data structures', async () => {
      const complexData = {
        nested: {
          deep: {
            value: 'test',
            array: [{ id: 1, name: 'item1' }, { id: 2, name: 'item2' }]
          }
        },
        functions: null, // Functions can't be serialized
        date: new Date().toISOString(),
        boolean: true,
        number: 3.14159
      };

      const { result } = renderHook(() => useCoordination());

      await act(async () => {
        await result.current.setMemory('complex_key', complexData);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coordination_complex_key',
        JSON.stringify(complexData)
      );
    });

    it('should handle localStorage write errors gracefully', async () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage quota exceeded');
      });

      const { result } = renderHook(() => useCoordination());

      await act(async () => {
        await result.current.setMemory('error_key', { data: 'test' });
      });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to set coordination memory for key error_key:',
        expect.any(Error)
      );
    });

    it('should handle null and undefined values', async () => {
      const { result } = renderHook(() => useCoordination());

      await act(async () => {
        await result.current.setMemory('null_key', null);
      });

      await act(async () => {
        await result.current.setMemory('undefined_key', undefined);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('coordination_null_key', 'null');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('coordination_undefined_key', undefined);
    });
  });

  describe('Memory Management - Update (Synchronous)', () => {
    it('should update memory synchronously', () => {
      const testData = { updated: true, timestamp: Date.now() };

      const { result } = renderHook(() => useCoordination());

      act(() => {
        result.current.updateMemory!('sync_key', testData);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coordination_sync_key',
        JSON.stringify(testData)
      );
    });

    it('should handle synchronous update errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useCoordination());

      act(() => {
        result.current.updateMemory!('error_key', { data: 'test' });
      });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to update coordination memory for key error_key:',
        expect.any(Error)
      );
    });
  });

  describe('Progress Reporting', () => {
    it('should report task progress', () => {
      const { result } = renderHook(() => useCoordination());

      act(() => {
        result.current.reportProgress!('data_processing', 75);
      });

      expect(mockConsole.log).toHaveBeenCalledWith('Task data_processing: 75% complete');
    });

    it('should handle progress values at boundaries', () => {
      const { result } = renderHook(() => useCoordination());

      act(() => {
        result.current.reportProgress!('task_start', 0);
      });

      act(() => {
        result.current.reportProgress!('task_complete', 100);
      });

      expect(mockConsole.log).toHaveBeenCalledWith('Task task_start: 0% complete');
      expect(mockConsole.log).toHaveBeenCalledWith('Task task_complete: 100% complete');
    });

    it('should handle decimal progress values', () => {
      const { result } = renderHook(() => useCoordination());

      act(() => {
        result.current.reportProgress!('precision_task', 33.33);
      });

      expect(mockConsole.log).toHaveBeenCalledWith('Task precision_task: 33.33% complete');
    });

    it('should handle task names with special characters', () => {
      const { result } = renderHook(() => useCoordination());

      const taskName = 'task-with_special.chars@2024';

      act(() => {
        result.current.reportProgress!(taskName, 50);
      });

      expect(mockConsole.log).toHaveBeenCalledWith(`Task ${taskName}: 50% complete`);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle full workflow: notify -> set memory -> get memory -> report progress', async () => {
      const { result } = renderHook(() => useCoordination());
      const testData = { workflow: 'test', step: 1 };

      // Start workflow
      act(() => {
        result.current.notify('Starting workflow');
      });

      // Store initial data
      await act(async () => {
        await result.current.setMemory('workflow_data', testData);
      });

      // Retrieve data
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));
      const retrievedData = await act(async () => {
        return await result.current.getMemory('workflow_data');
      });

      // Report progress
      act(() => {
        result.current.reportProgress!('workflow', 100);
      });

      // Complete workflow
      act(() => {
        result.current.notify('Workflow completed');
      });

      expect(mockConsole.log).toHaveBeenCalledWith('Coordination notification: Starting workflow');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coordination_workflow_data',
        JSON.stringify(testData)
      );
      expect(retrievedData).toEqual(testData);
      expect(mockConsole.log).toHaveBeenCalledWith('Task workflow: 100% complete');
      expect(mockConsole.log).toHaveBeenCalledWith('Coordination notification: Workflow completed');
    });

    it('should handle concurrent memory operations', async () => {
      const { result } = renderHook(() => useCoordination());

      const operations = [
        result.current.setMemory('key1', { data: 1 }),
        result.current.setMemory('key2', { data: 2 }),
        result.current.setMemory('key3', { data: 3 })
      ];

      await act(async () => {
        await Promise.all(operations);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(3);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('coordination_key1', JSON.stringify({ data: 1 }));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('coordination_key2', JSON.stringify({ data: 2 }));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('coordination_key3', JSON.stringify({ data: 3 }));
    });

    it('should handle mixed synchronous and asynchronous operations', async () => {
      const { result } = renderHook(() => useCoordination());

      // Mix of sync and async operations
      act(() => {
        result.current.notify('Starting mixed operations');
        result.current.updateMemory!('sync_key', { sync: true });
        result.current.reportProgress!('mixed_task', 25);
      });

      await act(async () => {
        await result.current.setMemory('async_key', { async: true });
      });

      act(() => {
        result.current.reportProgress!('mixed_task', 100);
        result.current.notify('Mixed operations completed');
      });

      expect(mockConsole.log).toHaveBeenCalledWith('Coordination notification: Starting mixed operations');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('coordination_sync_key', JSON.stringify({ sync: true }));
      expect(mockConsole.log).toHaveBeenCalledWith('Task mixed_task: 25% complete');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('coordination_async_key', JSON.stringify({ async: true }));
      expect(mockConsole.log).toHaveBeenCalledWith('Task mixed_task: 100% complete');
      expect(mockConsole.log).toHaveBeenCalledWith('Coordination notification: Mixed operations completed');
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large data objects efficiently', async () => {
      const largeObject = {
        data: new Array(10000).fill(0).map((_, i) => ({ id: i, value: `item_${i}` }))
      };

      const { result } = renderHook(() => useCoordination());

      await act(async () => {
        await result.current.setMemory('large_data', largeObject);
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coordination_large_data',
        JSON.stringify(largeObject)
      );
    });

    it('should handle rapid sequential operations', async () => {
      const { result } = renderHook(() => useCoordination());

      // Rapid notifications
      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.notify(`Notification ${i}`);
        }
      });

      expect(mockConsole.log).toHaveBeenCalledTimes(100);

      // Rapid progress reports
      act(() => {
        for (let i = 0; i <= 100; i += 10) {
          result.current.reportProgress!('rapid_task', i);
        }
      });

      expect(mockConsole.log).toHaveBeenCalledTimes(111); // 100 notifications + 11 progress reports
    });

    it('should not leak memory across hook instances', () => {
      // Create multiple hook instances
      const { unmount: unmount1 } = renderHook(() => useCoordination());
      const { unmount: unmount2 } = renderHook(() => useCoordination());
      const { result } = renderHook(() => useCoordination());

      // Use the remaining hook
      act(() => {
        result.current.notify('Test after unmount');
      });

      // Cleanup
      unmount1();
      unmount2();

      expect(mockConsole.log).toHaveBeenCalledWith('Coordination notification: Test after unmount');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle circular references in data', async () => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData; // Create circular reference

      const { result } = renderHook(() => useCoordination());

      await act(async () => {
        await result.current.setMemory('circular_key', circularData);
      });

      // JSON.stringify should handle the circular reference error
      expect(mockConsole.warn).toHaveBeenCalledWith(
        'Failed to set coordination memory for key circular_key:',
        expect.any(Error)
      );
    });

    it('should handle extremely long keys', async () => {
      const longKey = 'a'.repeat(10000);
      const { result } = renderHook(() => useCoordination());

      await act(async () => {
        await result.current.setMemory(longKey, { data: 'test' });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `coordination_${longKey}`,
        JSON.stringify({ data: 'test' })
      );
    });

    it('should handle keys with special characters', async () => {
      const specialKey = 'key/with\\special:characters*?<>|';
      const { result } = renderHook(() => useCoordination());

      await act(async () => {
        await result.current.setMemory(specialKey, { data: 'test' });
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `coordination_${specialKey}`,
        JSON.stringify({ data: 'test' })
      );
    });

    it('should handle function parameters gracefully', async () => {
      const { result } = renderHook(() => useCoordination());

      // Functions cannot be serialized, should handle gracefully
      const dataWithFunction = {
        callback: () => console.log('test'),
        data: 'normal data'
      };

      await act(async () => {
        await result.current.setMemory('function_key', dataWithFunction);
      });

      // Should attempt to store but functions will be lost in serialization
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coordination_function_key',
        expect.any(String)
      );
    });

    it('should handle empty string keys', async () => {
      const { result } = renderHook(() => useCoordination());

      await act(async () => {
        await result.current.setMemory('', { data: 'empty key test' });
      });

      const retrievedData = await act(async () => {
        return await result.current.getMemory('');
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'coordination_',
        JSON.stringify({ data: 'empty key test' })
      );
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('coordination_');
    });
  });
});