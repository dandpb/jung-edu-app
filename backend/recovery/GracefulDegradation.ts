/**
 * Graceful Degradation Implementation
 * Provides fallback mechanisms for service failures
 */

import { EventEmitter } from 'events';

export enum ServiceLevel {
  FULL = 'FULL',
  DEGRADED = 'DEGRADED',
  CRITICAL_ONLY = 'CRITICAL_ONLY',
  UNAVAILABLE = 'UNAVAILABLE'
}

export interface FallbackConfig<T> {
  name: string;
  primary: () => Promise<T>;
  fallbacks: Array<{
    implementation: () => Promise<T>;
    level: ServiceLevel;
    condition?: (error: Error) => boolean;
    timeout?: number;
  }>;
  healthCheck?: () => Promise<boolean>;
  degradationThreshold: number;
  recoveryThreshold: number;
  monitoringInterval: number;
}

export interface ServiceStatus {
  level: ServiceLevel;
  isHealthy: boolean;
  lastCheck: number;
  failureCount: number;
  successCount: number;
  currentFallback?: string;
}

export class DegradationError extends Error {
  constructor(
    message: string,
    public readonly serviceLevel: ServiceLevel,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DegradationError';
  }
}

export class GracefulDegradationService<T> extends EventEmitter {
  private status: ServiceStatus = {
    level: ServiceLevel.FULL,
    isHealthy: true,
    lastCheck: Date.now(),
    failureCount: 0,
    successCount: 0
  };

  private healthCheckTimer?: NodeJS.Timeout;
  private fallbackIndex: number = -1;

  constructor(private readonly config: FallbackConfig<T>) {
    super();
    this.startHealthMonitoring();
  }

  /**
   * Execute operation with graceful degradation
   */
  async execute(): Promise<T> {
    // Try primary service first if healthy
    if (this.status.level === ServiceLevel.FULL) {
      try {
        const result = await this.executePrimary();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure(error as Error);
        return this.executeWithFallback(error as Error);
      }
    }

    // Use appropriate fallback based on current service level
    return this.executeWithFallback();
  }

  private async executePrimary(): Promise<T> {
    return this.config.primary();
  }

  private async executeWithFallback(error?: Error): Promise<T> {
    const availableFallbacks = this.config.fallbacks.filter(fallback => {
      // Check if fallback is suitable for current service level
      if (this.status.level === ServiceLevel.CRITICAL_ONLY) {
        return fallback.level === ServiceLevel.CRITICAL_ONLY;
      }
      return fallback.level !== ServiceLevel.UNAVAILABLE;
    });

    if (availableFallbacks.length === 0) {
      this.status.level = ServiceLevel.UNAVAILABLE;
      this.emit('serviceUnavailable', this.config.name);
      throw new DegradationError(
        `Service '${this.config.name}' is unavailable`,
        ServiceLevel.UNAVAILABLE,
        error
      );
    }

    // Try fallbacks in order
    for (let i = 0; i < availableFallbacks.length; i++) {
      const fallback = availableFallbacks[i];
      
      // Skip if fallback has a condition and it doesn't match
      if (error && fallback.condition && !fallback.condition(error)) {
        continue;
      }

      try {
        const result = fallback.timeout
          ? await this.withTimeout(fallback.implementation(), fallback.timeout)
          : await fallback.implementation();

        // Update service level if using fallback
        if (this.status.level === ServiceLevel.FULL) {
          this.status.level = fallback.level;
          this.status.currentFallback = `fallback-${i}`;
          this.emit('degraded', {
            service: this.config.name,
            level: fallback.level,
            fallback: `fallback-${i}`
          });
        }

        this.onSuccess();
        return result;
      } catch (fallbackError) {
        this.emit('fallbackFailed', {
          service: this.config.name,
          fallback: `fallback-${i}`,
          error: fallbackError
        });
        
        // Continue to next fallback
        continue;
      }
    }

    // All fallbacks failed
    this.status.level = ServiceLevel.UNAVAILABLE;
    this.emit('allFallbacksFailed', this.config.name);
    throw new DegradationError(
      `All fallbacks failed for service '${this.config.name}'`,
      ServiceLevel.UNAVAILABLE,
      error
    );
  }

