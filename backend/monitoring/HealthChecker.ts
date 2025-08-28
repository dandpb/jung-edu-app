import { EventEmitter } from 'events';
import { HealthStatus, HealthCheck, MonitoringConfig } from './types';

interface HealthCheckFunction {
  (): Promise<HealthCheck> | HealthCheck;
}

export class HealthChecker extends EventEmitter {
  private config: MonitoringConfig['health'];
  private checks: Map<string, HealthCheckFunction> = new Map();
  private lastStatus: HealthStatus | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  constructor(config: MonitoringConfig['health']) {
    super();
    this.config = config;
    this.registerDefaultChecks();
    
    if (config.enabled) {
      this.startPeriodicChecks();
    }
  }

  private registerDefaultChecks(): void {
    // Memory usage check
    this.registerCheck('memory', async () => {
      const used = process.memoryUsage();
      const memoryUsageMB = Math.round(used.rss / 1024 / 1024);
      const threshold = 1000; // 1GB threshold
      
      return {
        name: 'memory',
        status: memoryUsageMB > threshold ? 'warn' : 'pass',
        message: memoryUsageMB > threshold 
          ? `High memory usage: ${memoryUsageMB}MB` 
          : `Memory usage normal: ${memoryUsageMB}MB`,
        duration: 0,
        output: { memoryUsageMB, threshold },
        tags: ['system', 'memory'],
      };
    });

    // CPU usage check (simplified)
    this.registerCheck('cpu', async () => {
      const cpuUsage = process.cpuUsage();
      const usage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      
      return {
        name: 'cpu',
        status: 'pass',
        message: `CPU usage: ${usage.toFixed(2)}s`,
        duration: 0,
        output: { cpuUsage: usage },
        tags: ['system', 'cpu'],
      };
    });

    // Disk space check (if available)
    this.registerCheck('disk', async () => {
      try {
        const fs = require('fs');
        const stats = await fs.promises.statSync('.');
        
        return {
          name: 'disk',
          status: 'pass',
          message: 'Disk accessible',
          duration: 0,
          output: { accessible: true },
          tags: ['system', 'disk'],
        };
      } catch (error) {
        return {
          name: 'disk',
          status: 'fail',
          message: `Disk check failed: ${error}`,
          duration: 0,
          output: { error: error.toString() },
          tags: ['system', 'disk'],
        };
      }
    });

    // Process uptime check
    this.registerCheck('uptime', async () => {
      const uptime = Date.now() - this.startTime;
      const uptimeSeconds = Math.floor(uptime / 1000);
      
      return {
        name: 'uptime',
        status: 'pass',
        message: `Uptime: ${uptimeSeconds}s`,
        duration: 0,
        output: { uptime: uptimeSeconds },
        tags: ['system', 'uptime'],
      };
    });

    // Event loop lag check
    this.registerCheck('eventloop', async () => {
      return new Promise<HealthCheck>((resolve) => {
        const start = process.hrtime.bigint();
        setImmediate(() => {
          const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
          const threshold = 10; // 10ms threshold
          
          resolve({
            name: 'eventloop',
            status: lag > threshold ? 'warn' : 'pass',
            message: lag > threshold 
              ? `High event loop lag: ${lag.toFixed(2)}ms` 
              : `Event loop lag normal: ${lag.toFixed(2)}ms`,
            duration: lag,
            output: { lag, threshold },
            tags: ['system', 'performance'],
          });
        });
      });
    });
  }

  // Register a health check
  registerCheck(name: string, checkFunction: HealthCheckFunction): void {
    this.checks.set(name, checkFunction);
    this.emit('check_registered', { name });
  }

  // Unregister a health check
  unregisterCheck(name: string): boolean {
    const removed = this.checks.delete(name);
    if (removed) {
      this.emit('check_unregistered', { name });
    }
    return removed;
  }

  // Run a specific health check
  async runCheck(name: string): Promise<HealthCheck | null> {
    const checkFunction = this.checks.get(name);
    if (!checkFunction) {
      return null;
    }

    const startTime = Date.now();
    
    try {
      let result = await Promise.race([
        checkFunction(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
        ),
      ]);

      // Ensure result is properly formatted
      if (typeof result === 'object' && result !== null) {
        result.duration = Date.now() - startTime;
        result.name = result.name || name;
      }

      this.emit('check_completed', { name, result });
      return result as HealthCheck;
    } catch (error) {
      const failedCheck: HealthCheck = {
        name,
        status: 'fail',
        message: `Check failed: ${error}`,
        duration: Date.now() - startTime,
        output: { error: error.toString() },
        tags: ['failed'],
      };

      this.emit('check_failed', { name, error, result: failedCheck });
      return failedCheck;
    }
  }

