/**
 * Health Monitoring and Self-Healing System
 * Comprehensive health checking and automatic recovery
 */

import { EventEmitter } from 'events';

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  CRITICAL = 'CRITICAL'
}

export interface HealthCheck {
  name: string;
  check: () => Promise<HealthCheckResult>;
  interval: number;
  timeout: number;
  retries: number;
  critical: boolean;
  tags?: string[];
}

export interface HealthCheckResult {
  status: HealthStatus;
  message: string;
  metrics?: Record<string, number>;
  timestamp: number;
  duration: number;
}

export interface SystemHealth {
  status: HealthStatus;
  checks: Record<string, HealthCheckResult>;
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    critical: number;
  };
  lastUpdate: number;
}

export interface HealthMonitorConfig {
  name: string;
  globalTimeout: number;
  maxConcurrentChecks: number;
  retryDelay: number;
  unhealthyThreshold: number; // Consecutive failures to mark as unhealthy
  recoveryThreshold: number; // Consecutive successes to mark as healthy
  onStatusChange?: (status: HealthStatus, previous: HealthStatus) => void;
  onCheckFailed?: (check: string, result: HealthCheckResult) => void;
  onSystemRecovered?: () => void;
}

export class HealthMonitor extends EventEmitter {
  private checks = new Map<string, HealthCheck>();
  private results = new Map<string, HealthCheckResult[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private runningChecks = new Set<string>();
  private consecutiveFailures = new Map<string, number>();
  private consecutiveSuccesses = new Map<string, number>();
  private currentStatus: HealthStatus = HealthStatus.HEALTHY;

  constructor(private readonly config: HealthMonitorConfig) {
    super();
  }

  /**
   * Register a health check
   */
  register(healthCheck: HealthCheck): void {
    this.checks.set(healthCheck.name, healthCheck);
    this.results.set(healthCheck.name, []);
    this.consecutiveFailures.set(healthCheck.name, 0);
    this.consecutiveSuccesses.set(healthCheck.name, 0);

    // Start periodic checking
    this.scheduleCheck(healthCheck.name);
    
    this.emit('checkRegistered', healthCheck.name);
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): boolean {
    const timer = this.timers.get(name);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(name);
    }

    this.runningChecks.delete(name);
    this.results.delete(name);
    this.consecutiveFailures.delete(name);
    this.consecutiveSuccesses.delete(name);
    
    const removed = this.checks.delete(name);
    if (removed) {
      this.emit('checkUnregistered', name);
      // Recalculate system health
      setTimeout(() => this.updateSystemHealth(), 0);
    }
    
    return removed;
  }

  /**
   * Run a specific health check manually
   */
  async runCheck(name: string): Promise<HealthCheckResult> {
    const check = this.checks.get(name);
    if (!check) {
      throw new Error(`Health check '${name}' not found`);
    }

    if (this.runningChecks.has(name)) {
      throw new Error(`Health check '${name}' is already running`);
    }

    return this.executeCheck(check);
  }

  /**
   * Run all health checks
   */
  async runAllChecks(): Promise<Record<string, HealthCheckResult>> {
    const results: Record<string, HealthCheckResult> = {};
    const promises: Promise<void>[] = [];

    for (const [name, check] of this.checks) {
      if (this.runningChecks.has(name)) continue;

      promises.push(
        this.executeCheck(check)
          .then(result => {
            results[name] = result;
          })
          .catch(error => {
            results[name] = {
              status: HealthStatus.UNHEALTHY,
              message: error.message,
              timestamp: Date.now(),
              duration: 0
            };
          })
      );

      // Limit concurrent checks
      if (promises.length >= this.config.maxConcurrentChecks) {
        await Promise.allSettled(promises.splice(0, this.config.maxConcurrentChecks));
      }
    }

    // Wait for remaining checks
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }

