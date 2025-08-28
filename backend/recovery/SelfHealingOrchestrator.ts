/**
 * Self-Healing Orchestrator
 * Coordinates all recovery mechanisms for automated system healing
 */

import { EventEmitter } from 'events';
import { CircuitBreaker, CircuitBreakerFactory, CircuitState } from './CircuitBreaker';
import { RetryMechanism, RetryConfig, RetryStrategy } from './RetryMechanism';
import { Bulkhead, BulkheadManager } from './BulkheadPattern';
import { GracefulDegradationService, DegradationManager, ServiceLevel } from './GracefulDegradation';
import { AutoScaler } from './AutoScaling';
import { HealthMonitor, HealthStatus, HealthCheck } from './HealthMonitoring';

export interface RecoveryAction {
  name: string;
  trigger: {
    condition: string; // e.g., 'circuit_open', 'health_unhealthy', 'load_high'
    threshold?: number;
    duration?: number;
  };
  action: {
    type: 'restart' | 'scale' | 'degrade' | 'circuit_reset' | 'custom';
    parameters?: Record<string, any>;
    customAction?: () => Promise<void>;
  };
  cooldown: number;
  maxAttempts: number;
}

export interface SelfHealingConfig {
  name: string;
  enabled: boolean;
  healthCheck: {
    interval: number;
    timeout: number;
    enabledChecks: string[];
  };
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    resetTimeout: number;
  };
  autoScaling: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
  };
  gracefulDegradation: {
    enabled: boolean;
    degradationThreshold: number;
    recoveryThreshold: number;
  };
  recoveryActions: RecoveryAction[];
}

export interface SystemMetrics {
  timestamp: number;
  health: {
    status: HealthStatus;
    checksPassing: number;
    checksTotal: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  resilience: {
    circuitBreakerState: Record<string, CircuitState>;
    bulkheadUtilization: Record<string, number>;
    serviceLevel: Record<string, ServiceLevel>;
    scalingEvents: number;
  };
}

export class SelfHealingOrchestrator extends EventEmitter {
  private healthMonitor: HealthMonitor;
  private autoScaler?: AutoScaler;
  private metricsHistory: SystemMetrics[] = [];
  private recoveryAttempts = new Map<string, { count: number; lastAttempt: number }>();
  private isEnabled = true;
  private metricsInterval?: NodeJS.Timeout;

  constructor(private readonly config: SelfHealingConfig) {
    super();
    
    this.healthMonitor = new HealthMonitor({
      name: `${config.name}-health`,
      globalTimeout: config.healthCheck.timeout,
      maxConcurrentChecks: 5,
      retryDelay: 1000,
      unhealthyThreshold: 3,
      recoveryThreshold: 2,
      onStatusChange: (status, previous) => this.handleHealthStatusChange(status, previous),
      onCheckFailed: (check, result) => this.handleHealthCheckFailure(check, result)
    });

    this.initializeComponents();
    this.startMetricsCollection();
    this.setupEventListeners();
  }

  private initializeComponents(): void {
    // Initialize circuit breakers
    if (this.config.circuitBreaker.enabled) {
      this.initializeCircuitBreakers();
    }

    // Initialize bulkheads
    this.initializeBulkheads();

    // Initialize graceful degradation
    if (this.config.gracefulDegradation.enabled) {
      this.initializeGracefulDegradation();
    }

    // Initialize auto-scaling
    if (this.config.autoScaling.enabled) {
      this.initializeAutoScaling();
    }
  }

  private initializeCircuitBreakers(): void {
    const services = ['database', 'external-api', 'payment-service', 'notification-service'];
    
    services.forEach(service => {
      CircuitBreakerFactory.create(service, {
        failureThreshold: this.config.circuitBreaker.failureThreshold,
        resetTimeout: this.config.circuitBreaker.resetTimeout,
        monitoringPeriod: 60000,
        onStateChange: (state) => this.handleCircuitBreakerStateChange(service, state),
        onFailure: (error) => this.handleServiceFailure(service, error)
      });
    });
  }

  private initializeBulkheads(): void {
    BulkheadManager.create({
      name: 'database',
      maxConcurrent: 10,
      maxQueue: 50,
      timeout: 30000,
      priority: true
    });

    BulkheadManager.create({
      name: 'external-api',
      maxConcurrent: 5,
      maxQueue: 20,
      timeout: 10000,
      priority: false
    });
  }

