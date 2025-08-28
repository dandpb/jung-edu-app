import { jest } from '@jest/globals';
import { ErrorRecoveryEngine } from '../../src/engines/ErrorRecoveryEngine';
import { WorkflowRepository } from '../../src/repositories/WorkflowRepository';
import { ErrorHandler } from '../../src/handlers/ErrorHandler';
import { RecoveryStrategyManager } from '../../src/managers/RecoveryStrategyManager';
import { FaultInjector } from '../../src/testing/FaultInjector';
import { CircuitBreaker } from '../../src/resilience/CircuitBreaker';
import { RetryManager } from '../../src/managers/RetryManager';
import { ExecutionContext } from '../../src/contexts/ExecutionContext';
import { EventEmitter } from '../../src/events/EventEmitter';
import {
  Workflow,
  ErrorContext,
  RecoveryStrategy,
  RecoveryResult,
  FaultType,
  CircuitBreakerState,
  RetryConfiguration
} from '../../src/types/Workflow';

// London School TDD - Focus on error handling behavior and recovery strategies
describe('Workflow Error Handling and Recovery', () => {
  let errorRecoveryEngine: ErrorRecoveryEngine;
  let mockWorkflowRepository: jest.Mocked<WorkflowRepository>;
  let mockErrorHandler: jest.Mocked<ErrorHandler>;
  let mockRecoveryStrategyManager: jest.Mocked<RecoveryStrategyManager>;
  let mockFaultInjector: jest.Mocked<FaultInjector>;
  let mockCircuitBreaker: jest.Mocked<CircuitBreaker>;
  let mockRetryManager: jest.Mocked<RetryManager>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockEventEmitter: jest.Mocked<EventEmitter>;

  const resilientWorkflow: Workflow = {
    id: 'resilient-workflow-123',
    name: 'Resilient Processing Workflow',
    description: 'Workflow with comprehensive error handling',
    status: 'active',
    steps: [
      {
        id: 'fragile-step',
        name: 'Potentially Failing Step',
        type: 'action',
        config: {
          action: 'processData',
          timeout: 30000,
          retryPolicy: {
            maxRetries: 3,
            backoffStrategy: 'exponential',
            initialDelay: 1000
          }
        },
        order: 1
      },
      {
        id: 'recovery-step',
        name: 'Recovery Step',
        type: 'recovery',
        config: {
          recoveryStrategies: ['retry', 'fallback', 'skip'],
          fallbackAction: 'processDataFallback'
        },
        order: 2,
        dependsOn: ['fragile-step']
      },
      {
        id: 'final-step',
        name: 'Final Step',
        type: 'action',
        config: { action: 'finalize' },
        order: 3,
        dependsOn: ['recovery-step']
      }
    ],
    errorHandling: {
      globalStrategies: ['circuit-breaker', 'retry', 'fallback'],
      circuitBreakerConfig: {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        halfOpenMaxCalls: 3
      }
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: 1
  };

  beforeEach(() => {
    mockWorkflowRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      findAll: jest.fn(),
      findByName: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      findByStatus: jest.fn(),
      getWorkflowHistory: jest.fn()
    } as jest.Mocked<WorkflowRepository>;

    mockErrorHandler = {
      handleError: jest.fn(),
      categorizeError: jest.fn(),
      createErrorContext: jest.fn(),
      logError: jest.fn(),
      notifyError: jest.fn(),
      shouldRetry: jest.fn(),
      getErrorMetrics: jest.fn()
    } as jest.Mocked<ErrorHandler>;

    mockRecoveryStrategyManager = {
      selectRecoveryStrategy: jest.fn(),
      executeRecoveryStrategy: jest.fn(),
      evaluateRecoveryOptions: jest.fn(),
      applyRecoveryAction: jest.fn(),
      validateRecoveryResult: jest.fn(),
      getRecoveryHistory: jest.fn()
    } as jest.Mocked<RecoveryStrategyManager>;

    mockFaultInjector = {
      injectFault: jest.fn(),
      configureFaultScenario: jest.fn(),
      getFaultTypes: jest.fn(),
      enableChaosMode: jest.fn(),
      clearFaults: jest.fn(),
      getFaultHistory: jest.fn()
    } as jest.Mocked<FaultInjector>;

    mockCircuitBreaker = {
      getState: jest.fn(),
      call: jest.fn(),
      recordSuccess: jest.fn(),
      recordFailure: jest.fn(),
      reset: jest.fn(),
      getMetrics: jest.fn(),
      configure: jest.fn()
    } as jest.Mocked<CircuitBreaker>;

    mockRetryManager = {
      executeWithRetry: jest.fn(),
      shouldRetry: jest.fn(),
      calculateDelay: jest.fn(),
      getRetryHistory: jest.fn(),
      configureRetryPolicy: jest.fn(),
      resetRetryState: jest.fn()
    } as jest.Mocked<RetryManager>;

    mockExecutionContext = {
      getWorkflowId: jest.fn(),
      getCurrentStep: jest.fn(),
      getVariable: jest.fn(),
      setVariable: jest.fn(),
      getExecutionState: jest.fn(),
      updateState: jest.fn(),
      addError: jest.fn(),
      getErrors: jest.fn(),
      clone: jest.fn(),
      reset: jest.fn()
    } as jest.Mocked<ExecutionContext>;

    mockEventEmitter = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn()
    } as jest.Mocked<EventEmitter>;

    errorRecoveryEngine = new ErrorRecoveryEngine(
      mockWorkflowRepository,
      mockErrorHandler,
      mockRecoveryStrategyManager,
      mockFaultInjector,
      mockCircuitBreaker,
      mockRetryManager,
      mockExecutionContext,
      mockEventEmitter
    );
  });

  describe('Error Detection and Classification', () => {
    it('should detect and categorize different types of errors', async () => {
      // Arrange
      mockWorkflowRepository.findById.mockResolvedValue(resilientWorkflow);
      
      const networkError = new Error('Connection timeout');
      const validationError = new Error('Invalid input data');
      const systemError = new Error('Out of memory');

      mockErrorHandler.categorizeError
        .mockReturnValueOnce({ type: 'network', severity: 'medium', recoverable: true })
        .mockReturnValueOnce({ type: 'validation', severity: 'low', recoverable: false })
        .mockReturnValueOnce({ type: 'system', severity: 'high', recoverable: true });

      mockErrorHandler.createErrorContext.mockImplementation((error, step, workflow) => ({
        error,
        stepId: step.id,
        workflowId: workflow.id,
        timestamp: new Date(),
        category: mockErrorHandler.categorizeError(error),
        retryCount: 0
      } as ErrorContext));

      // Act
      const networkErrorContext = await errorRecoveryEngine.handleStepError(
        networkError,
        resilientWorkflow.steps[0],
        resilientWorkflow,
        mockExecutionContext
      );

      const validationErrorContext = await errorRecoveryEngine.handleStepError(
        validationError,
        resilientWorkflow.steps[0],
        resilientWorkflow,
        mockExecutionContext
      );

      const systemErrorContext = await errorRecoveryEngine.handleStepError(
        systemError,
        resilientWorkflow.steps[0],
        resilientWorkflow,
        mockExecutionContext
      );

      // Assert - Verify error categorization interactions
      expect(mockErrorHandler.categorizeError).toHaveBeenCalledTimes(3);
      expect(mockErrorHandler.categorizeError).toHaveBeenCalledWith(networkError);
      expect(mockErrorHandler.categorizeError).toHaveBeenCalledWith(validationError);
      expect(mockErrorHandler.categorizeError).toHaveBeenCalledWith(systemError);

      expect(mockErrorHandler.createErrorContext).toHaveBeenCalledTimes(3);
      
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'error.detected',
        expect.objectContaining({
          errorType: 'network',
          severity: 'medium',
          stepId: 'fragile-step'
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'error.detected',
        expect.objectContaining({
          errorType: 'validation',
          severity: 'low',
          recoverable: false
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'error.detected',
        expect.objectContaining({
          errorType: 'system',
          severity: 'high',
          recoverable: true
        })
      );
    });

    it('should inject faults for testing error scenarios', async () => {
      // Arrange
      const faultScenarios = [
        { type: 'network_timeout', probability: 0.3, delay: 5000 },
        { type: 'service_unavailable', probability: 0.1, statusCode: 503 },
        { type: 'memory_leak', probability: 0.05, severity: 'high' }
      ];

      mockFaultInjector.configureFaultScenario.mockResolvedValue({
        configured: true,
        scenarioId: 'chaos-test-123',
        activeFaults: 3
      });

      mockFaultInjector.injectFault
        .mockResolvedValueOnce({
          injected: true,
          faultType: 'network_timeout',
          effect: 'Connection timeout after 5000ms'
        })
        .mockResolvedValueOnce({
          injected: false,
          faultType: 'service_unavailable',
          reason: 'Probability threshold not met'
        })
        .mockResolvedValueOnce({
          injected: true,
          faultType: 'memory_leak',
          effect: 'Memory consumption increased by 50%'
        });

      // Act
      const configResult = await errorRecoveryEngine.configureFaultInjection(
        'resilient-workflow-123',
        faultScenarios
      );

      const faultResults = await Promise.all([
        errorRecoveryEngine.injectFault('network_timeout', 'fragile-step'),
        errorRecoveryEngine.injectFault('service_unavailable', 'fragile-step'),
        errorRecoveryEngine.injectFault('memory_leak', 'fragile-step')
      ]);

      // Assert - Verify fault injection interactions
      expect(mockFaultInjector.configureFaultScenario).toHaveBeenCalledWith(
        'resilient-workflow-123',
        faultScenarios
      );

      expect(mockFaultInjector.injectFault).toHaveBeenCalledTimes(3);
      expect(mockFaultInjector.injectFault).toHaveBeenCalledWith(
        'network_timeout',
        expect.objectContaining({ stepId: 'fragile-step' })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'fault.injected',
        expect.objectContaining({
          faultType: 'network_timeout',
          stepId: 'fragile-step',
          effect: 'Connection timeout after 5000ms'
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'fault.injected',
        expect.objectContaining({
          faultType: 'memory_leak',
          effect: 'Memory consumption increased by 50%'
        })
      );

      expect(configResult.success).toBe(true);
      expect(faultResults.filter(r => r.injected)).toHaveLength(2);
    });
  });

  describe('Recovery Strategy Selection and Execution', () => {
    it('should select and execute appropriate recovery strategies', async () => {
      // Arrange
      const errorContext: ErrorContext = {
        error: new Error('Service temporarily unavailable'),
        stepId: 'fragile-step',
        workflowId: 'resilient-workflow-123',
        timestamp: new Date(),
        category: { type: 'network', severity: 'medium', recoverable: true },
        retryCount: 0
      };

      mockRecoveryStrategyManager.evaluateRecoveryOptions.mockResolvedValue([
        { strategy: 'retry', confidence: 0.8, estimatedTime: 5000 },
        { strategy: 'fallback', confidence: 0.6, estimatedTime: 2000 },
        { strategy: 'circuit-breaker', confidence: 0.9, estimatedTime: 1000 }
      ]);

      mockRecoveryStrategyManager.selectRecoveryStrategy.mockResolvedValue({
        strategy: 'circuit-breaker',
        reason: 'Highest confidence and fastest recovery time',
        fallbackStrategies: ['retry', 'fallback']
      });

      mockRecoveryStrategyManager.executeRecoveryStrategy.mockResolvedValue({
        success: true,
        strategy: 'circuit-breaker',
        executionTime: 950,
        result: { recovered: true, circuitState: 'half-open' },
        nextSteps: ['monitor-recovery', 'continue-execution']
      } as RecoveryResult);

      // Act
      const result = await errorRecoveryEngine.recoverFromError(
        errorContext,
        resilientWorkflow,
        mockExecutionContext
      );

      // Assert - Verify recovery strategy interactions
      expect(mockRecoveryStrategyManager.evaluateRecoveryOptions).toHaveBeenCalledWith(
        errorContext,
        resilientWorkflow.errorHandling,
        mockExecutionContext
      );

      expect(mockRecoveryStrategyManager.selectRecoveryStrategy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ strategy: 'retry', confidence: 0.8 }),
          expect.objectContaining({ strategy: 'fallback', confidence: 0.6 }),
          expect.objectContaining({ strategy: 'circuit-breaker', confidence: 0.9 })
        ]),
        errorContext
      );

      expect(mockRecoveryStrategyManager.executeRecoveryStrategy).toHaveBeenCalledWith(
        'circuit-breaker',
        errorContext,
        resilientWorkflow,
        mockExecutionContext
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'recovery.strategy.selected',
        expect.objectContaining({
          strategy: 'circuit-breaker',
          confidence: 0.9,
          reason: 'Highest confidence and fastest recovery time'
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'recovery.completed',
        expect.objectContaining({
          success: true,
          strategy: 'circuit-breaker',
          executionTime: 950
        })
      );

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('circuit-breaker');
    });

    it('should cascade through fallback strategies when primary recovery fails', async () => {
      // Arrange
      const errorContext: ErrorContext = {
        error: new Error('Critical system failure'),
        stepId: 'fragile-step',
        workflowId: 'resilient-workflow-123',
        timestamp: new Date(),
        category: { type: 'system', severity: 'high', recoverable: true },
        retryCount: 2
      };

      mockRecoveryStrategyManager.selectRecoveryStrategy.mockResolvedValue({
        strategy: 'retry',
        fallbackStrategies: ['fallback', 'skip']
      });

      // Primary strategy fails, fallback succeeds
      mockRecoveryStrategyManager.executeRecoveryStrategy
        .mockRejectedValueOnce(new Error('Retry limit exceeded'))
        .mockResolvedValueOnce({
          success: true,
          strategy: 'fallback',
          executionTime: 1500,
          result: { recovered: true, usedFallback: true },
          warnings: ['Fallback data may be stale']
        } as RecoveryResult);

      mockRecoveryStrategyManager.applyRecoveryAction.mockResolvedValue({
        applied: true,
        action: 'use-cached-data',
        result: { data: 'cached-fallback-data' }
      });

      // Act
      const result = await errorRecoveryEngine.recoverFromError(
        errorContext,
        resilientWorkflow,
        mockExecutionContext
      );

      // Assert - Verify fallback cascade
      expect(mockRecoveryStrategyManager.executeRecoveryStrategy).toHaveBeenCalledTimes(2);
      expect(mockRecoveryStrategyManager.executeRecoveryStrategy).toHaveBeenNthCalledWith(
        1,
        'retry',
        errorContext,
        resilientWorkflow,
        mockExecutionContext
      );
      expect(mockRecoveryStrategyManager.executeRecoveryStrategy).toHaveBeenNthCalledWith(
        2,
        'fallback',
        errorContext,
        resilientWorkflow,
        mockExecutionContext
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'recovery.primary.failed',
        expect.objectContaining({
          primaryStrategy: 'retry',
          error: expect.objectContaining({ message: 'Retry limit exceeded' })
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'recovery.fallback.executed',
        expect.objectContaining({
          fallbackStrategy: 'fallback',
          success: true,
          warnings: expect.arrayContaining(['Fallback data may be stale'])
        })
      );

      expect(result.success).toBe(true);
      expect(result.strategy).toBe('fallback');
      expect(result.warnings).toContain('Fallback data may be stale');
    });
  });

  describe('Circuit Breaker Pattern', () => {
    it('should implement circuit breaker pattern for fault tolerance', async () => {
      // Arrange
      mockCircuitBreaker.getState.mockReturnValue('closed' as CircuitBreakerState);
      mockCircuitBreaker.getMetrics.mockReturnValue({
        failureCount: 3,
        successCount: 10,
        totalCalls: 13,
        failureRate: 0.23
      });

      // First few calls succeed
      mockCircuitBreaker.call
        .mockResolvedValueOnce({ success: true, result: 'data-1' })
        .mockResolvedValueOnce({ success: true, result: 'data-2' })
        .mockResolvedValueOnce({ success: true, result: 'data-3' })
        // Then failures start occurring
        .mockRejectedValueOnce(new Error('Service failure 1'))
        .mockRejectedValueOnce(new Error('Service failure 2'))
        .mockRejectedValueOnce(new Error('Service failure 3'))
        .mockRejectedValueOnce(new Error('Service failure 4'))
        .mockRejectedValueOnce(new Error('Service failure 5'));

      mockCircuitBreaker.recordFailure.mockImplementation(() => {
        const metrics = mockCircuitBreaker.getMetrics();
        if (metrics.failureCount >= 5) {
          mockCircuitBreaker.getState.mockReturnValue('open' as CircuitBreakerState);
        }
      });

      const serviceCall = jest.fn()
        .mockResolvedValueOnce('data-1')
        .mockResolvedValueOnce('data-2')  
        .mockResolvedValueOnce('data-3')
        .mockRejectedValue(new Error('Service failure'));

      // Act - Simulate multiple service calls
      const results = [];
      for (let i = 0; i < 8; i++) {
        try {
          const result = await errorRecoveryEngine.executeWithCircuitBreaker(
            serviceCall,
            'service-endpoint',
            mockExecutionContext
          );
          results.push({ success: true, result });
        } catch (error) {
          results.push({ success: false, error: (error as Error).message });
        }
      }

      // Assert - Verify circuit breaker behavior
      expect(mockCircuitBreaker.call).toHaveBeenCalledTimes(8);
      expect(mockCircuitBreaker.recordFailure).toHaveBeenCalledTimes(5);
      
      // Verify state transitions
      expect(mockCircuitBreaker.getState).toHaveBeenCalled();
      
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'circuit.breaker.opened',
        expect.objectContaining({
          endpoint: 'service-endpoint',
          failureThreshold: 5,
          totalFailures: expect.any(Number)
        })
      );

      // Verify successful calls followed by failures
      expect(results.slice(0, 3).every(r => r.success)).toBe(true);
      expect(results.slice(3).every(r => !r.success)).toBe(true);
    });

    it('should handle half-open state and recovery testing', async () => {
      // Arrange - Circuit breaker in half-open state
      mockCircuitBreaker.getState.mockReturnValue('half-open' as CircuitBreakerState);
      mockCircuitBreaker.getMetrics.mockReturnValue({
        failureCount: 0,
        successCount: 0,
        totalCalls: 0,
        failureRate: 0,
        halfOpenCalls: 0
      });

      // Test calls in half-open state - first few succeed, then circuit closes
      mockCircuitBreaker.call
        .mockResolvedValueOnce({ success: true, result: 'recovery-test-1' })
        .mockResolvedValueOnce({ success: true, result: 'recovery-test-2' })
        .mockResolvedValueOnce({ success: true, result: 'recovery-test-3' });

      mockCircuitBreaker.recordSuccess.mockImplementation(() => {
        const metrics = mockCircuitBreaker.getMetrics();
        if (metrics.halfOpenCalls >= 3) {
          mockCircuitBreaker.getState.mockReturnValue('closed' as CircuitBreakerState);
        }
      });

      const recoveryTestCall = jest.fn().mockResolvedValue('service-recovered');

      // Act
      const recoveryResults = [];
      for (let i = 0; i < 3; i++) {
        const result = await errorRecoveryEngine.executeWithCircuitBreaker(
          recoveryTestCall,
          'recovering-service',
          mockExecutionContext
        );
        recoveryResults.push(result);
      }

      // Assert - Verify half-open state behavior
      expect(mockCircuitBreaker.call).toHaveBeenCalledTimes(3);
      expect(mockCircuitBreaker.recordSuccess).toHaveBeenCalledTimes(3);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'circuit.breaker.half.open.test',
        expect.objectContaining({
          endpoint: 'recovering-service',
          testCall: 1
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'circuit.breaker.closed',
        expect.objectContaining({
          endpoint: 'recovering-service',
          recoveredAfter: expect.any(Number)
        })
      );

      expect(recoveryResults).toHaveLength(3);
      expect(recoveryResults.every(r => r.success)).toBe(true);
    });
  });

  describe('Retry Mechanism', () => {
    it('should implement configurable retry policies with backoff strategies', async () => {
      // Arrange
      const retryConfig: RetryConfiguration = {
        maxRetries: 4,
        initialDelay: 1000,
        backoffStrategy: 'exponential',
        maxDelay: 30000,
        jitter: true,
        retryCondition: (error) => error.message.includes('temporary')
      };

      mockRetryManager.configureRetryPolicy.mockResolvedValue({
        configured: true,
        policy: retryConfig
      });

      mockRetryManager.shouldRetry
        .mockReturnValueOnce(true)  // First retry
        .mockReturnValueOnce(true)  // Second retry  
        .mockReturnValueOnce(true)  // Third retry
        .mockReturnValueOnce(false); // Max retries reached

      mockRetryManager.calculateDelay
        .mockReturnValueOnce(1000)  // 1s
        .mockReturnValueOnce(2000)  // 2s (exponential)
        .mockReturnValueOnce(4000); // 4s (exponential)

      const flakyOperation = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary network error'))
        .mockRejectedValueOnce(new Error('Temporary server overload'))
        .mockRejectedValueOnce(new Error('Temporary database lock'))
        .mockResolvedValueOnce('Success after retries');

      mockRetryManager.executeWithRetry.mockImplementation(async (operation, config) => {
        let attempt = 0;
        let lastError: Error;

        while (attempt <= config.maxRetries) {
          try {
            const result = await operation();
            return { success: true, result, attempts: attempt + 1 };
          } catch (error) {
            attempt++;
            lastError = error as Error;
            
            if (attempt <= config.maxRetries && mockRetryManager.shouldRetry(lastError, attempt)) {
              const delay = mockRetryManager.calculateDelay(attempt, config);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              break;
            }
          }
        }
        
        return { success: false, error: lastError!, attempts: attempt };
      });

      // Act
      const result = await errorRecoveryEngine.executeWithRetry(
        flakyOperation,
        retryConfig,
        mockExecutionContext
      );

      // Assert - Verify retry mechanism interactions
      expect(mockRetryManager.configureRetryPolicy).toHaveBeenCalledWith(retryConfig);
      expect(mockRetryManager.executeWithRetry).toHaveBeenCalledWith(
        flakyOperation,
        retryConfig,
        mockExecutionContext
      );

      expect(mockRetryManager.shouldRetry).toHaveBeenCalledTimes(3);
      expect(mockRetryManager.calculateDelay).toHaveBeenCalledTimes(3);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'retry.attempt',
        expect.objectContaining({
          attempt: 1,
          delay: 1000,
          error: expect.objectContaining({ message: 'Temporary network error' })
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'retry.success',
        expect.objectContaining({
          totalAttempts: 4,
          totalTime: expect.any(Number)
        })
      );

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(4);
    });

    it('should respect retry limits and fail gracefully', async () => {
      // Arrange
      const retryConfig: RetryConfiguration = {
        maxRetries: 2,
        initialDelay: 500,
        backoffStrategy: 'fixed'
      };

      const persistentFailure = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      mockRetryManager.shouldRetry.mockReturnValue(true);
      mockRetryManager.calculateDelay.mockReturnValue(500);

      mockRetryManager.executeWithRetry.mockImplementation(async (operation, config) => {
        let attempt = 0;
        let lastError: Error;

        while (attempt <= config.maxRetries) {
          try {
            return await operation();
          } catch (error) {
            attempt++;
            lastError = error as Error;
            
            if (attempt <= config.maxRetries) {
              const delay = mockRetryManager.calculateDelay(attempt, config);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          }
        }
        
        return { success: false, error: lastError!, attempts: attempt, maxRetriesExceeded: true };
      });

      // Act
      const result = await errorRecoveryEngine.executeWithRetry(
        persistentFailure,
        retryConfig,
        mockExecutionContext
      );

      // Assert - Verify retry limit enforcement
      expect(persistentFailure).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(mockRetryManager.calculateDelay).toHaveBeenCalledTimes(2);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'retry.max.attempts.exceeded',
        expect.objectContaining({
          maxRetries: 2,
          totalAttempts: 3,
          finalError: expect.objectContaining({ message: 'Persistent failure' })
        })
      );

      expect(result.success).toBe(false);
      expect(result.maxRetriesExceeded).toBe(true);
    });
  });

  describe('Error Aggregation and Metrics', () => {
    it('should aggregate error metrics and generate insights', async () => {
      // Arrange
      const errorHistory = [
        { type: 'network', count: 15, severity: 'medium' },
        { type: 'validation', count: 8, severity: 'low' },
        { type: 'system', count: 3, severity: 'high' }
      ];

      mockErrorHandler.getErrorMetrics.mockResolvedValue({
        totalErrors: 26,
        errorsByType: new Map([
          ['network', 15],
          ['validation', 8],
          ['system', 3]
        ]),
        errorsByStep: new Map([
          ['fragile-step', 20],
          ['recovery-step', 4],
          ['final-step', 2]
        ]),
        averageRecoveryTime: 2500,
        successfulRecoveries: 22,
        failedRecoveries: 4,
        recoveryRate: 0.85
      });

      mockRecoveryStrategyManager.getRecoveryHistory.mockResolvedValue([
        { strategy: 'retry', successCount: 12, failureCount: 2, avgTime: 1500 },
        { strategy: 'fallback', successCount: 8, failureCount: 1, avgTime: 800 },
        { strategy: 'circuit-breaker', successCount: 2, failureCount: 1, avgTime: 500 }
      ]);

      // Act
      const metrics = await errorRecoveryEngine.getErrorMetrics('resilient-workflow-123');
      const insights = await errorRecoveryEngine.generateRecoveryInsights('resilient-workflow-123');

      // Assert - Verify metrics collection interactions
      expect(mockErrorHandler.getErrorMetrics).toHaveBeenCalledWith('resilient-workflow-123');
      expect(mockRecoveryStrategyManager.getRecoveryHistory).toHaveBeenCalledWith('resilient-workflow-123');

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'metrics.collected',
        expect.objectContaining({
          workflowId: 'resilient-workflow-123',
          totalErrors: 26,
          recoveryRate: 0.85
        })
      );

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'insights.generated',
        expect.objectContaining({
          recommendations: expect.any(Array),
          topErrorTypes: expect.arrayContaining(['network', 'validation', 'system'])
        })
      );

      expect(metrics.totalErrors).toBe(26);
      expect(metrics.recoveryRate).toBe(0.85);
      expect(insights.recommendations).toBeDefined();
    });
  });

  describe('End-to-End Error Recovery Scenarios', () => {
    it('should handle complex multi-step error recovery workflow', async () => {
      // Arrange
      const complexError = new Error('Database connection pool exhausted');
      const errorContext: ErrorContext = {
        error: complexError,
        stepId: 'fragile-step',
        workflowId: 'resilient-workflow-123',
        timestamp: new Date(),
        category: { type: 'resource', severity: 'high', recoverable: true },
        retryCount: 0
      };

      // Recovery scenario: Circuit breaker -> Retry with backoff -> Fallback -> Success
      mockRecoveryStrategyManager.selectRecoveryStrategy.mockResolvedValue({
        strategy: 'multi-stage',
        stages: ['circuit-breaker', 'retry', 'fallback']
      });

      // Stage 1: Circuit breaker detects problem and opens
      mockCircuitBreaker.getState.mockReturnValueOnce('closed').mockReturnValueOnce('open');
      mockCircuitBreaker.call.mockRejectedValueOnce(complexError);

      // Stage 2: Retry with exponential backoff
      mockRetryManager.executeWithRetry.mockResolvedValueOnce({
        success: false,
        attempts: 3,
        error: complexError
      });

      // Stage 3: Fallback to cached data succeeds
      mockRecoveryStrategyManager.applyRecoveryAction.mockResolvedValue({
        applied: true,
        action: 'use-cached-data',
        result: { data: 'fallback-data', timestamp: new Date() }
      });

      mockRecoveryStrategyManager.executeRecoveryStrategy.mockResolvedValue({
        success: true,
        strategy: 'multi-stage',
        stages: [
          { stage: 'circuit-breaker', success: false, reason: 'Circuit opened' },
          { stage: 'retry', success: false, reason: 'Max retries exceeded' },
          { stage: 'fallback', success: true, reason: 'Cached data available' }
        ],
        result: { recovered: true, usedFallback: true }
      });

      // Act
      const result = await errorRecoveryEngine.recoverFromError(
        errorContext,
        resilientWorkflow,
        mockExecutionContext
      );

      // Assert - Verify complex recovery flow
      expect(mockCircuitBreaker.call).toHaveBeenCalled();
      expect(mockRetryManager.executeWithRetry).toHaveBeenCalled();
      expect(mockRecoveryStrategyManager.applyRecoveryAction).toHaveBeenCalled();

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'recovery.multi.stage.completed',
        expect.objectContaining({
          totalStages: 3,
          successfulStage: 'fallback',
          finalResult: expect.objectContaining({ recovered: true })
        })
      );

      expect(result.success).toBe(true);
      expect(result.stages).toHaveLength(3);
      expect(result.stages[2].success).toBe(true);
    });
  });
});