    return results;
  }

  private async executeCheck(check: HealthCheck): Promise<HealthCheckResult> {
    this.runningChecks.add(check.name);
    const startTime = Date.now();

    try {
      // Execute check with timeout
      const result = await Promise.race([
        check.check(),
        this.createTimeoutPromise(check.timeout)
      ]);

      const duration = Date.now() - startTime;
      const checkResult: HealthCheckResult = {
        ...result,
        timestamp: startTime,
        duration
      };

      this.recordResult(check.name, checkResult);
      this.updateConsecutiveCounters(check.name, checkResult.status);
      
      return checkResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      const checkResult: HealthCheckResult = {
        status: HealthStatus.UNHEALTHY,
        message: (error as Error).message,
        timestamp: startTime,
        duration
      };

      this.recordResult(check.name, checkResult);
      this.updateConsecutiveCounters(check.name, checkResult.status);

      return checkResult;

    } finally {
      this.runningChecks.delete(check.name);
      this.scheduleCheck(check.name);
      this.updateSystemHealth();
    }
  }

  private createTimeoutPromise(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  private recordResult(name: string, result: HealthCheckResult): void {
    const results = this.results.get(name) || [];
    results.push(result);

    // Keep only recent results (max 100)
    if (results.length > 100) {
      results.splice(0, results.length - 100);
    }

    this.results.set(name, results);

    // Emit events
    this.emit('checkCompleted', { name, result });

    if (result.status !== HealthStatus.HEALTHY) {
      this.config.onCheckFailed?.(name, result);
      this.emit('checkFailed', { name, result });
    }
  }

  private updateConsecutiveCounters(name: string, status: HealthStatus): void {
    if (status === HealthStatus.HEALTHY) {
      this.consecutiveFailures.set(name, 0);
      const successes = (this.consecutiveSuccesses.get(name) || 0) + 1;
      this.consecutiveSuccesses.set(name, successes);
    } else {
      this.consecutiveSuccesses.set(name, 0);
      const failures = (this.consecutiveFailures.get(name) || 0) + 1;
      this.consecutiveFailures.set(name, failures);
    }
  }

  private scheduleCheck(name: string): void {
    const check = this.checks.get(name);
    if (!check) return;

    const timer = setTimeout(() => {
      this.executeCheck(check).catch(error => {
        this.emit('checkError', { name, error: error.message });
      });
    }, check.interval);

    this.timers.set(name, timer);
  }

  private updateSystemHealth(): void {
    const checks: Record<string, HealthCheckResult> = {};
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;
    let critical = 0;

    // Get latest results for each check
    for (const [name, results] of this.results) {
      if (results.length === 0) continue;

      const latestResult = results[results.length - 1];
      checks[name] = latestResult;

      switch (latestResult.status) {
        case HealthStatus.HEALTHY: healthy++; break;
        case HealthStatus.DEGRADED: degraded++; break;
        case HealthStatus.UNHEALTHY: unhealthy++; break;
        case HealthStatus.CRITICAL: critical++; break;
      }
    }

    // Determine overall system status
    const previousStatus = this.currentStatus;
    
    if (critical > 0) {
      this.currentStatus = HealthStatus.CRITICAL;
    } else if (unhealthy > 0) {
      this.currentStatus = HealthStatus.UNHEALTHY;
    } else if (degraded > 0) {
      this.currentStatus = HealthStatus.DEGRADED;
    } else {
      this.currentStatus = HealthStatus.HEALTHY;
    }

    const systemHealth: SystemHealth = {
      status: this.currentStatus,
      checks,
      summary: {
        total: this.checks.size,
        healthy,
        degraded,
        unhealthy,
        critical
      },
      lastUpdate: Date.now()
    };

    // Emit status change events
    if (previousStatus !== this.currentStatus) {
      this.config.onStatusChange?.(this.currentStatus, previousStatus);
      this.emit('statusChanged', { from: previousStatus, to: this.currentStatus });

      if (previousStatus !== HealthStatus.HEALTHY && this.currentStatus === HealthStatus.HEALTHY) {
        this.config.onSystemRecovered?.();
        this.emit('systemRecovered');
      }
    }

    this.emit('healthUpdated', systemHealth);
  }

  /**
   * Get current system health
   */
  getHealth(): SystemHealth {
    const checks: Record<string, HealthCheckResult> = {};
    let healthy = 0;
    let degraded = 0;
    let unhealthy = 0;
    let critical = 0;

    for (const [name, results] of this.results) {
      if (results.length === 0) continue;

      const latestResult = results[results.length - 1];
      checks[name] = latestResult;

      switch (latestResult.status) {
        case HealthStatus.HEALTHY: healthy++; break;
        case HealthStatus.DEGRADED: degraded++; break;
        case HealthStatus.UNHEALTHY: unhealthy++; break;
        case HealthStatus.CRITICAL: critical++; break;
      }
    }

    return {
      status: this.currentStatus,
      checks,
      summary: {
        total: this.checks.size,
        healthy,
        degraded,
        unhealthy,
        critical
      },
      lastUpdate: Date.now()
    };
  }

  /**
   * Get health history for a specific check
   */
  getCheckHistory(name: string, limit?: number): HealthCheckResult[] {
    const results = this.results.get(name) || [];
    return limit ? results.slice(-limit) : [...results];
  }

  /**
   * Get metrics for a specific check
   */
  getCheckMetrics(name: string): {
    successRate: number;
    averageResponseTime: number;
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    lastCheck: number;
  } | undefined {
    const results = this.results.get(name);
    if (!results || results.length === 0) return undefined;

    const successes = results.filter(r => r.status === HealthStatus.HEALTHY).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const lastCheck = results[results.length - 1].timestamp;

    return {
      successRate: successes / results.length,
      averageResponseTime: avgResponseTime,
      consecutiveFailures: this.consecutiveFailures.get(name) || 0,
      consecutiveSuccesses: this.consecutiveSuccesses.get(name) || 0,
      lastCheck
    };
  }

  /**
   * Shutdown health monitoring
   */
  shutdown(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.timers.clear();
    this.runningChecks.clear();
    this.removeAllListeners();
    
    this.emit('shutdown');
  }
}