  private async withTimeout<R>(promise: Promise<R>, timeoutMs: number): Promise<R> {
    return Promise.race([
      promise,
      new Promise<R>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  private onSuccess(): void {
    this.status.successCount++;
    
    // Check if we can recover to a higher service level
    if (this.status.successCount >= this.config.recoveryThreshold) {
      this.attemptRecovery();
    }
  }

  private onFailure(error: Error): void {
    this.status.failureCount++;
    
    // Check if we need to degrade service level
    if (this.status.failureCount >= this.config.degradationThreshold) {
      this.degradeService();
    }
    
    this.emit('operationFailed', {
      service: this.config.name,
      error: error.message,
      failureCount: this.status.failureCount
    });
  }

  private degradeService(): void {
    const currentLevel = this.status.level;
    
    switch (currentLevel) {
      case ServiceLevel.FULL:
        this.status.level = ServiceLevel.DEGRADED;
        break;
      case ServiceLevel.DEGRADED:
        this.status.level = ServiceLevel.CRITICAL_ONLY;
        break;
      case ServiceLevel.CRITICAL_ONLY:
        this.status.level = ServiceLevel.UNAVAILABLE;
        break;
    }

    if (this.status.level !== currentLevel) {
      this.emit('serviceDegraded', {
        service: this.config.name,
        from: currentLevel,
        to: this.status.level
      });
    }
  }

  private attemptRecovery(): void {
    const currentLevel = this.status.level;
    
    switch (currentLevel) {
      case ServiceLevel.DEGRADED:
        this.status.level = ServiceLevel.FULL;
        this.status.currentFallback = undefined;
        break;
      case ServiceLevel.CRITICAL_ONLY:
        this.status.level = ServiceLevel.DEGRADED;
        break;
      case ServiceLevel.UNAVAILABLE:
        this.status.level = ServiceLevel.CRITICAL_ONLY;
        break;
    }

    if (this.status.level !== currentLevel) {
      this.status.failureCount = 0; // Reset failure count on recovery
      this.emit('serviceRecovered', {
        service: this.config.name,
        from: currentLevel,
        to: this.status.level
      });
    }
  }

  private startHealthMonitoring(): void {
    if (!this.config.healthCheck) return;

    this.healthCheckTimer = setInterval(async () => {
      try {
        const isHealthy = await this.config.healthCheck!();
        const wasHealthy = this.status.isHealthy;
        
        this.status.isHealthy = isHealthy;
        this.status.lastCheck = Date.now();

        if (!wasHealthy && isHealthy) {
          this.emit('healthRecovered', this.config.name);
          this.attemptRecovery();
        } else if (wasHealthy && !isHealthy) {
          this.emit('healthDegraded', this.config.name);
          this.degradeService();
        }
      } catch (error) {
        this.status.isHealthy = false;
        this.emit('healthCheckFailed', {
          service: this.config.name,
          error: (error as Error).message
        });
      }
    }, this.config.monitoringInterval);
  }

  /**
   * Get current service status
   */
  getStatus(): ServiceStatus {
    return { ...this.status };
  }

  /**
   * Force service level change (for testing)
   */
  forceServiceLevel(level: ServiceLevel): void {
    const oldLevel = this.status.level;
    this.status.level = level;
    
    this.emit('serviceLevelChanged', {
      service: this.config.name,
      from: oldLevel,
      to: level,
      forced: true
    });
  }

  /**
   * Reset service to full operation
   */
  reset(): void {
    this.status = {
      level: ServiceLevel.FULL,
      isHealthy: true,
      lastCheck: Date.now(),
      failureCount: 0,
      successCount: 0
    };
    
    this.emit('serviceReset', this.config.name);
  }

  /**
   * Shutdown gracefully
   */
  shutdown(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }
    
    this.removeAllListeners();
    this.emit('serviceShutdown', this.config.name);
  }
}

/**
 * Graceful Degradation Manager
 */
export class DegradationManager {
  private static services = new Map<string, GracefulDegradationService<any>>();

  static register<T>(config: FallbackConfig<T>): GracefulDegradationService<T> {
    const service = new GracefulDegradationService(config);
    this.services.set(config.name, service);
    return service;
  }

  static get<T>(name: string): GracefulDegradationService<T> | undefined {
    return this.services.get(name);
  }

  static getAll(): Map<string, GracefulDegradationService<any>> {
    return new Map(this.services);
  }

  static getSystemStatus(): Record<string, ServiceStatus> {
    const status: Record<string, ServiceStatus> = {};
    this.services.forEach((service, name) => {
      status[name] = service.getStatus();
    });
    return status;
  }

  static shutdownAll(): void {
    this.services.forEach(service => service.shutdown());
    this.services.clear();
  }
}