  private initializeGracefulDegradation(): void {
    // Example degradation service for user profile
    DegradationManager.register({
      name: 'user-profile',
      primary: async () => {
        // Primary implementation - full user profile from database
        return { profile: 'full', features: ['avatar', 'preferences', 'history'] };
      },
      fallbacks: [
        {
          implementation: async () => {
            // Degraded - basic profile from cache
            return { profile: 'basic', features: ['avatar'] };
          },
          level: ServiceLevel.DEGRADED
        },
        {
          implementation: async () => {
            // Critical only - default profile
            return { profile: 'default', features: [] };
          },
          level: ServiceLevel.CRITICAL_ONLY
        }
      ],
      degradationThreshold: this.config.gracefulDegradation.degradationThreshold,
      recoveryThreshold: this.config.gracefulDegradation.recoveryThreshold,
      monitoringInterval: 30000
    });
  }

  private initializeAutoScaling(): void {
    this.autoScaler = new AutoScaler({
      name: this.config.name,
      minInstances: this.config.autoScaling.minInstances,
      maxInstances: this.config.autoScaling.maxInstances,
      currentInstances: this.config.autoScaling.minInstances,
      scalingRules: [
        {
          metricName: 'response_time',
          threshold: 2000,
          comparison: 'gte',
          duration: 60000,
          cooldown: 300000,
          scaleAction: 'up',
          scaleAmount: 1
        },
        {
          metricName: 'error_rate',
          threshold: 5,
          comparison: 'gte',
          duration: 30000,
          cooldown: 180000,
          scaleAction: 'up',
          scaleAmount: 2
        }
      ],
      metricWindow: 300000,
      evaluationInterval: 30000,
      scaleUpCooldown: 300000,
      scaleDownCooldown: 600000,
      onScale: async (action, amount, reason) => this.handleAutoScale(action, amount, reason)
    });
  }

  private setupEventListeners(): void {
    // Listen for circuit breaker events
    CircuitBreakerFactory.getAll().forEach(breaker => {
      breaker.on?.('stateChanged', (state) => {
        this.triggerRecoveryAction('circuit_state_change', { state });
      });
    });

    // Listen for bulkhead events
    BulkheadManager.getAll().forEach(bulkhead => {
      bulkhead.on('queueFull', () => {
        this.triggerRecoveryAction('bulkhead_queue_full', { bulkhead: bulkhead.getMetrics().name });
      });
    });
  }

  /**
   * Register a health check
   */
  registerHealthCheck(healthCheck: HealthCheck): void {
    this.healthMonitor.register(healthCheck);
  }

  /**
   * Execute operation with full resilience protection
   */
  async executeWithProtection<T>(
    operation: () => Promise<T>,
    options: {
      serviceName: string;
      circuitBreaker?: boolean;
      bulkhead?: string;
      retry?: RetryConfig;
      gracefulDegradation?: boolean;
    }
  ): Promise<T> {
    let protectedOperation = operation;

    // Apply bulkhead protection
    if (options.bulkhead) {
      const bulkhead = BulkheadManager.get(options.bulkhead);
      if (bulkhead) {
        const originalOp = protectedOperation;
        protectedOperation = () => bulkhead.execute(originalOp);
      }
    }

    // Apply retry logic
    if (options.retry) {
      const retryMechanism = new RetryMechanism(options.retry);
      const originalOp = protectedOperation;
      protectedOperation = () => retryMechanism.execute(originalOp);
    }

    // Apply circuit breaker protection
    if (options.circuitBreaker) {
      const circuitBreaker = CircuitBreakerFactory.get(options.serviceName);
      if (circuitBreaker) {
        const originalOp = protectedOperation;
        protectedOperation = () => circuitBreaker.execute(originalOp);
      }
    }

    // Apply graceful degradation
    if (options.gracefulDegradation) {
      const degradationService = DegradationManager.get(options.serviceName);
      if (degradationService) {
        return degradationService.execute();
      }
    }

    return protectedOperation();
  }

  private handleHealthStatusChange(status: HealthStatus, previous: HealthStatus): void {
    this.emit('healthStatusChanged', { status, previous });
    
    if (status === HealthStatus.UNHEALTHY || status === HealthStatus.CRITICAL) {
      this.triggerRecoveryAction('health_degraded', { status, previous });
    } else if (previous !== HealthStatus.HEALTHY && status === HealthStatus.HEALTHY) {
      this.emit('systemRecovered', { recoveryTime: Date.now() });
    }
  }

