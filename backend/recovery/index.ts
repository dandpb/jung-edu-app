/**
 * Auto-Recovery and Self-Healing System
 * Comprehensive resilience patterns for production applications
 */

export {
  CircuitBreaker,
  CircuitBreakerFactory,
  CircuitState,
  type CircuitBreakerConfig
} from './CircuitBreaker';

export {
  RetryMechanism,
  RetryError,
  RetryStrategy,
  RetryProfiles,
  Retry,
  type RetryConfig
} from './RetryMechanism';

export {
  Bulkhead,
  BulkheadManager,
  ResourceExhaustedError,
  BulkheadTimeout,
  BulkheadProfiles,
  type BulkheadConfig,
  type QueuedOperation
} from './BulkheadPattern';

export {
  GracefulDegradationService,
  DegradationManager,
  DegradationError,
  ServiceLevel,
  type FallbackConfig,
  type ServiceStatus
} from './GracefulDegradation';

export {
  AutoScaler,
  ScalingProfiles,
  type AutoScalingConfig,
  type ScalingRule,
  type ScalingEvent,
  type MetricData
} from './AutoScaling';

export {
  HealthMonitor,
  HealthStatus,
  HealthChecks,
  type HealthCheck,
  type HealthCheckResult,
  type SystemHealth,
  type HealthMonitorConfig
} from './HealthMonitoring';

export {
  SelfHealingOrchestrator,
  type SelfHealingConfig,
  type RecoveryAction,
  type SystemMetrics
} from './SelfHealingOrchestrator';

/**
 * Quick setup utilities for common scenarios
 */
export class RecoverySetup {
  /**
   * Setup basic resilience for a web service
   */
  static basicWebService(serviceName: string) {
    // Circuit breaker for external dependencies
    const circuitBreaker = CircuitBreakerFactory.create(serviceName, {
      failureThreshold: 5,
      resetTimeout: 30000,
      monitoringPeriod: 60000,
      onStateChange: (state) => console.log(`${serviceName} circuit breaker: ${state}`)
    });

    // Bulkhead for request isolation
    const bulkhead = BulkheadManager.create({
      name: serviceName,
      maxConcurrent: 10,
      maxQueue: 50,
      timeout: 30000,
      priority: false
    });

    // Retry mechanism for transient failures
    const retryMechanism = new RetryMechanism({
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      strategy: RetryStrategy.EXPONENTIAL,
      jitter: true
    });

    return {
      circuitBreaker,
      bulkhead,
      retryMechanism,
      execute: async <T>(operation: () => Promise<T>): Promise<T> => {
        return circuitBreaker.execute(() =>
          bulkhead.execute(() =>
            retryMechanism.execute(operation)
          )
        );
      }
    };
  }

  /**
   * Setup comprehensive self-healing system
   */
  static selfHealingSystem(config: Partial<SelfHealingConfig> = {}) {
    const defaultConfig: SelfHealingConfig = {
      name: 'self-healing-system',
      enabled: true,
      healthCheck: {
        interval: 30000,
        timeout: 5000,
        enabledChecks: ['database', 'memory', 'http']
      },
      circuitBreaker: {
        enabled: true,
        failureThreshold: 5,
        resetTimeout: 30000
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
        degradationThreshold: 3,
        recoveryThreshold: 2
      },
      recoveryActions: [
        {
          name: 'restart-on-critical-health',
          trigger: {
            condition: 'health_degraded',
            threshold: 3,
            duration: 60000
          },
          action: {
            type: 'restart',
            parameters: {}
          },
          cooldown: 300000,
          maxAttempts: 3
        },
        {
          name: 'scale-up-on-high-load',
          trigger: {
            condition: 'performance_degraded',
            threshold: 80,
            duration: 120000
          },
          action: {
            type: 'scale',
            parameters: { amount: 1 }
          },
          cooldown: 180000,
          maxAttempts: 5
        }
      ]
    };

    const mergedConfig = { ...defaultConfig, ...config };
    const orchestrator = new SelfHealingOrchestrator(mergedConfig);

    // Register basic health checks
    orchestrator.registerHealthCheck(HealthChecks.MEMORY_USAGE());

    return orchestrator;
  }

  /**
   * Setup microservices resilience patterns
   */
  static microservicesResilience(services: string[]) {
    const components = new Map<string, any>();

    services.forEach(service => {
      // Circuit breaker per service
      const circuitBreaker = CircuitBreakerFactory.create(service, {
        failureThreshold: 3,
        resetTimeout: 15000,
        monitoringPeriod: 30000
      });

      // Bulkhead per service
      const bulkhead = BulkheadManager.create({
        name: service,
        maxConcurrent: 5,
        maxQueue: 20,
        timeout: 10000,
        priority: true
      });

      // Graceful degradation per service
      const degradationService = DegradationManager.register({
        name: service,
        primary: async () => ({ service, status: 'full' }),
        fallbacks: [
          {
            implementation: async () => ({ service, status: 'degraded' }),
            level: ServiceLevel.DEGRADED
          },
          {
            implementation: async () => ({ service, status: 'critical' }),
            level: ServiceLevel.CRITICAL_ONLY
          }
        ],
        degradationThreshold: 3,
        recoveryThreshold: 2,
        monitoringInterval: 30000
      });

      components.set(service, {
        circuitBreaker,
        bulkhead,
        degradationService
      });
    });

    return {
      components,
      executeWithResilience: async <T>(
        serviceName: string,
        operation: () => Promise<T>
      ): Promise<T> => {
        const serviceComponents = components.get(serviceName);
        if (!serviceComponents) {
          throw new Error(`Service ${serviceName} not configured`);
        }

        const { circuitBreaker, bulkhead } = serviceComponents;
        
        return circuitBreaker.execute(() =>
          bulkhead.execute(operation)
        );
      }
    };
  }
}