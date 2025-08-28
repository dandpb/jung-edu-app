import { SystemMetrics, PerformanceMetrics, StorageMetrics } from '../types/monitoring';
import { EventEmitter } from 'events';
import * as os from 'os';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface MetricsConfig {
  enabled: boolean;
  collection: {
    system: boolean;
    application: boolean;
    custom: boolean;
  };
  retention: number;
}

export class MetricsCollector extends EventEmitter {
  private config: MetricsConfig;
  private customMetrics: Map<string, () => Promise<number>>;
  private isCollecting: boolean = false;
  private collectionInterval: NodeJS.Timeout | null = null;

  constructor(config: MetricsConfig) {
    super();
    this.config = config;
    this.customMetrics = new Map();
  }

  public async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();

      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = process.hrtime(startTime);
        
        const totalTime = currentTime[0] * 1000000 + currentTime[1] / 1000;
        const totalCpuTime = currentUsage.user + currentUsage.system;
        
        const cpuPercent = (totalCpuTime / totalTime) * 100;
        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  public async getMemoryUsage(): Promise<{ total: number; used: number; free: number; available?: number }> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Try to get more detailed memory info on Linux
    let available = freeMemory;
    try {
      if (process.platform === 'linux') {
        const memInfo = await fs.readFile('/proc/meminfo', 'utf8');
        const availableMatch = memInfo.match(/MemAvailable:\s+(\d+)\s+kB/);
        if (availableMatch) {
          available = parseInt(availableMatch[1]) * 1024; // Convert KB to bytes
        }
      }
    } catch (error) {
      // Fallback to basic calculation if /proc/meminfo is not available
    }

