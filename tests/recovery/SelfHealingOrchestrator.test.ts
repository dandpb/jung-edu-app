/**
 * Self-Healing Orchestrator Tests
 * Integration tests for the complete self-healing system
 */

import { SelfHealingOrchestrator, SelfHealingConfig } from '../../src/recovery/SelfHealingOrchestrator';
import { HealthStatus, HealthCheck } from '../../src/recovery/HealthMonitoring';
import { ServiceLevel } from '../../src/recovery/GracefulDegradation';

describe('SelfHealingOrchestrator', () => {
  let orchestrator: SelfHealingOrchestrator;
  let mockScaleAction: jest.Mock;
  let mockRestartAction: jest.Mock;

  const baseConfig: SelfHealingConfig = {
    name: 'test-system',
    enabled: true,
    healthCheck: {
      interval: 1000,
      timeout: 500,
      enabledChecks: ['test-check']
    },
    circuitBreaker: {
      enabled: true,
      failureThreshold: 3,
      resetTimeout: 5000
    },
    autoScaling: {
      enabled: true,
      minInstances: 1,
      maxInstances: 10,
      scaleUpThreshold: 80,
      scaleDownThreshold: 20
    },
    gracefulDegradation: {
      enabled: true,
      degradationThreshold: 2,
      recoveryThreshold: 3
    },
    recoveryActions: []
  };

  beforeEach(() => {
    mockScaleAction = jest.fn().mockResolvedValue(undefined);
    mockRestartAction = jest.fn().mockResolvedValue(undefined);
    
    const config = {
      ...baseConfig,
      recoveryActions: [
        {
          name: 'scale-up-on-high-load',
          trigger: {
            condition: 'health_degraded',
            threshold: 2,
            duration: 100
          },
          action: {
            type: 'scale' as const,
            parameters: { amount: 1 }
          },
          cooldown: 1000,
          maxAttempts: 3
        },
        {
          name: 'restart-on-critical',
          trigger: {
            condition: 'service_failure',
            threshold: 1,
            duration: 0
          },
          action: {
            type: 'custom' as const,
            customAction: mockRestartAction
          },
          cooldown: 5000,
          maxAttempts: 2
        }
      ]
    };

    orchestrator = new SelfHealingOrchestrator(config);
  });

  afterEach(async () => {
    await orchestrator.shutdown();
    jest.clearAllTimers();
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      const status = orchestrator.getStatus();
      
      expect(status.enabled).toBe(true);
      expect(status.componentsEnabled.healthMonitoring).toBe(true);
      expect(status.componentsEnabled.circuitBreaker).toBe(true);
      expect(status.componentsEnabled.autoScaling).toBe(true);
      expect(status.componentsEnabled.gracefulDegradation).toBe(true);
      expect(status.recoveryActions.total).toBe(2);
    });

    it('should register health checks', () => {
      const healthCheck: HealthCheck = {
        name: 'custom-check',
        check: async () => ({
          status: HealthStatus.HEALTHY,
          message: 'OK',
          timestamp: Date.now(),
          duration: 10
        }),
        interval: 30000,
        timeout: 5000,
        retries: 3,
        critical: false
      };

      orchestrator.registerHealthCheck(healthCheck);
      
      // Health check registration should not throw
      expect(() => orchestrator.registerHealthCheck(healthCheck)).not.toThrow();
    });
  });

  describe('Protected Operation Execution', () => {
    it('should execute operation with circuit breaker protection', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await orchestrator.executeWithProtection(operation, {
        serviceName: 'test-service',
        circuitBreaker: true
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should execute operation with bulkhead protection', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await orchestrator.executeWithProtection(operation, {
        serviceName: 'test-service',
        bulkhead: 'database'
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should execute operation with retry protection', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('temporary failure'))
        .mockResolvedValueOnce('success');
      
      const result = await orchestrator.executeWithProtection(operation, {
        serviceName: 'test-service',
        retry: {
          maxAttempts: 2,
          baseDelay: 100,
          strategy: 'FIXED' as any,
          jitter: false
        }
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should combine multiple protection mechanisms', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await orchestrator.executeWithProtection(operation, {
        serviceName: 'test-service',
        circuitBreaker: true,
        bulkhead: 'database',
        retry: {
          maxAttempts: 3,
          baseDelay: 100,
          strategy: 'EXPONENTIAL' as any,
          jitter: true
        }
      });
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('Recovery Actions', () => {
    it('should trigger recovery action on health degradation', async () => {
      const healthCheck: HealthCheck = {
        name: 'failing-check',
        check: async () => ({
          status: HealthStatus.UNHEALTHY,
          message: 'Service unavailable',
          timestamp: Date.now(),
          duration: 100
        }),
        interval: 30000,
        timeout: 5000,
        retries: 1,
        critical: true
      };

      orchestrator.registerHealthCheck(healthCheck);

      // Wait for health check to execute and trigger recovery
      await new Promise(resolve => {
        orchestrator.once('recoveryActionStarted', (event) => {
          expect(event.action).toBe('scale-up-on-high-load');
          resolve(undefined);
        });
        
        // Manually trigger health status change
        (orchestrator as any).handleHealthStatusChange(HealthStatus.UNHEALTHY, HealthStatus.HEALTHY);
      });
    });

    it('should respect cooldown periods for recovery actions', async () => {
      const recoveryActionStarted = jest.fn();
      orchestrator.on('recoveryActionStarted', recoveryActionStarted);

      // Trigger the same recovery action twice
      (orchestrator as any).triggerRecoveryAction('health_degraded', { status: HealthStatus.UNHEALTHY });
      (orchestrator as any).triggerRecoveryAction('health_degraded', { status: HealthStatus.UNHEALTHY });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should only execute once due to cooldown
      expect(recoveryActionStarted).toHaveBeenCalledTimes(1);
    });

    it('should limit max attempts for recovery actions', async () => {
      const recoveryActionExhausted = jest.fn();
      orchestrator.on('recoveryActionExhausted', recoveryActionExhausted);

      // Trigger multiple recovery attempts
      for (let i = 0; i < 5; i++) {
        (orchestrator as any).triggerRecoveryAction('service_failure', { service: 'test' });
        // Advance time to bypass cooldown
        jest.advanceTimersByTime(6000);
      }

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(recoveryActionExhausted).toHaveBeenCalled();
    });
  });

  describe('Metrics Collection', () => {
    it('should collect system metrics periodically', async () => {
      const metricsCollected = jest.fn();
      orchestrator.on('metricsCollected', metricsCollected);

      // Wait for metrics collection
      await new Promise(resolve => {
        orchestrator.once('metricsCollected', (metrics) => {
          expect(metrics).toHaveProperty('timestamp');
          expect(metrics).toHaveProperty('health');
          expect(metrics).toHaveProperty('performance');
          expect(metrics).toHaveProperty('resilience');
          resolve(undefined);
        });
      });

      expect(metricsCollected).toHaveBeenCalled();
    });

    it('should provide current metrics', () => {
      // Trigger metrics collection manually
      (orchestrator as any).collectSystemMetrics();
      
      const metrics = orchestrator.getCurrentMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics?.health).toBeDefined();
      expect(metrics?.performance).toBeDefined();
      expect(metrics?.resilience).toBeDefined();
    });

    it('should provide metrics history', () => {
      // Trigger multiple metrics collections
      (orchestrator as any).collectSystemMetrics();
      (orchestrator as any).collectSystemMetrics();
      (orchestrator as any).collectSystemMetrics();
      
      const history = orchestrator.getMetricsHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);
      
      const recentHistory = orchestrator.getMetricsHistory(1);
      expect(recentHistory.length).toBeGreaterThan(0);
    });
  });

  describe('State Management', () => {
    it('should enable and disable self-healing', () => {
      expect(orchestrator.getStatus().enabled).toBe(true);
      
      orchestrator.setEnabled(false);
      expect(orchestrator.getStatus().enabled).toBe(false);
      
      orchestrator.setEnabled(true);
      expect(orchestrator.getStatus().enabled).toBe(true);
    });

    it('should emit events on state changes', async () => {
      const enabledChanged = jest.fn();
      orchestrator.on('enabledChanged', enabledChanged);
      
      orchestrator.setEnabled(false);
      
      expect(enabledChanged).toHaveBeenCalledWith(false);
    });
  });

  describe('Event Handling', () => {
    it('should emit health status change events', async () => {
      const healthStatusChanged = jest.fn();
      orchestrator.on('healthStatusChanged', healthStatusChanged);

      // Manually trigger health status change
      (orchestrator as any).handleHealthStatusChange(HealthStatus.DEGRADED, HealthStatus.HEALTHY);

      expect(healthStatusChanged).toHaveBeenCalledWith({
        status: HealthStatus.DEGRADED,
        previous: HealthStatus.HEALTHY
      });
    });

    it('should emit system recovery events', async () => {
      const systemRecovered = jest.fn();
      orchestrator.on('systemRecovered', systemRecovered);

      // Simulate recovery
      (orchestrator as any).handleHealthStatusChange(HealthStatus.HEALTHY, HealthStatus.UNHEALTHY);

      expect(systemRecovered).toHaveBeenCalledWith({
        recoveryTime: expect.any(Number)
      });
    });

    it('should emit circuit breaker state change events', async () => {
      const circuitBreakerStateChanged = jest.fn();
      orchestrator.on('circuitBreakerStateChanged', circuitBreakerStateChanged);

      // Manually trigger circuit breaker state change
      (orchestrator as any).handleCircuitBreakerStateChange('test-service', 'OPEN');

      expect(circuitBreakerStateChanged).toHaveBeenCalledWith({
        service: 'test-service',
        state: 'OPEN'
      });
    });
  });

  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully', async () => {
      const shutdownSpy = jest.fn();
      orchestrator.on('shutdown', shutdownSpy);

      await orchestrator.shutdown();

      expect(shutdownSpy).toHaveBeenCalled();
      expect(orchestrator.getStatus().enabled).toBe(false);
    });
  });
});