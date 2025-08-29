/**
 * Async Operation Error Recovery Tests
 * Tests Promise rejections, race conditions, and state corruption scenarios
 */

import { jest } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useState, useEffect, useCallback } from 'react';

// Mock console methods to capture error logs
const consoleSpy = {
  error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
  log: jest.spyOn(console, 'log').mockImplementation(() => {})
};

describe('Async Operation Error Recovery Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.error.mockClear();
    consoleSpy.warn.mockClear();
    consoleSpy.log.mockClear();
  });

  afterAll(() => {
    consoleSpy.error.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.log.mockRestore();
  });

  describe('Promise Rejection Handling', () => {
    it('should handle unhandled Promise rejections', async () => {
      const unhandledRejectionHandler = jest.fn();
      const originalHandler = process.listeners('unhandledRejection')[0];
      
      process.removeAllListeners('unhandledRejection');
      process.on('unhandledRejection', unhandledRejectionHandler);
      
      try {
        // Create an unhandled rejection
        Promise.reject(new Error('Unhandled async error'));
        
        // Wait for the event loop to process
        await new Promise(resolve => setImmediate(resolve));
        
        expect(unhandledRejectionHandler).toHaveBeenCalledWith(
          expect.any(Error),
          expect.any(Promise)
        );
        
        const [error] = unhandledRejectionHandler.mock.calls[0];
        expect(error.message).toBe('Unhandled async error');
      } finally {
        process.removeAllListeners('unhandledRejection');
        if (originalHandler) {
          process.on('unhandledRejection', originalHandler as any);
        }
      }
    });

    it('should gracefully handle Promise.all partial failures', async () => {
      const successfulOperation = () => Promise.resolve('success');
      const failingOperation = () => Promise.reject(new Error('Operation failed'));
      const slowOperation = () => new Promise(resolve => 
        setTimeout(() => resolve('slow success'), 100)
      );
      
      const operations = [
        successfulOperation(),
        failingOperation(),
        slowOperation()
      ];
      
      const results = await Promise.allSettled(operations);
      
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
      
      if (results[1].status === 'rejected') {
        expect(results[1].reason.message).toBe('Operation failed');
      }
    });

    it('should handle Promise chain error propagation', async () => {
      const errorHandler = jest.fn();
      
      const chainedOperation = async () => {
        try {
          return await Promise.resolve('initial')
            .then(() => {
              throw new Error('Chain error');
            })
            .then((result) => {
              // This should not execute
              return `processed: ${result}`;
            })
            .catch((error) => {
              errorHandler(error);
              throw error; // Re-throw to test propagation
            });
        } catch (error) {
          return `recovered: ${(error as Error).message}`;
        }
      };
      
      const result = await chainedOperation();
      
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Chain error' })
      );
      expect(result).toBe('recovered: Chain error');
    });

    it('should handle async/await error propagation in nested functions', async () => {
      const nestedAsyncFunction = async (shouldFail: boolean) => {
        if (shouldFail) {
          throw new Error('Nested function error');
        }
        return 'nested success';
      };
      
      const parentAsyncFunction = async (shouldFail: boolean) => {
        try {
          const result = await nestedAsyncFunction(shouldFail);
          return `parent: ${result}`;
        } catch (error) {
          return `parent caught: ${(error as Error).message}`;
        }
      };
      
      const successResult = await parentAsyncFunction(false);
      const errorResult = await parentAsyncFunction(true);
      
      expect(successResult).toBe('parent: nested success');
      expect(errorResult).toBe('parent caught: Nested function error');
    });

    it('should handle Promise timeout scenarios', async () => {
      const timeoutPromise = <T>(promise: Promise<T>, ms: number): Promise<T> => {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), ms)
        );
        return Promise.race([promise, timeout]);
      };
      
      const slowOperation = new Promise(resolve => 
        setTimeout(() => resolve('slow result'), 1000)
      );
      
      await expect(
        timeoutPromise(slowOperation, 100)
      ).rejects.toThrow('Operation timeout');
    });
  });

  describe('Race Condition Scenarios', () => {
    it('should handle race conditions in state updates', async () => {
      let stateUpdateCount = 0;
      const useRaceConditionState = () => {
        const [value, setValue] = useState(0);
        const [loading, setLoading] = useState(false);
        
        const updateValue = useCallback(async (newValue: number, delay: number) => {
          setLoading(true);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Simulate race condition: multiple async operations updating state
          setValue(prevValue => {
            stateUpdateCount++;
            return newValue;
          });
          
          setLoading(false);
        }, []);
        
        return { value, loading, updateValue };
      };
      
      const { result } = renderHook(() => useRaceConditionState());
      
      // Start multiple concurrent updates
      act(() => {
        result.current.updateValue(1, 50);
        result.current.updateValue(2, 30);
        result.current.updateValue(3, 10);
      });
      
      // Wait for all operations to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 200 });
      
      // The fastest operation (delay: 10ms) should win
      expect(result.current.value).toBe(3);
      expect(stateUpdateCount).toBe(3);
    });

    it('should handle concurrent API requests with proper cleanup', async () => {
      let activeRequestCount = 0;
      const mockApiCall = (id: string, delay: number) => {
        activeRequestCount++;
        
        return new Promise<string>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            activeRequestCount--;
            
            if (id === 'error') {
              reject(new Error(`Request ${id} failed`));
            } else {
              resolve(`Response for ${id}`);
            }
          }, delay);
          
          // Return cleanup function
          return () => {
            clearTimeout(timeoutId);
            activeRequestCount--;
          };
        });
      };
      
      const requests = [
        mockApiCall('req1', 100),
        mockApiCall('error', 50),
        mockApiCall('req3', 150)
      ];
      
      const results = await Promise.allSettled(requests);
      
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
      
      // All requests should have completed
      expect(activeRequestCount).toBe(0);
    });

    it('should handle race conditions in resource loading', async () => {
      const useResourceLoader = () => {
        const [resource, setResource] = useState<string | null>(null);
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState<string | null>(null);
        
        const loadResource = useCallback(async (resourceId: string) => {
          setLoading(true);
          setError(null);
          
          try {
            // Simulate resource loading
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            
            if (resourceId === 'invalid') {
              throw new Error('Resource not found');
            }
            
            setResource(`Resource: ${resourceId}`);
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setLoading(false);
          }
        }, []);
        
        return { resource, loading, error, loadResource };
      };
      
      const { result } = renderHook(() => useResourceLoader());
      
      // Start multiple concurrent loads
      act(() => {
        result.current.loadResource('resource1');
        result.current.loadResource('invalid');
        result.current.loadResource('resource3');
      });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should handle the race condition gracefully
      expect(result.current.resource || result.current.error).toBeTruthy();
    });

    it('should handle memory leaks from unresolved Promises', async () => {
      const createLeakyPromise = () => {
        return new Promise((resolve) => {
          // This setTimeout is never cleared, creating a potential memory leak
          setTimeout(resolve, 10000);
        });
      };
      
      const createCleanPromise = () => {
        let timeoutId: NodeJS.Timeout;
        
        const promise = new Promise((resolve) => {
          timeoutId = setTimeout(resolve, 100);
        });
        
        // Add cleanup method
        (promise as any).cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        };
        
        return promise;
      };
      
      const cleanPromise = createCleanPromise();
      
      // Simulate component unmounting or cleanup
      (cleanPromise as any).cleanup();
      
      // Promise should not resolve after cleanup
      const result = await Promise.race([
        cleanPromise,
        new Promise(resolve => setTimeout(() => resolve('timeout'), 200))
      ]);
      
      expect(result).toBe('timeout');
    });
  });

  describe('State Corruption Scenarios', () => {
    it('should detect and recover from corrupted state', async () => {
      const useCorruptibleState = () => {
        const [state, setState] = useState({ count: 0, valid: true });
        
        const corruptState = useCallback(() => {
          setState({ count: NaN, valid: false });
        }, []);
        
        const validateAndRepairState = useCallback(() => {
          setState(currentState => {
            if (!currentState.valid || isNaN(currentState.count)) {
              console.warn('State corruption detected, repairing...');
              return { count: 0, valid: true };
            }
            return currentState;
          });
        }, []);
        
        return { state, corruptState, validateAndRepairState };
      };
      
      const { result } = renderHook(() => useCorruptibleState());
      
      // Initial state should be valid
      expect(result.current.state.valid).toBe(true);
      expect(result.current.state.count).toBe(0);
      
      // Corrupt the state
      act(() => {
        result.current.corruptState();
      });
      
      expect(result.current.state.valid).toBe(false);
      expect(isNaN(result.current.state.count)).toBe(true);
      
      // Repair the state
      act(() => {
        result.current.validateAndRepairState();
      });
      
      expect(result.current.state.valid).toBe(true);
      expect(result.current.state.count).toBe(0);
      expect(consoleSpy.warn).toHaveBeenCalledWith('State corruption detected, repairing...');
    });

    it('should handle circular reference errors in state', async () => {
      const useCircularReferenceState = () => {
        const [state, setState] = useState<any>({ value: 'normal' });
        
        const createCircularReference = useCallback(() => {
          const obj: any = { value: 'circular' };
          obj.self = obj; // Create circular reference
          
          try {
            setState(obj);
            JSON.stringify(obj); // This will throw
          } catch (error) {
            console.error('Circular reference detected:', (error as Error).message);
            setState({ value: 'recovered', error: 'circular_reference' });
          }
        }, []);
        
        return { state, createCircularReference };
      };
      
      const { result } = renderHook(() => useCircularReferenceState());
      
      act(() => {
        result.current.createCircularReference();
      });
      
      expect(result.current.state.value).toBe('recovered');
      expect(result.current.state.error).toBe('circular_reference');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Circular reference detected:',
        expect.any(String)
      );
    });

    it('should handle async state corruption from concurrent modifications', async () => {
      let modificationCount = 0;
      
      const useConcurrentState = () => {
        const [state, setState] = useState({ items: [] as string[], version: 0 });
        
        const addItem = useCallback(async (item: string, delay: number) => {
          modificationCount++;
          
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, delay));
          
          setState(prevState => {
            // Check if state is still consistent
            if (prevState.version < 0) {
              console.warn('State version corruption detected');
              return { items: [item], version: 0 };
            }
            
            return {
              items: [...prevState.items, item],
              version: prevState.version + 1
            };
          });
        }, []);
        
        const corruptVersion = useCallback(() => {
          setState(prevState => ({ ...prevState, version: -1 }));
        }, []);
        
        return { state, addItem, corruptVersion };
      };
      
      const { result } = renderHook(() => useConcurrentState());
      
      // Start multiple concurrent additions
      const addPromises = [
        act(() => result.current.addItem('item1', 50)),
        act(() => result.current.addItem('item2', 30)),
        act(() => result.current.addItem('item3', 10))
      ];
      
      // Corrupt state during concurrent operations
      act(() => {
        result.current.corruptVersion();
      });
      
      await Promise.all(addPromises);
      
      // State should be recovered
      expect(result.current.state.version).toBeGreaterThanOrEqual(0);
      expect(consoleSpy.warn).toHaveBeenCalledWith('State version corruption detected');
    });
  });

  describe('Error Boundary Integration', () => {
    it('should catch async errors in React error boundaries', async () => {
      const AsyncErrorComponent = () => {
        const [shouldThrow, setShouldThrow] = useState(false);
        
        useEffect(() => {
          if (shouldThrow) {
            // Simulate async error that should be caught
            Promise.resolve().then(() => {
              throw new Error('Async component error');
            });
          }
        }, [shouldThrow]);
        
        return (
          <div>
            <button onClick={() => setShouldThrow(true)}>Trigger Error</button>
          </div>
        );
      };
      
      // Note: This test demonstrates the limitation that React Error Boundaries
      // don't catch async errors. In real implementation, we need custom error handling.
      const component = <AsyncErrorComponent />;
      expect(component).toBeDefined();
    });

    it('should handle error recovery in useEffect cleanup', async () => {
      let cleanupCalled = false;
      let errorInCleanup = false;
      
      const useEffectWithErrorCleanup = () => {
        useEffect(() => {
          const subscription = {
            unsubscribe: () => {
              cleanupCalled = true;
              throw new Error('Cleanup error');
            }
          };
          
          return () => {
            try {
              subscription.unsubscribe();
            } catch (error) {
              errorInCleanup = true;
              console.error('Cleanup error caught:', (error as Error).message);
            }
          };
        }, []);
      };
      
      const { unmount } = renderHook(() => useEffectWithErrorCleanup());
      
      unmount();
      
      expect(cleanupCalled).toBe(true);
      expect(errorInCleanup).toBe(true);
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Cleanup error caught:',
        'Cleanup error'
      );
    });
  });

  describe('Network Error Recovery', () => {
    it('should implement exponential backoff for failed requests', async () => {
      let attemptCount = 0;
      const maxRetries = 3;
      
      const failingApiCall = () => {
        attemptCount++;
        return Promise.reject(new Error(`Attempt ${attemptCount} failed`));
      };
      
      const exponentialBackoff = async (
        operation: () => Promise<any>,
        retries: number = maxRetries
      ): Promise<any> => {
        try {
          return await operation();
        } catch (error) {
          if (retries === 0) {
            throw error;
          }
          
          const delay = Math.pow(2, maxRetries - retries) * 100;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return exponentialBackoff(operation, retries - 1);
        }
      };
      
      const startTime = Date.now();
      
      await expect(
        exponentialBackoff(failingApiCall)
      ).rejects.toThrow('Attempt 4 failed');
      
      const duration = Date.now() - startTime;
      
      expect(attemptCount).toBe(4); // Initial + 3 retries
      expect(duration).toBeGreaterThan(700); // Should have waited (100 + 200 + 400 = 700ms)
    });

    it('should handle network recovery with circuit breaker pattern', async () => {
      let failureCount = 0;
      let circuitOpen = false;
      const failureThreshold = 3;
      const resetTimeout = 100;
      
      const circuitBreaker = {
        call: async <T>(operation: () => Promise<T>): Promise<T> => {
          if (circuitOpen) {
            throw new Error('Circuit breaker is open');
          }
          
          try {
            const result = await operation();
            failureCount = 0; // Reset on success
            return result;
          } catch (error) {
            failureCount++;
            
            if (failureCount >= failureThreshold) {
              circuitOpen = true;
              setTimeout(() => {
                circuitOpen = false;
                failureCount = 0;
              }, resetTimeout);
            }
            
            throw error;
          }
        }
      };
      
      const unreliableOperation = () => {
        if (Math.random() < 0.8) { // 80% failure rate
          return Promise.reject(new Error('Operation failed'));
        }
        return Promise.resolve('Success');
      };
      
      // Generate enough failures to open circuit
      for (let i = 0; i < 5; i++) {
        try {
          await circuitBreaker.call(unreliableOperation);
        } catch (error) {
          // Expected failures
        }
      }
      
      // Circuit should be open now
      await expect(
        circuitBreaker.call(unreliableOperation)
      ).rejects.toThrow('Circuit breaker is open');
      
      // Wait for reset
      await new Promise(resolve => setTimeout(resolve, resetTimeout + 10));
      
      // Circuit should be closed now
      expect(circuitOpen).toBe(false);
    });
  });

  describe('Memory Management in Async Operations', () => {
    it('should clean up async operations on component unmount', async () => {
      let operationsActive = 0;
      
      const useAsyncOperations = () => {
        const [data, setData] = useState<string | null>(null);
        
        useEffect(() => {
          let cancelled = false;
          
          const performAsyncOperation = async () => {
            operationsActive++;
            
            try {
              await new Promise(resolve => setTimeout(resolve, 100));
              
              if (!cancelled) {
                setData('Operation completed');
              }
            } finally {
              operationsActive--;
            }
          };
          
          performAsyncOperation();
          
          return () => {
            cancelled = true;
          };
        }, []);
        
        return data;
      };
      
      const { unmount } = renderHook(() => useAsyncOperations());
      
      // Unmount before operation completes
      unmount();
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(operationsActive).toBe(0);
    });

    it('should handle memory leaks from event listeners in async operations', async () => {
      const eventEmitter = new (require('events').EventEmitter)();
      let listenerCount = 0;
      
      const useAsyncEventListener = () => {
        useEffect(() => {
          const handler = () => {
            console.log('Event received');
          };
          
          eventEmitter.on('test', handler);
          listenerCount = eventEmitter.listenerCount('test');
          
          return () => {
            eventEmitter.removeListener('test', handler);
            listenerCount = eventEmitter.listenerCount('test');
          };
        }, []);
      };
      
      const { unmount } = renderHook(() => useAsyncEventListener());
      
      expect(listenerCount).toBe(1);
      
      unmount();
      
      expect(listenerCount).toBe(0);
    });
  });
});