    return {
      total: totalMemory,
      used: usedMemory,
      free: freeMemory,
      available
    };
  }

  public async getDiskUsage(path: string = '/'): Promise<{ total: number; used: number; free: number; path: string }> {
    try {
      let command: string;
      
      if (process.platform === 'win32') {
        // Windows
        const drive = path.charAt(0).toUpperCase();
        command = `wmic logicaldisk where "DeviceID='${drive}:'" get Size,FreeSpace /format:csv`;
      } else {
        // Unix-like systems
        command = `df -B1 "${path}"`;
      }

      const { stdout } = await execAsync(command);
      
      if (process.platform === 'win32') {
        // Parse Windows output
        const lines = stdout.split('\n').filter(line => line.includes(','));
        if (lines.length > 0) {
          const parts = lines[0].split(',');
          const free = parseInt(parts[1]);
          const total = parseInt(parts[2]);
          return {
            total,
            used: total - free,
            free,
            path
          };
        }
      } else {
        // Parse Unix output
        const lines = stdout.split('\n');
        if (lines.length > 1) {
          const parts = lines[1].split(/\s+/);
          const total = parseInt(parts[1]);
          const used = parseInt(parts[2]);
          const available = parseInt(parts[3]);
          
          return {
            total,
            used,
            free: available,
            path
          };
        }
      }
    } catch (error) {
      console.warn('Failed to get disk usage:', error);
    }

    // Fallback values
    return {
      total: 0,
      used: 0,
      free: 0,
      path
    };
  }

  public async getNetworkLatency(host: string = '8.8.8.8'): Promise<number> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Simple ping simulation - in production, use actual ping or network request
      const timeout = Math.random() * 50 + 10; // 10-60ms simulation
      
      setTimeout(() => {
        resolve(timeout);
      }, timeout);
    });
  }

  public async getLoadAverage(): Promise<number[]> {
    const loadAvg = os.loadavg();
    return loadAvg;
  }

  public async getNetworkStats(): Promise<{ bytesIn: number; bytesOut: number; packetsIn?: number; packetsOut?: number }> {
    try {
      if (process.platform === 'linux') {
        const netDev = await fs.readFile('/proc/net/dev', 'utf8');
        const lines = netDev.split('\n');
        
        let totalBytesIn = 0;
        let totalBytesOut = 0;
        let totalPacketsIn = 0;
        let totalPacketsOut = 0;

        for (const line of lines) {
          if (line.includes(':') && !line.includes('lo:')) { // Skip loopback
            const parts = line.split(/\s+/);
            if (parts.length >= 10) {
              totalBytesIn += parseInt(parts[1]) || 0;
              totalPacketsIn += parseInt(parts[2]) || 0;
              totalBytesOut += parseInt(parts[9]) || 0;
              totalPacketsOut += parseInt(parts[10]) || 0;
            }
          }
        }

        return {
          bytesIn: totalBytesIn,
          bytesOut: totalBytesOut,
          packetsIn: totalPacketsIn,
          packetsOut: totalPacketsOut
        };
      }
    } catch (error) {
      console.warn('Failed to get network stats:', error);
    }

    // Fallback for non-Linux or error case
    return {
      bytesIn: 0,
      bytesOut: 0
    };
  }

  public addCustomMetric(name: string, collector: () => Promise<number>): void {
    this.customMetrics.set(name, collector);
    this.emit('customMetricAdded', { name });
  }

  public removeCustomMetric(name: string): boolean {
    const removed = this.customMetrics.delete(name);
    if (removed) {
      this.emit('customMetricRemoved', { name });
    }
    return removed;
  }

  public async collectCustomMetrics(): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    
    const promises = Array.from(this.customMetrics.entries()).map(async ([name, collector]) => {
      try {
        const value = await collector();
        results[name] = value;
      } catch (error) {
        console.warn(`Failed to collect custom metric ${name}:`, error);
        results[name] = 0;
      }
    });

    await Promise.all(promises);
    return results;
  }

  public async getAllMetrics(): Promise<SystemMetrics> {
    const [
      cpuUsage,
      memoryUsage,
      diskUsage,
      networkLatency,
      networkStats,
      customMetrics
    ] = await Promise.all([
      this.getCpuUsage(),
      this.getMemoryUsage(),
      this.getDiskUsage(),
      this.getNetworkLatency(),
      this.getNetworkStats(),
      this.config.collection.custom ? this.collectCustomMetrics() : Promise.resolve({})
    ]);

    const loadAverage = this.getLoadAverage();

    return {
      timestamp: new Date(),
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        loadAverage: await loadAverage
      },
      memory: memoryUsage,
      disk: diskUsage,
      network: {
        latency: networkLatency,
        bytesIn: networkStats.bytesIn,
        bytesOut: networkStats.bytesOut,
        packetsIn: networkStats.packetsIn,
        packetsOut: networkStats.packetsOut
      },
      custom: Object.keys(customMetrics).length > 0 ? customMetrics : undefined
    };
  }

  public startCollection(interval: number = 30000): void {
    if (this.isCollecting) {
      throw new Error('Metrics collection already running');
    }

    this.isCollecting = true;
    this.emit('collectionStarted');

    // Collect initial metrics
    this.collectAndEmit();

    // Schedule periodic collection
    this.collectionInterval = setInterval(() => {
      this.collectAndEmit();
    }, interval);
  }

  public stopCollection(): void {
    if (!this.isCollecting) {
      return;
    }

    this.isCollecting = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    this.emit('collectionStopped');
  }

  private async collectAndEmit(): Promise<void> {
    try {
      const metrics = await this.getAllMetrics();
      this.emit('metricsCollected', metrics);
    } catch (error) {
      this.emit('collectionError', error);
    }
  }

  public async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // This would typically integrate with application performance monitoring
    // For now, return simulated data
    return {
      responseTime: Math.random() * 200 + 50, // 50-250ms
      throughput: Math.random() * 1000 + 500, // 500-1500 req/s
      errorRate: Math.random() * 5, // 0-5%
      availability: 99.0 + Math.random() * 1, // 99-100%
      customMetrics: {
        activeConnections: Math.floor(Math.random() * 100 + 50),
        queueDepth: Math.floor(Math.random() * 20),
        cacheHitRatio: Math.random() * 20 + 80 // 80-100%
      }
    };
  }

  public async getStorageMetrics(): Promise<StorageMetrics> {
    // This would typically integrate with database/storage monitoring
    // For now, return simulated data
    return {
      reads: Math.floor(Math.random() * 1000 + 100),
      writes: Math.floor(Math.random() * 500 + 50),
      errors: Math.floor(Math.random() * 5),
      latency: Math.random() * 10 + 1, // 1-11ms
      cacheHits: Math.floor(Math.random() * 800 + 200),
      cacheMisses: Math.floor(Math.random() * 100 + 20)
    };
  }

  public getCollectionStatus(): { isCollecting: boolean; customMetricsCount: number; config: MetricsConfig } {
    return {
      isCollecting: this.isCollecting,
      customMetricsCount: this.customMetrics.size,
      config: this.config
    };
  }
}