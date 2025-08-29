/**
 * Comprehensive tests for common React hook patterns and utilities
 * Tests custom hooks that implement common patterns like useLocalStorage, useDebounce, etc.
 */

import { renderHook, act } from '@testing-library/react';
import { useState, useEffect, useCallback, useMemo } from 'react';

// Custom hook implementations for testing
const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

const useDebounce = <T>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const usePrevious = <T>(value: T): T | undefined => {
  const [previous, setPrevious] = useState<T | undefined>();

  useEffect(() => {
    setPrevious(value);
  }, [value]);

  return previous;
};

const useToggle = (initialValue = false) => {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);

  return [value, toggle, setTrue, setFalse] as const;
};

const useCounter = (initialValue = 0) => {
  const [count, setCount] = useState<number>(initialValue);

  const increment = useCallback(() => setCount(c => c + 1), []);
  const decrement = useCallback(() => setCount(c => c - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  const set = useCallback((value: number) => setCount(value), []);

  return { count, increment, decrement, reset, set } as const;
};

const useArray = <T>(initialArray: T[] = []) => {
  const [array, setArray] = useState<T[]>(initialArray);

  const push = useCallback((element: T) => {
    setArray(arr => [...arr, element]);
  }, []);

  const filter = useCallback((callback: (item: T, index: number) => boolean) => {
    setArray(arr => arr.filter(callback));
  }, []);

  const update = useCallback((index: number, newElement: T) => {
    setArray(arr => [
      ...arr.slice(0, index),
      newElement,
      ...arr.slice(index + 1)
    ]);
  }, []);

  const remove = useCallback((index: number) => {
    setArray(arr => [
      ...arr.slice(0, index),
      ...arr.slice(index + 1)
    ]);
  }, []);

  const clear = useCallback(() => {
    setArray([]);
  }, []);

  return {
    array,
    set: setArray,
    push,
    filter,
    update,
    remove,
    clear
  } as const;
};

const useAsync = <T, E = string>(asyncFunction: () => Promise<T>) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [value, setValue] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setValue(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setValue(response);
      setStatus('success');
    } catch (error) {
      setError(error as E);
      setStatus('error');
    }
  }, [asyncFunction]);

  return { execute, status, value, error };
};

const useFetch = <T>(url: string, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (!isCancelled) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred');
          setData(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [url, options]);

  return { data, loading, error };
};

// Mock localStorage for testing
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

