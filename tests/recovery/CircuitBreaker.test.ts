/**
 * Circuit Breaker Tests
 * Comprehensive testing of circuit breaker patterns
 */

import { CircuitBreaker, CircuitBreakerFactory, CircuitState } from '../../src/recovery/CircuitBreaker';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let mockOperation: jest.Mock;

  beforeEach(() => {
    mockOperation = jest.fn();
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    }, 'test-breaker');
  });

  afterEach(() => {
    circuitBreaker.reset();
    jest.clearAllTimers();
  });

  describe('CLOSED state behavior', () => {
    it('should execute operations when circuit is closed', async () => {
      mockOperation.mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
    });

    it('should count failures but remain closed under threshold', async () => {
      mockOperation.mockRejectedValue(new Error('test error'));
      
      // Two failures (under threshold of 3)
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('test error');
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('test error');
      
      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
      expect(circuitBreaker.getMetrics().failureCount).toBe(2);
    });

    it('should open circuit when failure threshold is reached', async () => {
      mockOperation.mockRejectedValue(new Error('test error'));
      
      // Three failures (equals threshold)
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow('test error');
      }
      
      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.OPEN);
    });
  });

  describe('OPEN state behavior', () => {
    beforeEach(async () => {
      // Force circuit to OPEN state
      mockOperation.mockRejectedValue(new Error('test error'));
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
      }
      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.OPEN);
    });

    it('should reject operations immediately when circuit is open', async () => {
      mockOperation.mockResolvedValue('success');
      
      await expect(circuitBreaker.execute(mockOperation))
        .rejects.toThrow("Circuit breaker 'test-breaker' is OPEN");
      
      expect(mockOperation).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after reset timeout', async () => {
      jest.useFakeTimers();
      
      // Advance time past reset timeout
      jest.advanceTimersByTime(1001);
      
      mockOperation.mockResolvedValue('success');
      const result = await circuitBreaker.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
      
      jest.useRealTimers();
    });
  });

  describe('HALF_OPEN state behavior', () => {
    beforeEach(async () => {
      jest.useFakeTimers();
      
      // Force to OPEN state
      mockOperation.mockRejectedValue(new Error('test error'));
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
      }
      
      // Advance time to trigger HALF_OPEN
      jest.advanceTimersByTime(1001);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should close circuit on successful operation in HALF_OPEN state', async () => {
      mockOperation.mockResolvedValue('success');
      
      const result = await circuitBreaker.execute(mockOperation);
      
      expect(result).toBe('success');
      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.CLOSED);
    });

    it('should reopen circuit on failed operation in HALF_OPEN state', async () => {
      mockOperation.mockRejectedValue(new Error('still failing'));
      
      await expect(circuitBreaker.execute(mockOperation))
        .rejects.toThrow('still failing');
      
      expect(circuitBreaker.getMetrics().state).toBe(CircuitState.OPEN);
    });
  });

  describe('Expected errors handling', () => {
    it('should not count expected errors towards failure threshold', async () => {
      const breakerWithExpectedErrors = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        expectedErrors: ['Expected error', /timeout/i]
      });

      // Expected string error
      mockOperation.mockRejectedValue(new Error('Expected error occurred'));
      await expect(breakerWithExpectedErrors.execute(mockOperation)).rejects.toThrow();
      
      // Expected regex error
      mockOperation.mockRejectedValue(new Error('Request timeout'));
      await expect(breakerWithExpectedErrors.execute(mockOperation)).rejects.toThrow();
      
      expect(breakerWithExpectedErrors.getMetrics().state).toBe(CircuitState.CLOSED);
      expect(breakerWithExpectedErrors.getMetrics().failureCount).toBe(0);
    });
  });

  describe('State change callbacks', () => {
    it('should call onStateChange when circuit state changes', async () => {
      const onStateChange = jest.fn();
      const breakerWithCallback = new CircuitBreaker({
        failureThreshold: 2,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        onStateChange
      });

      mockOperation.mockRejectedValue(new Error('test error'));
      
      // Trigger state change to OPEN
      for (let i = 0; i < 2; i++) {
        await expect(breakerWithCallback.execute(mockOperation)).rejects.toThrow();
      }
      
      expect(onStateChange).toHaveBeenCalledWith(CircuitState.OPEN);
    });

    it('should call onFailure and onSuccess callbacks', async () => {
      const onFailure = jest.fn();
      const onSuccess = jest.fn();
      const breakerWithCallbacks = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeout: 1000,
        monitoringPeriod: 5000,
        onFailure,
        onSuccess
      });

      // Test failure callback
      mockOperation.mockRejectedValue(new Error('test error'));
      await expect(breakerWithCallbacks.execute(mockOperation)).rejects.toThrow();
      expect(onFailure).toHaveBeenCalledWith(expect.any(Error));

      // Test success callback
      mockOperation.mockResolvedValue('success');
      await breakerWithCallbacks.execute(mockOperation);
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  describe('Metrics', () => {
    it('should provide accurate metrics', async () => {
      mockOperation.mockResolvedValue('success');
      await circuitBreaker.execute(mockOperation);
      
      mockOperation.mockRejectedValue(new Error('test error'));
      await expect(circuitBreaker.execute(mockOperation)).rejects.toThrow();
      
      const metrics = circuitBreaker.getMetrics();
      
      expect(metrics.state).toBe(CircuitState.CLOSED);
      expect(metrics.successCount).toBe(1);
      expect(metrics.failureCount).toBe(1);
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.failureRate).toBe(0.5);
      expect(metrics.lastFailureTime).toBeGreaterThan(0);
    });
  });
});

describe('CircuitBreakerFactory', () => {
  afterEach(() => {
    // Clean up all circuit breakers
    const breakers = CircuitBreakerFactory.getAll();
    breakers.forEach((_, name) => {
      CircuitBreakerFactory.remove(name);
    });
  });

  it('should create and reuse circuit breakers by name', () => {
    const config = {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    };

    const breaker1 = CircuitBreakerFactory.create('test', config);
    const breaker2 = CircuitBreakerFactory.create('test', config);
    
    expect(breaker1).toBe(breaker2);
  });

  it('should manage multiple circuit breakers', () => {
    const config = {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    };

    CircuitBreakerFactory.create('service1', config);
    CircuitBreakerFactory.create('service2', config);
    
    const breakers = CircuitBreakerFactory.getAll();
    expect(breakers.size).toBe(2);
    expect(breakers.has('service1')).toBe(true);
    expect(breakers.has('service2')).toBe(true);
  });

  it('should remove circuit breakers', () => {
    const config = {
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 5000
    };

    CircuitBreakerFactory.create('test', config);
    expect(CircuitBreakerFactory.get('test')).toBeDefined();
    
    const removed = CircuitBreakerFactory.remove('test');
    expect(removed).toBe(true);
    expect(CircuitBreakerFactory.get('test')).toBeUndefined();
  });
});