  // Run all health checks
  async runAllChecks(): Promise<HealthStatus> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];

    // Run checks in parallel
    const checkPromises = Array.from(this.checks.keys()).map(name => this.runCheck(name));
    const results = await Promise.allSettled(checkPromises);

    // Process results
    results.forEach((result, index) => {
      const name = Array.from(this.checks.keys())[index];
      
      if (result.status === 'fulfilled' && result.value) {
        checks.push(result.value);
      } else {
        checks.push({
          name,
          status: 'fail',
          message: 'Check execution failed',
          duration: 0,
          output: { error: result.status === 'rejected' ? result.reason : 'Unknown error' },
        });
      }
    });

    // Determine overall status
    const failedChecks = checks.filter(check => check.status === 'fail');
    const warnChecks = checks.filter(check => check.status === 'warn');
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks.length > 0) {
      status = failedChecks.length === checks.length ? 'unhealthy' : 'degraded';
    } else if (warnChecks.length > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    const healthStatus: HealthStatus = {
      status,
      checks,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
    };

    this.lastStatus = healthStatus;
    this.emit('health_check_completed', healthStatus);

    return healthStatus;
  }

  // Get last health status
  getLastStatus(): HealthStatus | null {
    return this.lastStatus;
  }

  // Start periodic health checks
  startPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(async () => {
      try {
        await this.runAllChecks();
      } catch (error) {
        this.emit('periodic_check_error', error);
      }
    }, this.config.interval);

    this.emit('periodic_checks_started', { interval: this.config.interval });
  }

  // Stop periodic health checks
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.emit('periodic_checks_stopped');
    }
  }

  // Database connection health check
  registerDatabaseCheck(name: string, connectionTest: () => Promise<boolean>): void {
    this.registerCheck(`database_${name}`, async () => {
      const startTime = Date.now();
      
      try {
        const connected = await connectionTest();
        const duration = Date.now() - startTime;
        
        return {
          name: `database_${name}`,
          status: connected ? 'pass' : 'fail',
          message: connected ? `Database ${name} connected` : `Database ${name} connection failed`,
          duration,
          output: { connected, connectionTime: duration },
          tags: ['database', 'connectivity'],
        };
      } catch (error) {
        return {
          name: `database_${name}`,
          status: 'fail',
          message: `Database ${name} check error: ${error}`,
          duration: Date.now() - startTime,
          output: { error: error.toString() },
          tags: ['database', 'error'],
        };
      }
    });
  }

  // External service health check
  registerServiceCheck(name: string, url: string, timeout: number = 5000): void {
    this.registerCheck(`service_${name}`, async () => {
      const startTime = Date.now();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
          signal: controller.signal,
          method: 'HEAD',
        });
        
        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;
        
        return {
          name: `service_${name}`,
          status: response.ok ? 'pass' : 'fail',
          message: `Service ${name} ${response.ok ? 'available' : 'unavailable'} (${response.status})`,
          duration,
          output: { 
            status: response.status, 
            statusText: response.statusText,
            responseTime: duration,
          },
          tags: ['external', 'service'],
        };
      } catch (error) {
        return {
          name: `service_${name}`,
          status: 'fail',
          message: `Service ${name} check failed: ${error}`,
          duration: Date.now() - startTime,
          output: { error: error.toString() },
          tags: ['external', 'service', 'error'],
        };
      }
    });
  }

  // Cache health check
  registerCacheCheck(name: string, cacheTest: () => Promise<boolean>): void {
    this.registerCheck(`cache_${name}`, async () => {
      const startTime = Date.now();
      
      try {
        const available = await cacheTest();
        const duration = Date.now() - startTime;
        
        return {
          name: `cache_${name}`,
          status: available ? 'pass' : 'fail',
          message: available ? `Cache ${name} available` : `Cache ${name} unavailable`,
          duration,
          output: { available, responseTime: duration },
          tags: ['cache', 'performance'],
        };
      } catch (error) {
        return {
          name: `cache_${name}`,
          status: 'fail',
          message: `Cache ${name} check error: ${error}`,
          duration: Date.now() - startTime,
          output: { error: error.toString() },
          tags: ['cache', 'error'],
        };
      }
    });
  }

  // Get health check endpoint middleware
  getHealthEndpointMiddleware() {
    return async (req: any, res: any) => {
      try {
        const health = await this.runAllChecks();
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;
        
        res.status(statusCode).json(health);
      } catch (error) {
        res.status(500).json({
          status: 'unhealthy',
          error: 'Health check execution failed',
          message: error.toString(),
          timestamp: new Date(),
        });
      }
    };
  }

  // Get readiness check (simplified health check)
  getReadinessCheck() {
    return async (req: any, res: any) => {
      const criticalChecks = ['memory', 'disk', 'uptime'];
      const results: HealthCheck[] = [];
      
      for (const checkName of criticalChecks) {
        const result = await this.runCheck(checkName);
        if (result) {
          results.push(result);
        }
      }
      
      const failed = results.filter(check => check.status === 'fail');
      const ready = failed.length === 0;
      
      res.status(ready ? 200 : 503).json({
        ready,
        checks: results,
        timestamp: new Date(),
      });
    };
  }

  // Get liveness check (minimal check)
  getLivenessCheck() {
    return (req: any, res: any) => {
      res.status(200).json({
        alive: true,
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
      });
    };
  }

  // Cleanup
  destroy(): void {
    this.stopPeriodicChecks();
    this.checks.clear();
    this.removeAllListeners();
  }
}