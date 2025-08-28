/**
 * Comprehensive CircuitBreaker Tests
 * Testing state transitions, failure detection, recovery patterns, and edge cases
 * @priority HIGH - Circuit breakers prevent cascade failures and ensure system resilience
 */

import { 
  CircuitBreaker, 
  CircuitBreakerFactory,
  CircuitState, 
  CircuitBreakerConfig 
} from '../../src/recovery/CircuitBreaker';

describe('CircuitBreaker Tests', () => {
  let circuitBreaker: CircuitBreaker;
  let mockOperation: jest.Mock;
  let stateChangeSpy: jest.Mock;
  let failureSpy: jest.Mock;
  let successSpy: jest.Mock;

  const defaultConfig: CircuitBreakerConfig = {
    failureThreshold: 3,
    resetTimeout: 1000,
    monitoringPeriod: 5000
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOperation = jest.fn();
    stateChangeSpy = jest.fn();
    failureSpy = jest.fn();
    successSpy = jest.fn();

    const config: CircuitBreakerConfig = {
      ...defaultConfig,
      onStateChange: stateChangeSpy,
      onFailure: failureSpy,
      onSuccess: successSpy
    };

    circuitBreaker = new CircuitBreaker(config, 'test-circuit');
  });

  describe('Initialization', () => {
    test('should initialize in CLOSED state', () => {
      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getMetrics().failureCount).toBe(0);
      expect(circuitBreaker.getMetrics().successCount).toBe(0);
      expect(circuitBreaker.getMetrics().totalRequests).toBe(0);
    });

    test('should accept configuration parameters', () => {
      const customConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        resetTimeout: 2000,
        monitoringPeriod: 10000,
        expectedErrors: ['ExpectedError'],
        onStateChange: jest.fn()
      };

      const cb = new CircuitBreaker(customConfig, 'custom-circuit');
      expect(cb.getMetrics().state).toBe(CircuitState.CLOSED);
    });

    test('should use default name when not provided', () => {
      const cb = new CircuitBreaker(defaultConfig);
      expect(cb.getMetrics()).toBeDefined();
    });
  });

  describe('State Transitions', () => {
    describe('CLOSED to OPEN', () => {
      test('should transition to OPEN after failure threshold exceeded', async () => {
        mockOperation.mockRejectedValue(new Error('Service unavailable'));

        // Execute operations until failure threshold is reached
        for (let i = 0; i < defaultConfig.failureThreshold; i++) {
          try {
            await circuitBreaker.execute(mockOperation);
          } catch (error) {
            // Expected to fail
          }
        }

        expect(circuitBreaker.getMetrics().state).toBe(CircuitState.OPEN);
        expect(stateChangeSpy).toHaveBeenCalledWith(CircuitState.OPEN);
        expect(circuitBreaker.getMetrics().failureCount).toBe(defaultConfig.failureThreshold);
      });

      test('should call onFailure callback for each failure', async () => {
        mockOperation.mockRejectedValue(new Error('Test error'));

        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected
        }

        expect(failureSpy).toHaveBeenCalledWith(expect.any(Error));
        expect(failureSpy).toHaveBeenCalledTimes(1);
      });

      test('should not count expected errors towards threshold', async () => {
        const config: CircuitBreakerConfig = {
          ...defaultConfig,
          expectedErrors: ['ValidationError', /timeout/i],
          onStateChange: stateChangeSpy
        };

        const cb = new CircuitBreaker(config);

        // These should not count towards failure threshold
        mockOperation
          .mockRejectedValueOnce(new Error('ValidationError occurred'))
          .mockRejectedValueOnce(new Error('Request timeout'))
          .mockRejectedValueOnce(new Error('Unexpected error'));

        for (let i = 0; i < 3; i++) {
          try {
            await cb.execute(mockOperation);
          } catch (error) {
            // Expected
          }
        }

        // Should still be CLOSED because only 1 unexpected error
        expect(cb.getMetrics().state).toBe(CircuitState.CLOSED);
        expect(cb.getMetrics().failureCount).toBe(1);
      });
    });

    describe('OPEN state behavior', () => {
      beforeEach(async () => {
        // Force circuit to OPEN state
        mockOperation.mockRejectedValue(new Error('Service down'));
        for (let i = 0; i < defaultConfig.failureThreshold; i++) {
          try {
            await circuitBreaker.execute(mockOperation);
          } catch (error) {
            // Expected
          }
        }
      });

      test('should reject requests immediately when OPEN', async () => {
        mockOperation.mockResolvedValue('success');

        await expect(circuitBreaker.execute(mockOperation))
          .rejects.toThrow("Circuit breaker 'test-circuit' is OPEN");

        expect(mockOperation).not.toHaveBeenCalled();
      });

      test('should transition to HALF_OPEN after reset timeout', async () => {
        jest.useFakeTimers();

        // Fast-forward time to trigger reset
        jest.advanceTimersByTime(defaultConfig.resetTimeout + 100);

        // Next execution should transition to HALF_OPEN
        mockOperation.mockResolvedValue('success');
        await circuitBreaker.execute(mockOperation);

        expect(circuitBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
        expect(stateChangeSpy).toHaveBeenCalledWith(CircuitState.HALF_OPEN);
        expect(stateChangeSpy).toHaveBeenCalledWith(CircuitState.CLOSED);

        jest.useRealTimers();
      });

      test('should not reset before timeout expires', async () => {
        jest.useFakeTimers();

        // Advance time but not enough to reset
        jest.advanceTimersByTime(defaultConfig.resetTimeout - 100);

        await expect(circuitBreaker.execute(mockOperation))
          .rejects.toThrow("Circuit breaker 'test-circuit' is OPEN");

        expect(circuitBreaker.getMetrics().state).toBe(CircuitState.OPEN);

        jest.useRealTimers();
      });
    });

    describe('HALF_OPEN state behavior', () => {
      beforeEach(async () => {
        // Force to OPEN state first
        mockOperation.mockRejectedValue(new Error('Service down'));
        for (let i = 0; i < defaultConfig.failureThreshold; i++) {
          try {
            await circuitBreaker.execute(mockOperation);
          } catch (error) {
            // Expected
          }
        }

        // Wait for reset timeout and transition to HALF_OPEN
        jest.useFakeTimers();
        jest.advanceTimersByTime(defaultConfig.resetTimeout + 100);
        jest.useRealTimers();
      });

      test('should transition to CLOSED on successful execution', async () => {
        mockOperation.mockResolvedValue('success');

        const result = await circuitBreaker.execute(mockOperation);

        expect(result).toBe('success');
        expect(circuitBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
        expect(circuitBreaker.getMetrics().failureCount).toBe(0);
        expect(circuitBreaker.getMetrics().successCount).toBe(1);
      });

      test('should transition back to OPEN on failure', async () => {
        // First call should transition to HALF_OPEN
        mockOperation.mockRejectedValue(new Error('Still failing'));

        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected
        }

        expect(circuitBreaker.getMetrics().state).toBe(CircuitState.OPEN);
        expect(stateChangeSpy).toHaveBeenCalledWith(CircuitState.HALF_OPEN);
        expect(stateChangeSpy).toHaveBeenCalledWith(CircuitState.OPEN);
      });

      test('should call success callback on successful execution', async () => {
        mockOperation.mockResolvedValue('success');

        await circuitBreaker.execute(mockOperation);

        expect(successSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Metrics and Monitoring', () => {
    test('should track total requests', async () => {
      mockOperation
        .mockResolvedValueOnce('success1')
        .mockResolvedValueOnce('success2')
        .mockRejectedValueOnce(new Error('failure'));

      await circuitBreaker.execute(mockOperation);
      await circuitBreaker.execute(mockOperation);
      
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalRequests).toBe(3);
      expect(metrics.successCount).toBe(2);
      expect(metrics.failureCount).toBe(1);
    });

    test('should calculate failure rate correctly', async () => {
      mockOperation
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('failure1'))
        .mockRejectedValueOnce(new Error('failure2'));

      await circuitBreaker.execute(mockOperation);
      
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected
      }
      
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.failureRate).toBeCloseTo(2/3, 2);
    });

    test('should track last failure time', async () => {
      const beforeTest = Date.now();
      mockOperation.mockRejectedValue(new Error('Test failure'));

      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected
      }

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.lastFailureTime).toBeGreaterThanOrEqual(beforeTest);
      expect(metrics.lastFailureTime).toBeLessThanOrEqual(Date.now());
    });

    test('should return zero failure rate with no requests', () => {
      const metrics = circuitBreaker.getMetrics();
      expect(metrics.failureRate).toBe(0);
    });
  });

  describe('Manual Controls', () => {
    test('should allow forcing state change', () => {
      circuitBreaker.forceState(CircuitState.OPEN);

      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.OPEN);
      expect(stateChangeSpy).toHaveBeenCalledWith(CircuitState.OPEN);
    });

    test('should allow resetting to initial state', async () => {
      // Make some requests to change state
      mockOperation.mockRejectedValue(new Error('Test error'));
      
      try {
        await circuitBreaker.execute(mockOperation);
      } catch (error) {
        // Expected
      }

      circuitBreaker.reset();

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.state).toBe(CircuitState.CLOSED);
      expect(metrics.failureCount).toBe(0);
      expect(metrics.successCount).toBe(0);
      expect(metrics.lastFailureTime).toBeUndefined();
    });

    test('should clear reset timer on manual reset', () => {
      jest.useFakeTimers();

      // Force OPEN state
      circuitBreaker.forceState(CircuitState.OPEN);
      
      // Reset manually
      circuitBreaker.reset();
      
      // Advance time - should not trigger automatic state change
      jest.advanceTimersByTime(defaultConfig.resetTimeout + 1000);
      
      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.CLOSED);

      jest.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    test('should handle synchronous errors', async () => {
      const syncError = new Error('Synchronous error');
      mockOperation.mockImplementation(() => {
        throw syncError;
      });

      await expect(circuitBreaker.execute(mockOperation))
        .rejects.toThrow('Synchronous error');

      expect(circuitBreaker.getMetrics().failureCount).toBe(1);
    });

    test('should handle promise rejections', async () => {
      mockOperation.mockRejectedValue(new Error('Async error'));

      await expect(circuitBreaker.execute(mockOperation))
        .rejects.toThrow('Async error');

      expect(circuitBreaker.getMetrics().failureCount).toBe(1);
    });

    test('should preserve original error message and stack', async () => {
      const originalError = new Error('Original error message');
      mockOperation.mockRejectedValue(originalError);

      try {
        await circuitBreaker.execute(mockOperation);
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBe(originalError);
        expect((error as Error).message).toBe('Original error message');
      }
    });

    test('should handle nested async operations', async () => {
      const nestedOperation = jest.fn().mockResolvedValue('nested success');
      
      mockOperation.mockImplementation(async () => {
        const result = await nestedOperation();
        return `outer ${result}`;
      });

      const result = await circuitBreaker.execute(mockOperation);

      expect(result).toBe('outer nested success');
      expect(nestedOperation).toHaveBeenCalled();
      expect(successSpy).toHaveBeenCalled();
    });
  });

  describe('Concurrency and Race Conditions', () => {
    test('should handle concurrent executions', async () => {
      mockOperation.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('success'), 10))
      );

      const promises = Array.from({ length: 5 }, () => 
        circuitBreaker.execute(mockOperation)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBe('success');
      });
      expect(circuitBreaker.getMetrics().totalRequests).toBe(5);
      expect(circuitBreaker.getMetrics().successCount).toBe(5);
    });

    test('should handle concurrent failures correctly', async () => {
      mockOperation.mockRejectedValue(new Error('Concurrent failure'));

      const promises = Array.from({ length: 5 }, () => 
        circuitBreaker.execute(mockOperation).catch(e => e)
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBeInstanceOf(Error);
      });

      const metrics = circuitBreaker.getMetrics();
      expect(metrics.totalRequests).toBe(5);
      expect(metrics.failureCount).toBe(5);
    });

    test('should handle state transitions during concurrent execution', async () => {
      let callCount = 0;
      mockOperation.mockImplementation(() => {
        callCount++;
        if (callCount <= defaultConfig.failureThreshold) {
          return Promise.reject(new Error(`Failure ${callCount}`));
        }
        return Promise.resolve(`Success ${callCount}`);
      });

      const promises = Array.from({ length: 6 }, () => 
        circuitBreaker.execute(mockOperation).catch(e => e)
      );

      const results = await Promise.all(promises);

      // First 3 should be errors, rest should be circuit breaker errors
      expect(results.slice(0, 3).every(r => r instanceof Error && r.message.startsWith('Failure'))).toBe(true);
      expect(results.slice(3).every(r => r instanceof Error && r.message.includes('OPEN'))).toBe(true);
    });
  });

  describe('Performance and Timing', () => {
    test('should not add significant overhead to successful operations', async () => {
      mockOperation.mockResolvedValue('fast operation');

      const start = process.hrtime.bigint();
      await circuitBreaker.execute(mockOperation);
      const end = process.hrtime.bigint();

      const duration = Number(end - start) / 1000000; // Convert to ms
      expect(duration).toBeLessThan(10); // Less than 10ms overhead
    });

    test('should fail fast when circuit is OPEN', async () => {
      // Force OPEN state
      mockOperation.mockRejectedValue(new Error('Service down'));
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected
        }
      }

      // Test fast failure
      const slowOperation = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const start = process.hrtime.bigint();
      try {
        await circuitBreaker.execute(slowOperation);
      } catch (error) {
        // Expected
      }
      const end = process.hrtime.bigint();

      const duration = Number(end - start) / 1000000; // Convert to ms
      expect(duration).toBeLessThan(50); // Should fail immediately
      expect(slowOperation).not.toHaveBeenCalled();
    });

    test('should respect reset timeout precisely', async () => {
      jest.useFakeTimers();

      // Force OPEN state
      mockOperation.mockRejectedValue(new Error('Service down'));
      for (let i = 0; i < defaultConfig.failureThreshold; i++) {
        try {
          await circuitBreaker.execute(mockOperation);
        } catch (error) {
          // Expected
        }
      }

      // Advance time just before reset timeout
      jest.advanceTimersByTime(defaultConfig.resetTimeout - 1);

      await expect(circuitBreaker.execute(mockOperation))
        .rejects.toThrow('OPEN');

      // Advance time to exactly reset timeout
      jest.advanceTimersByTime(1);

      mockOperation.mockResolvedValue('recovered');
      const result = await circuitBreaker.execute(mockOperation);

      expect(result).toBe('recovered');
      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.CLOSED);

      jest.useRealTimers();
    });
  });

  describe('Integration with External Systems', () => {
    test('should work with database operations', async () => {
      const mockDbQuery = jest.fn();
      const dbCircuitBreaker = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 500,
        monitoringPeriod: 1000
      }, 'database-circuit');

      // Simulate database connection issues
      mockDbQuery
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValue([{ id: 1, name: 'test' }]);

      // First two calls should fail and open circuit
      try {
        await dbCircuitBreaker.execute(() => mockDbQuery());
      } catch (error) {
        expect(error.message).toBe('Connection timeout');
      }

      try {
        await dbCircuitBreaker.execute(() => mockDbQuery());
      } catch (error) {
        expect(error.message).toBe('Connection refused');
      }

      expect(dbCircuitBreaker.getMetrics().state).toBe(CircuitState.OPEN);

      // Third call should fail fast
      await expect(dbCircuitBreaker.execute(() => mockDbQuery()))
        .rejects.toThrow('OPEN');

      expect(mockDbQuery).toHaveBeenCalledTimes(2);
    });

    test('should work with HTTP requests', async () => {
      const mockHttpClient = jest.fn();
      const httpCircuitBreaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
        monitoringPeriod: 2000,
        expectedErrors: [/timeout/i, /502/i] // Expected network errors
      }, 'http-circuit');

      // Mix of expected and unexpected errors
      mockHttpClient
        .mockRejectedValueOnce(new Error('Request timeout'))  // Expected
        .mockRejectedValueOnce(new Error('502 Bad Gateway'))   // Expected  
        .mockRejectedValueOnce(new Error('500 Internal Error')) // Unexpected
        .mockRejectedValueOnce(new Error('503 Service Unavailable')) // Unexpected
        .mockRejectedValueOnce(new Error('404 Not Found'))     // Unexpected

      // Execute requests
      for (let i = 0; i < 5; i++) {
        try {
          await httpCircuitBreaker.execute(() => mockHttpClient());
        } catch (error) {
          // Expected to fail
        }
      }

      // Should be OPEN because of 3 unexpected errors
      expect(httpCircuitBreaker.getMetrics().state).toBe(CircuitState.OPEN);
      expect(httpCircuitBreaker.getMetrics().failureCount).toBe(3);
    });
  });
});