/**
 * Predefined health checks for common services
 */
export const HealthChecks = {
  DATABASE: (connectionPool: any): HealthCheck => ({
    name: 'database',
    check: async () => {
      const startTime = Date.now();
      try {
        await connectionPool.query('SELECT 1');
        return {
          status: HealthStatus.HEALTHY,
          message: 'Database connection successful',
          timestamp: Date.now(),
          duration: Date.now() - startTime
        };
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: `Database connection failed: ${(error as Error).message}`,
          timestamp: Date.now(),
          duration: Date.now() - startTime
        };
      }
    },
    interval: 30000, // 30 seconds
    timeout: 5000, // 5 seconds
    retries: 3,
    critical: true,
    tags: ['database', 'persistence']
  }),

  HTTP_ENDPOINT: (url: string): HealthCheck => ({
    name: `http_${url.replace(/[^a-zA-Z0-9]/g, '_')}`,
    check: async () => {
      const startTime = Date.now();
      try {
        const response = await fetch(url, { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        
        const duration = Date.now() - startTime;
        
        if (response.ok) {
          return {
            status: HealthStatus.HEALTHY,
            message: `HTTP endpoint ${url} is responsive`,
            metrics: { 
              statusCode: response.status,
              responseTime: duration
            },
            timestamp: Date.now(),
            duration
          };
        } else {
          return {
            status: response.status >= 500 ? HealthStatus.UNHEALTHY : HealthStatus.DEGRADED,
            message: `HTTP endpoint ${url} returned ${response.status}`,
            metrics: { 
              statusCode: response.status,
              responseTime: duration
            },
            timestamp: Date.now(),
            duration
          };
        }
      } catch (error) {
        return {
          status: HealthStatus.UNHEALTHY,
          message: `HTTP endpoint ${url} failed: ${(error as Error).message}`,
          timestamp: Date.now(),
          duration: Date.now() - startTime
        };
      }
    },
    interval: 60000, // 1 minute
    timeout: 10000, // 10 seconds
    retries: 2,
    critical: false,
    tags: ['http', 'external']
  }),

  MEMORY_USAGE: (): HealthCheck => ({
    name: 'memory_usage',
    check: async () => {
      const usage = process.memoryUsage();
      const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const usagePercent = (usedMB / totalMB) * 100;

      let status: HealthStatus;
      let message: string;

      if (usagePercent > 90) {
        status = HealthStatus.CRITICAL;
        message = `Memory usage critical: ${usagePercent.toFixed(1)}%`;
      } else if (usagePercent > 80) {
        status = HealthStatus.UNHEALTHY;
        message = `Memory usage high: ${usagePercent.toFixed(1)}%`;
      } else if (usagePercent > 70) {
        status = HealthStatus.DEGRADED;
        message = `Memory usage elevated: ${usagePercent.toFixed(1)}%`;
      } else {
        status = HealthStatus.HEALTHY;
        message = `Memory usage normal: ${usagePercent.toFixed(1)}%`;
      }

      return {
        status,
        message,
        metrics: {
          heapUsed: usedMB,
          heapTotal: totalMB,
          usagePercent,
          external: Math.round(usage.external / 1024 / 1024)
        },
        timestamp: Date.now(),
        duration: 0
      };
    },
    interval: 30000, // 30 seconds
    timeout: 1000, // 1 second
    retries: 1,
    critical: true,
    tags: ['system', 'memory']
  })
};