// Mock fetch for testing
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Custom Hook Patterns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('useLocalStorage', () => {
    it('should return initial value when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'));
      
      expect(result.current[0]).toBe('default-value');
    });

    it('should return stored value from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify('stored-value'));
      
      const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'));
      
      expect(result.current[0]).toBe('stored-value');
    });

    it('should update localStorage when value changes', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[1]('new-value');
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'));
      expect(result.current[0]).toBe('new-value');
    });

    it('should handle functional updates', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(5));
      
      const { result } = renderHook(() => useLocalStorage('counter', 0));
      
      act(() => {
        result.current[1]((prev: number) => prev + 1);
      });

      expect(result.current[0]).toBe(6);
    });

    it('should handle localStorage errors gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      const { result } = renderHook(() => useLocalStorage('error-key', 'default'));
      
      expect(result.current[0]).toBe('default');
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    it('should remove value from localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));
      
      act(() => {
        result.current[2](); // removeValue
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
      expect(result.current[0]).toBe('initial');
    });

    it('should handle complex objects', () => {
      const complexObject = { name: 'test', items: [1, 2, 3], nested: { value: true } };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(complexObject));
      
      const { result } = renderHook(() => useLocalStorage('complex', {}));
      
      expect(result.current[0]).toEqual(complexObject);
    });
  });

  describe('useDebounce', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      
      expect(result.current).toBe('initial');
    });

    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'updated', delay: 500 });
      expect(result.current).toBe('initial'); // Still old value

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('should cancel previous timer on rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'change1', delay: 500 });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      rerender({ value: 'change2', delay: 500 });
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current).toBe('initial'); // Should still be initial

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(result.current).toBe('change2'); // Should be latest value
    });

    it('should handle different delay values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 1000 } }
      );

      rerender({ value: 'updated', delay: 100 });
      
      act(() => {
        jest.advanceTimersByTime(100);
      });

      expect(result.current).toBe('updated');
    });

    it('should handle zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 0 } }
      );

      rerender({ value: 'immediate', delay: 0 });
      
      act(() => {
        jest.advanceTimersByTime(0);
      });

      expect(result.current).toBe('immediate');
    });
  });

  describe('usePrevious', () => {
    it('should return undefined initially', () => {
      const { result } = renderHook(() => usePrevious('initial'));
      
      expect(result.current).toBeUndefined();
    });

    it('should return previous value after update', () => {
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: 'first' } }
      );

      expect(result.current).toBeUndefined();

      rerender({ value: 'second' });
      expect(result.current).toBe('first');

      rerender({ value: 'third' });
      expect(result.current).toBe('second');
    });

    it('should work with complex objects', () => {
      const obj1 = { id: 1, name: 'first' };
      const obj2 = { id: 2, name: 'second' };
      
      const { result, rerender } = renderHook(
        ({ value }) => usePrevious(value),
        { initialProps: { value: obj1 } }
      );

      rerender({ value: obj2 });
      expect(result.current).toBe(obj1);
    });
  });

  describe('useToggle', () => {
    it('should start with initial value', () => {
      const { result } = renderHook(() => useToggle(true));
      
      expect(result.current[0]).toBe(true);
    });

    it('should default to false', () => {
      const { result } = renderHook(() => useToggle());
      
      expect(result.current[0]).toBe(false);
    });

    it('should toggle value', () => {
      const { result } = renderHook(() => useToggle(false));
      
      act(() => {
        result.current[1](); // toggle
      });

      expect(result.current[0]).toBe(true);

      act(() => {
        result.current[1](); // toggle again
      });

      expect(result.current[0]).toBe(false);
    });

    it('should set to true', () => {
      const { result } = renderHook(() => useToggle(false));
      
      act(() => {
        result.current[2](); // setTrue
      });

      expect(result.current[0]).toBe(true);
    });

    it('should set to false', () => {
      const { result } = renderHook(() => useToggle(true));
      
      act(() => {
        result.current[3](); // setFalse
      });

      expect(result.current[0]).toBe(false);
    });

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useToggle());
      
      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      expect(secondRender[1]).toBe(firstRender[1]); // toggle
      expect(secondRender[2]).toBe(firstRender[2]); // setTrue
      expect(secondRender[3]).toBe(firstRender[3]); // setFalse
    });
  });

  describe('useCounter', () => {
    it('should start with initial value', () => {
      const { result } = renderHook(() => useCounter(5));
      
      expect(result.current.count).toBe(5);
    });

    it('should default to 0', () => {
      const { result } = renderHook(() => useCounter());
      
      expect(result.current.count).toBe(0);
    });

    it('should increment count', () => {
      const { result } = renderHook(() => useCounter(0));
      
      act(() => {
        result.current.increment();
      });

      expect(result.current.count).toBe(1);
    });

    it('should decrement count', () => {
      const { result } = renderHook(() => useCounter(5));
      
      act(() => {
        result.current.decrement();
      });

      expect(result.current.count).toBe(4);
    });

    it('should reset to initial value', () => {
      const { result } = renderHook(() => useCounter(10));
      
      act(() => {
        result.current.increment();
        result.current.increment();
      });

      expect(result.current.count).toBe(12);

      act(() => {
        result.current.reset();
      });

      expect(result.current.count).toBe(10);
    });

    it('should set to specific value', () => {
      const { result } = renderHook(() => useCounter());
      
      act(() => {
        result.current.set(42);
      });

      expect(result.current.count).toBe(42);
    });

    it('should handle negative values', () => {
      const { result } = renderHook(() => useCounter(-5));
      
      expect(result.current.count).toBe(-5);

      act(() => {
        result.current.decrement();
      });

      expect(result.current.count).toBe(-6);
    });
  });

  describe('useArray', () => {
    it('should start with initial array', () => {
      const { result } = renderHook(() => useArray([1, 2, 3]));
      
      expect(result.current.array).toEqual([1, 2, 3]);
    });

    it('should default to empty array', () => {
      const { result } = renderHook(() => useArray());
      
      expect(result.current.array).toEqual([]);
    });

    it('should push elements', () => {
      const { result } = renderHook(() => useArray<string>([]));
      
      act(() => {
        result.current.push('item1');
        result.current.push('item2');
      });

      expect(result.current.array).toEqual(['item1', 'item2']);
    });

    it('should filter elements', () => {
      const { result } = renderHook(() => useArray([1, 2, 3, 4, 5]));
      
      act(() => {
        result.current.filter(item => item % 2 === 0);
      });

      expect(result.current.array).toEqual([2, 4]);
    });

    it('should update element at index', () => {
      const { result } = renderHook(() => useArray(['a', 'b', 'c']));
      
      act(() => {
        result.current.update(1, 'updated');
      });

      expect(result.current.array).toEqual(['a', 'updated', 'c']);
    });

    it('should remove element at index', () => {
      const { result } = renderHook(() => useArray(['a', 'b', 'c']));
      
      act(() => {
        result.current.remove(1);
      });

      expect(result.current.array).toEqual(['a', 'c']);
    });

    it('should clear array', () => {
      const { result } = renderHook(() => useArray([1, 2, 3]));
      
      act(() => {
        result.current.clear();
      });

      expect(result.current.array).toEqual([]);
    });

    it('should set entire array', () => {
      const { result } = renderHook(() => useArray<string>([]));
      
      act(() => {
        result.current.set(['new', 'array']);
      });

      expect(result.current.array).toEqual(['new', 'array']);
    });
  });

  describe('useAsync', () => {
    it('should start in idle state', () => {
      const asyncFn = jest.fn().mockResolvedValue('data');
      const { result } = renderHook(() => useAsync(asyncFn));
      
      expect(result.current.status).toBe('idle');
      expect(result.current.value).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should handle successful execution', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success-data');
      const { result } = renderHook(() => useAsync(asyncFn));
      
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.status).toBe('success');
      expect(result.current.value).toBe('success-data');
      expect(result.current.error).toBeNull();
    });

    it('should handle failed execution', async () => {
      const asyncFn = jest.fn().mockRejectedValue('error-message');
      const { result } = renderHook(() => useAsync(asyncFn));
      
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.status).toBe('error');
      expect(result.current.value).toBeNull();
      expect(result.current.error).toBe('error-message');
    });

    it('should set pending state during execution', async () => {
      let resolvePromise: (value: string) => void;
      const asyncFn = jest.fn().mockImplementation(() => {
        return new Promise<string>(resolve => {
          resolvePromise = resolve;
        });
      });
      
      const { result } = renderHook(() => useAsync(asyncFn));
      
      act(() => {
        result.current.execute();
      });

      expect(result.current.status).toBe('pending');

      await act(async () => {
        resolvePromise!('resolved-data');
      });

      expect(result.current.status).toBe('success');
      expect(result.current.value).toBe('resolved-data');
    });

    it('should clear previous values on new execution', async () => {
      const asyncFn = jest.fn()
        .mockResolvedValueOnce('first-data')
        .mockRejectedValueOnce('error');
      
      const { result } = renderHook(() => useAsync(asyncFn));
      
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.value).toBe('first-data');
      expect(result.current.status).toBe('success');

      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.value).toBeNull();
      expect(result.current.error).toBe('error');
      expect(result.current.status).toBe('error');
    });
  });

  describe('useFetch', () => {
    it('should start in loading state', () => {
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      );
      
      const { result } = renderHook(() => useFetch('/api/test'));
      
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should fetch data successfully', async () => {
      const mockData = { id: 1, name: 'test' };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData)
      });
      
      const { result } = renderHook(() => useFetch('/api/test'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404
      });
      
      const { result } = renderHook(() => useFetch('/api/test'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('HTTP error! status: 404');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useFetch('/api/test'));
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Network error');
    });

    it('should refetch when URL changes', async () => {
      const mockData1 = { id: 1, name: 'first' };
      const mockData2 = { id: 2, name: 'second' };
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData1)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockData2)
        });
      
      const { result, rerender } = renderHook(
        ({ url }) => useFetch(url),
        { initialProps: { url: '/api/test1' } }
      );
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.data).toEqual(mockData1);

      rerender({ url: '/api/test2' });
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.data).toEqual(mockData2);
    });

    it('should cancel previous request when component unmounts', async () => {
      let rejectFetch: (error: Error) => void;
      (global.fetch as jest.Mock).mockImplementation(() =>
        new Promise((_, reject) => {
          rejectFetch = reject;
        })
      );
      
      const { result, unmount } = renderHook(() => useFetch('/api/test'));
      
      expect(result.current.loading).toBe(true);
      
      unmount();

      // Simulate fetch completing after unmount
      act(() => {
        rejectFetch(new Error('Cancelled'));
      });

      // Should not update state after unmount
      expect(result.current.loading).toBe(true);
    });
  });

  describe('Hook Performance and Memory Management', () => {
    it('should handle rapid state changes efficiently', () => {
      const { result } = renderHook(() => useCounter());
      
      const start = performance.now();
      
      act(() => {
        for (let i = 0; i < 1000; i++) {
          result.current.increment();
        }
      });
      
      const end = performance.now();
      const duration = end - start;

      expect(result.current.count).toBe(1000);
      expect(duration).toBeLessThan(100); // Should be fast
    });

    it('should not cause memory leaks with complex hooks', () => {
      const { result, unmount } = renderHook(() => {
        const localStorage = useLocalStorage('test', []);
        const debounced = useDebounce('test', 500);
        const counter = useCounter();
        const toggle = useToggle();
        
        return { localStorage, debounced, counter, toggle };
      });

      // Use all hooks
      act(() => {
        result.current.localStorage[1](['test']);
        result.current.counter.increment();
        result.current.toggle[1]();
      });

      // Should not throw during cleanup
      expect(() => unmount()).not.toThrow();
    });

    it('should maintain function reference stability', () => {
      const { result, rerender } = renderHook(() => {
        const counter = useCounter();
        const toggle = useToggle();
        const array = useArray([1, 2, 3]);
        
        return { counter, toggle, array };
      });

      const firstRender = result.current;
      rerender();
      const secondRender = result.current;

      // Function references should be stable
      expect(secondRender.counter.increment).toBe(firstRender.counter.increment);
      expect(secondRender.toggle[1]).toBe(firstRender.toggle[1]);
      expect(secondRender.array.push).toBe(firstRender.array.push);
    });
  });
});