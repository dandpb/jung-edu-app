import { EventEmitter } from 'events';
import { SystemMetrics, HealthCheckResult, MonitoringConfig } from '../types/monitoring';
import { MetricsCollector } from '../metrics/collector';
import { StorageManager } from '../storage/memory-store';

export class SystemHealthMonitor extends EventEmitter {
  private metricsCollector: MetricsCollector;
  private storageManager: StorageManager;
  private config: MonitoringConfig;
  private healthChecks: Map<string, () => Promise<HealthCheckResult>>;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.metricsCollector = new MetricsCollector(config.metrics);
    this.storageManager = new StorageManager(config.storage);
    this.healthChecks = new Map();
    
    this.initializeDefaultHealthChecks();
  }

  private initializeDefaultHealthChecks(): void {
    // CPU Usage Check
    this.addHealthCheck('cpu', async () => {
      const cpuUsage = await this.metricsCollector.getCpuUsage();
      return {
        service: 'cpu',
        status: cpuUsage < this.config.thresholds.cpu.warning ? 'healthy' : 
                cpuUsage < this.config.thresholds.cpu.critical ? 'warning' : 'critical',
        value: cpuUsage,
        threshold: this.config.thresholds.cpu,
        timestamp: new Date(),
        message: `CPU usage: ${cpuUsage.toFixed(2)}%`
      };
    });

    // Memory Usage Check
    this.addHealthCheck('memory', async () => {
      const memoryUsage = await this.metricsCollector.getMemoryUsage();
      const usagePercent = (memoryUsage.used / memoryUsage.total) * 100;
      return {
        service: 'memory',
        status: usagePercent < this.config.thresholds.memory.warning ? 'healthy' :
                usagePercent < this.config.thresholds.memory.critical ? 'warning' : 'critical',
        value: usagePercent,
        threshold: this.config.thresholds.memory,
        timestamp: new Date(),
        message: `Memory usage: ${usagePercent.toFixed(2)}% (${this.formatBytes(memoryUsage.used)}/${this.formatBytes(memoryUsage.total)})`
      };
    });

    // Disk Usage Check
    this.addHealthCheck('disk', async () => {
      const diskUsage = await this.metricsCollector.getDiskUsage();
      const usagePercent = (diskUsage.used / diskUsage.total) * 100;
      return {
        service: 'disk',
        status: usagePercent < this.config.thresholds.disk.warning ? 'healthy' :
                usagePercent < this.config.thresholds.disk.critical ? 'warning' : 'critical',
        value: usagePercent,
        threshold: this.config.thresholds.disk,
        timestamp: new Date(),
        message: `Disk usage: ${usagePercent.toFixed(2)}% (${this.formatBytes(diskUsage.used)}/${this.formatBytes(diskUsage.total)})`
      };
    });

    // Network Latency Check
    this.addHealthCheck('network', async () => {
      const latency = await this.metricsCollector.getNetworkLatency();
      return {
        service: 'network',
        status: latency < this.config.thresholds.network.warning ? 'healthy' :
                latency < this.config.thresholds.network.critical ? 'warning' : 'critical',
        value: latency,
        threshold: this.config.thresholds.network,
        timestamp: new Date(),
        message: `Network latency: ${latency}ms`
      };
    });
  }

  public addHealthCheck(name: string, checkFunction: () => Promise<HealthCheckResult>): void {
    this.healthChecks.set(name, checkFunction);
  }

  public removeHealthCheck(name: string): boolean {
    return this.healthChecks.delete(name);
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Health monitor is already running');
    }

    this.isRunning = true;
    this.emit('started');
    
    // Initial health check
    await this.performHealthChecks();
    
    // Schedule periodic health checks
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthChecks();
      } catch (error) {
        this.emit('error', error);
      }
    }, this.config.checkInterval);
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.emit('stopped');
  }

  private async performHealthChecks(): Promise<void> {
    const results: HealthCheckResult[] = [];
    const promises: Promise<HealthCheckResult>[] = [];

    // Execute all health checks in parallel
    for (const [name, checkFunction] of this.healthChecks) {
      promises.push(
        checkFunction().catch(error => ({
          service: name,
          status: 'critical' as const,
          value: 0,
          threshold: { warning: 0, critical: 0 },
          timestamp: new Date(),
          message: `Health check failed: ${error.message}`,
          error: error.message
        }))
      );
    }

    const checkResults = await Promise.all(promises);
    results.push(...checkResults);

    // Store results in memory for analysis
    await this.storageManager.storeHealthResults(results);

    // Emit events based on results
    for (const result of results) {
      if (result.status === 'critical') {
        this.emit('critical', result);
      } else if (result.status === 'warning') {
        this.emit('warning', result);
      }
    }

    // Emit overall health status
    this.emit('healthCheck', {
      timestamp: new Date(),
      results,
      overallStatus: this.calculateOverallStatus(results),
      summary: this.generateHealthSummary(results)
    });
  }

  private calculateOverallStatus(results: HealthCheckResult[]): 'healthy' | 'warning' | 'critical' {
    if (results.some(r => r.status === 'critical')) {
      return 'critical';
    }
    if (results.some(r => r.status === 'warning')) {
      return 'warning';
    }
    return 'healthy';
  }

  private generateHealthSummary(results: HealthCheckResult[]): string {
    const healthy = results.filter(r => r.status === 'healthy').length;
    const warning = results.filter(r => r.status === 'warning').length;
    const critical = results.filter(r => r.status === 'critical').length;
    
    return `${healthy} healthy, ${warning} warning, ${critical} critical`;
  }

  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  public getStatus(): { isRunning: boolean; checksCount: number; config: MonitoringConfig } {
    return {
      isRunning: this.isRunning,
      checksCount: this.healthChecks.size,
      config: this.config
    };
  }

  public async getLatestMetrics(): Promise<SystemMetrics> {
    return await this.metricsCollector.getAllMetrics();
  }

  public async getHealthHistory(timeRange: { start: Date; end: Date }): Promise<HealthCheckResult[]> {
    return await this.storageManager.getHealthHistory(timeRange);
  }
}