  private handleHealthCheckFailure(check: string, result: any): void {
    this.triggerRecoveryAction('health_check_failed', { check, result });
  }

  private handleCircuitBreakerStateChange(service: string, state: CircuitState): void {
    this.emit('circuitBreakerStateChanged', { service, state });
    
    if (state === CircuitState.OPEN) {
      this.triggerRecoveryAction('circuit_breaker_open', { service });
    }
  }

  private handleServiceFailure(service: string, error: Error): void {
    this.emit('serviceFailure', { service, error: error.message });
    this.triggerRecoveryAction('service_failure', { service, error });
  }

  private async handleAutoScale(action: 'up' | 'down', amount: number, reason: string): Promise<void> {
    this.emit('autoScaled', { action, amount, reason });
    
    // Here you would implement actual scaling logic
    // This could involve starting/stopping containers, adjusting load balancer settings, etc.
    console.log(`Auto-scaling ${action} by ${amount} instances: ${reason}`);
  }

  private async triggerRecoveryAction(condition: string, context: any): Promise<void> {
    if (!this.isEnabled) return;

    const applicableActions = this.config.recoveryActions.filter(
      action => action.trigger.condition === condition
    );

    for (const action of applicableActions) {
      try {
        await this.executeRecoveryAction(action, context);
      } catch (error) {
        this.emit('recoveryActionFailed', {
          action: action.name,
          error: (error as Error).message,
          context
        });
      }
    }
  }

  private async executeRecoveryAction(action: RecoveryAction, context: any): Promise<void> {
    const attemptKey = action.name;
    const now = Date.now();
    const attempts = this.recoveryAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };

    // Check cooldown
    if (now - attempts.lastAttempt < action.cooldown) {
      return;
    }

    // Check max attempts
    if (attempts.count >= action.maxAttempts) {
      this.emit('recoveryActionExhausted', { action: action.name, attempts: attempts.count });
      return;
    }

    // Update attempts
    attempts.count++;
    attempts.lastAttempt = now;
    this.recoveryAttempts.set(attemptKey, attempts);

    this.emit('recoveryActionStarted', { action: action.name, context });

    switch (action.action.type) {
      case 'restart':
        await this.executeRestartAction(action, context);
        break;
      case 'scale':
        await this.executeScaleAction(action, context);
        break;
      case 'degrade':
        await this.executeDegradeAction(action, context);
        break;
      case 'circuit_reset':
        await this.executeCircuitResetAction(action, context);
        break;
      case 'custom':
        if (action.action.customAction) {
          await action.action.customAction();
        }
        break;
    }

    this.emit('recoveryActionCompleted', { action: action.name, context });
  }

  private async executeRestartAction(action: RecoveryAction, context: any): Promise<void> {
    // Implementation would restart the affected service/component
    console.log(`Executing restart action for ${action.name}`, context);
  }

  private async executeScaleAction(action: RecoveryAction, context: any): Promise<void> {
    if (this.autoScaler) {
      const scaleAmount = action.action.parameters?.amount || 1;
      await this.autoScaler.forceScale('up', scaleAmount, `Recovery action: ${action.name}`);
    }
  }

  private async executeDegradeAction(action: RecoveryAction, context: any): Promise<void> {
    const serviceName = action.action.parameters?.service || context.service;
    const service = DegradationManager.get(serviceName);
    if (service) {
      service.forceServiceLevel(ServiceLevel.DEGRADED);
    }
  }