describe('CircuitBreakerFactory Tests', () => {
  afterEach(() => {
    // Clean up all breakers after each test
    const allBreakers = CircuitBreakerFactory.getAll();
    allBreakers.forEach((_, name) => {
      CircuitBreakerFactory.remove(name);
    });
  });

  test('should create and cache circuit breakers', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 5,
      resetTimeout: 2000,
      monitoringPeriod: 10000
    };

    const breaker1 = CircuitBreakerFactory.create('test-service', config);
    const breaker2 = CircuitBreakerFactory.create('test-service', config);

    expect(breaker1).toBe(breaker2); // Should return cached instance
  });

  test('should create different breakers for different names', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    };

    const breaker1 = CircuitBreakerFactory.create('service-1', config);
    const breaker2 = CircuitBreakerFactory.create('service-2', config);

    expect(breaker1).not.toBe(breaker2);
  });

  test('should retrieve existing breaker by name', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    };

    const created = CircuitBreakerFactory.create('test-retrieval', config);
    const retrieved = CircuitBreakerFactory.get('test-retrieval');

    expect(retrieved).toBe(created);
  });

  test('should return undefined for non-existent breaker', () => {
    const retrieved = CircuitBreakerFactory.get('non-existent');
    expect(retrieved).toBeUndefined();
  });

  test('should get all circuit breakers', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    };

    CircuitBreakerFactory.create('service-1', config);
    CircuitBreakerFactory.create('service-2', config);
    CircuitBreakerFactory.create('service-3', config);

    const allBreakers = CircuitBreakerFactory.getAll();
    expect(allBreakers.size).toBe(3);
    expect(allBreakers.has('service-1')).toBe(true);
    expect(allBreakers.has('service-2')).toBe(true);
    expect(allBreakers.has('service-3')).toBe(true);
  });

  test('should remove circuit breaker and reset it', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    };

    const breaker = CircuitBreakerFactory.create('test-removal', config);
    
    // Make some requests to change state
    breaker.forceState(CircuitState.OPEN);
    expect(breaker.getMetrics().state).toBe(CircuitState.OPEN);

    const removed = CircuitBreakerFactory.remove('test-removal');
    expect(removed).toBe(true);

    // Should be reset after removal
    expect(breaker.getMetrics().state).toBe(CircuitState.CLOSED);
    
    const retrieved = CircuitBreakerFactory.get('test-removal');
    expect(retrieved).toBeUndefined();
  });

  test('should return false when removing non-existent breaker', () => {
    const removed = CircuitBreakerFactory.remove('non-existent');
    expect(removed).toBe(false);
  });

  test('should handle concurrent access to factory', () => {
    const config: CircuitBreakerConfig = {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    };

    const promises = Array.from({ length: 10 }, (_, i) => 
      Promise.resolve(CircuitBreakerFactory.create(`concurrent-${i % 3}`, config))
    );

    return Promise.all(promises).then(breakers => {
      // Should have created only 3 unique breakers
      const uniqueBreakers = new Set(breakers);
      expect(uniqueBreakers.size).toBe(3);
    });
  });
});