  private async executeCircuitResetAction(action: RecoveryAction, context: any): Promise<void> {
    const serviceName = action.action.parameters?.service || context.service;
    const circuitBreaker = CircuitBreakerFactory.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
    }
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Collect every 30 seconds
  }

  private collectSystemMetrics(): void {
    const health = this.healthMonitor.getHealth();
    const circuitBreakers = CircuitBreakerFactory.getAll();
    const bulkheads = BulkheadManager.getAll();
    const degradationServices = DegradationManager.getAll();

    const metrics: SystemMetrics = {
      timestamp: Date.now(),
      health: {
        status: health.status,
        checksPassing: health.summary.healthy,
        checksTotal: health.summary.total
      },
      performance: {
        responseTime: this.calculateAverageResponseTime(),
        throughput: this.calculateThroughput(),
        errorRate: this.calculateErrorRate(),
        cpuUsage: this.getCpuUsage(),
        memoryUsage: this.getMemoryUsage()
      },
      resilience: {
        circuitBreakerState: this.getCircuitBreakerStates(circuitBreakers),
        bulkheadUtilization: this.getBulkheadUtilization(bulkheads),
        serviceLevel: this.getServiceLevels(degradationServices),
        scalingEvents: this.getScalingEventsCount()
      }
    };

    this.metricsHistory.push(metrics);
    
    // Keep only recent metrics (last 24 hours)
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    this.metricsHistory = this.metricsHistory.filter(m => m.timestamp > cutoff);

    // Update auto-scaler metrics
    if (this.autoScaler) {
      this.autoScaler.updateMetric('response_time', metrics.performance.responseTime);
      this.autoScaler.updateMetric('error_rate', metrics.performance.errorRate);
      this.autoScaler.updateMetric('cpu_usage', metrics.performance.cpuUsage);
      this.autoScaler.updateMetric('memory_usage', metrics.performance.memoryUsage);
    }

    this.emit('metricsCollected', metrics);
  }

  // Helper methods for metrics collection
  private calculateAverageResponseTime(): number {
    // Implementation would calculate from actual request metrics
    return Math.random() * 1000; // Mock implementation
  }

  private calculateThroughput(): number {
    // Implementation would calculate requests per second
    return Math.random() * 100; // Mock implementation
  }

  private calculateErrorRate(): number {
    // Implementation would calculate error percentage
    return Math.random() * 10; // Mock implementation
  }

  private getCpuUsage(): number {
    // Implementation would get actual CPU usage
    return Math.random() * 100; // Mock implementation
  }

  private getMemoryUsage(): number {
    const usage = process.memoryUsage();
    return (usage.heapUsed / usage.heapTotal) * 100;
  }

  private getCircuitBreakerStates(breakers: Map<string, CircuitBreaker>): Record<string, CircuitState> {
    const states: Record<string, CircuitState> = {};
    breakers.forEach((breaker, name) => {
      states[name] = breaker.getMetrics().state;
    });
    return states;
  }

  private getBulkheadUtilization(bulkheads: Map<string, Bulkhead>): Record<string, number> {
    const utilization: Record<string, number> = {};
    bulkheads.forEach((bulkhead, name) => {
      utilization[name] = bulkhead.getMetrics().utilization;
    });
    return utilization;
  }

  private getServiceLevels(services: Map<string, GracefulDegradationService<any>>): Record<string, ServiceLevel> {
    const levels: Record<string, ServiceLevel> = {};
    services.forEach((service, name) => {
      levels[name] = service.getStatus().level;
    });
    return levels;
  }

  private getScalingEventsCount(): number {
    // Implementation would count recent scaling events
    return 0; // Mock implementation
  }

  /**
   * Get current system metrics
   */
  getCurrentMetrics(): SystemMetrics | undefined {
    return this.metricsHistory.length > 0 
      ? this.metricsHistory[this.metricsHistory.length - 1] 
      : undefined;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours?: number): SystemMetrics[] {
    if (!hours) return [...this.metricsHistory];
    
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp > cutoff);
  }

  /**
   * Enable/disable self-healing
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.emit('enabledChanged', enabled);
  }

  /**
   * Get system status summary
   */
  getStatus() {
    const currentMetrics = this.getCurrentMetrics();
    
    return {
      enabled: this.isEnabled,
      health: currentMetrics?.health.status || HealthStatus.HEALTHY,
      componentsEnabled: {
        healthMonitoring: true,
        circuitBreaker: this.config.circuitBreaker.enabled,
        autoScaling: this.config.autoScaling.enabled && !!this.autoScaler,
        gracefulDegradation: this.config.gracefulDegradation.enabled
      },
      recoveryActions: {
        total: this.config.recoveryActions.length,
        attempted: this.recoveryAttempts.size
      },
      lastMetricsUpdate: currentMetrics?.timestamp
    };
  }

  /**
   * Shutdown orchestrator gracefully
   */
  async shutdown(): Promise<void> {
    this.setEnabled(false);
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    this.healthMonitor.shutdown();
    
    if (this.autoScaler) {
      this.autoScaler.shutdown();
    }

    await BulkheadManager.shutdownAll();
    DegradationManager.shutdownAll();

    this.removeAllListeners();
    this.emit('shutdown');
  }
}