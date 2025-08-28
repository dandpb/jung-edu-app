/**
 * Performance Monitoring Utilities for Tests
 * Lightweight monitoring and alerting system for performance tests
 */

import { performance } from 'perf_hooks';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// Performance Monitor Configuration
// ============================================================================

interface PerformanceMonitorConfig {
  enableMemoryMonitoring: boolean;
  enableCPUMonitoring: boolean;
  enableGCMonitoring: boolean;
  samplingInterval: number; // milliseconds
  alertThresholds: AlertThresholds;
  retentionPeriod: number; // milliseconds
  maxSamples: number;
  autoCleanup: boolean;
}

interface AlertThresholds {
  memoryUsage: {
    warning: number; // MB
    critical: number; // MB
  };
  memoryGrowthRate: {
    warning: number; // MB per minute
    critical: number; // MB per minute
  };
  responseTime: {
    warning: number; // ms
    critical: number; // ms
  };
  errorRate: {
    warning: number; // percentage
    critical: number; // percentage
  };
  gcFrequency: {
    warning: number; // GC events per minute
    critical: number; // GC events per minute
  };
}

interface PerformanceSample {
  timestamp: number;
  metrics: {
    memory: MemoryMetrics;
    performance: PerformanceMetrics;
    gc?: GCMetrics;
  };
  alerts: Alert[];
}

interface MemoryMetrics {
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  rssMB: number;
  arrayBuffersMB: number;
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorCount: number;
  successCount: number;
  concurrentOperations: number;
}

interface GCMetrics {
  collections: number;
  pauseTime: number; // ms
  reclaimedMB: number;
}

interface Alert {
  type: 'memory' | 'performance' | 'gc' | 'error';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

interface MonitoringReport {
  testName: string;
  startTime: number;
  endTime: number;
  duration: number;
  totalSamples: number;
  alerts: Alert[];
  summary: PerformanceSummary;
  recommendations: string[];
  rawData: PerformanceSample[];
}

interface PerformanceSummary {
  averageMemoryMB: number;
  peakMemoryMB: number;
  memoryGrowthMB: number;
  averageResponseTimeMs: number;
  maxResponseTimeMs: number;
  totalOperations: number;
  errorRate: number;
  gcEvents: number;
  alertCounts: {
    warnings: number;
    critical: number;
  };
}

// ============================================================================
// Performance Monitor Class
// ============================================================================

export class PerformanceMonitor extends EventEmitter {
  private config: PerformanceMonitorConfig;
  private samples: PerformanceSample[] = [];
  private alerts: Alert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private testName: string = '';
  private operationCounts = {
    success: 0,
    error: 0,
    total: 0
  };
  private responseTimeMeasurements: number[] = [];
  private isMonitoring = false;

  constructor(config?: Partial<PerformanceMonitorConfig>) {
    super();
    this.config = {
      enableMemoryMonitoring: true,
      enableCPUMonitoring: false, // CPU monitoring can be resource-intensive
      enableGCMonitoring: true,
      samplingInterval: 5000, // 5 seconds
      alertThresholds: {
        memoryUsage: { warning: 300, critical: 400 },
        memoryGrowthRate: { warning: 50, critical: 100 },
        responseTime: { warning: 1000, critical: 2000 },
        errorRate: { warning: 5, critical: 10 },
        gcFrequency: { warning: 20, critical: 40 }
      },
      retentionPeriod: 300000, // 5 minutes
      maxSamples: 100,
      autoCleanup: true,
      ...config
    };
  }

  /**
   * Start monitoring performance metrics
   */
  startMonitoring(testName: string): void {
    if (this.isMonitoring) {
      console.warn('Performance monitoring already active');
      return;
    }

    this.testName = testName;
    this.startTime = performance.now();
    this.isMonitoring = true;
    this.samples = [];
    this.alerts = [];
    this.operationCounts = { success: 0, error: 0, total: 0 };
    this.responseTimeMeasurements = [];

    console.log(`📊 Starting performance monitoring for: ${testName}`);

    // Start periodic sampling
    this.monitoringInterval = setInterval(() => {
      this.collectSample();
    }, this.config.samplingInterval);

    // Initial sample
    this.collectSample();
  }

  /**
   * Stop monitoring and generate report
   */
  stopMonitoring(): MonitoringReport {
    if (!this.isMonitoring) {
      throw new Error('Performance monitoring not active');
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    // Final sample
    this.collectSample();

    const endTime = performance.now();
    const report = this.generateReport(endTime);

    this.isMonitoring = false;
    console.log(`📊 Performance monitoring stopped for: ${this.testName}`);

    // Auto cleanup if enabled
    if (this.config.autoCleanup) {
      this.cleanup();
    }

    return report;
  }

  /**
   * Record an operation result
   */
  recordOperation(success: boolean, responseTime?: number): void {
    if (!this.isMonitoring) return;

    this.operationCounts.total++;
    if (success) {
      this.operationCounts.success++;
    } else {
      this.operationCounts.error++;
    }

    if (responseTime !== undefined) {
      this.responseTimeMeasurements.push(responseTime);
      
      // Keep only recent measurements to prevent memory bloat
      if (this.responseTimeMeasurements.length > 1000) {
        this.responseTimeMeasurements = this.responseTimeMeasurements.slice(-500);
      }

      // Check response time alerts
      this.checkResponseTimeAlert(responseTime);
    }
  }

  /**
   * Record multiple operations efficiently
   */
  recordBatchOperations(results: Array<{ success: boolean; responseTime?: number }>): void {
    if (!this.isMonitoring) return;

    results.forEach(result => {
      this.recordOperation(result.success, result.responseTime);
    });
  }

  /**
   * Get current performance snapshot
   */
  getCurrentSnapshot(): PerformanceSample | null {
    if (!this.isMonitoring || this.samples.length === 0) {
      return null;
    }

    return this.samples[this.samples.length - 1];
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(severity?: 'warning' | 'critical'): Alert[] {
    const recent = performance.now() - 30000; // Last 30 seconds
    let alerts = this.alerts.filter(alert => alert.timestamp > recent);
    
    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }
    
    return alerts;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private collectSample(): void {
    try {
      const timestamp = performance.now();
      
      // Collect metrics
      const memoryMetrics = this.collectMemoryMetrics();
      const performanceMetrics = this.collectPerformanceMetrics();
      const gcMetrics = this.config.enableGCMonitoring ? this.collectGCMetrics() : undefined;

      // Create sample
      const sample: PerformanceSample = {
        timestamp,
        metrics: {
          memory: memoryMetrics,
          performance: performanceMetrics,
          gc: gcMetrics
        },
        alerts: []
      };

      // Check for alerts
      const newAlerts = this.checkAlerts(sample.metrics);
      sample.alerts = newAlerts;
      this.alerts.push(...newAlerts);

      // Add sample
      this.samples.push(sample);

      // Limit sample count to prevent memory issues
      if (this.samples.length > this.config.maxSamples) {
        this.samples = this.samples.slice(-this.config.maxSamples * 0.8); // Keep 80%
      }

      // Emit alerts
      newAlerts.forEach(alert => {
        this.emit('alert', alert);
        if (alert.severity === 'critical') {
          console.warn(`🚨 Critical Alert: ${alert.message}`);
        } else {
          console.log(`⚠️  Warning: ${alert.message}`);
        }
      });

    } catch (error) {
      console.error('Error collecting performance sample:', error);
    }
  }

  private collectMemoryMetrics(): MemoryMetrics {
    const memUsage = process.memoryUsage();
    
    return {
      heapUsedMB: memUsage.heapUsed / 1024 / 1024,
      heapTotalMB: memUsage.heapTotal / 1024 / 1024,
      externalMB: memUsage.external / 1024 / 1024,
      rssMB: memUsage.rss / 1024 / 1024,
      arrayBuffersMB: memUsage.arrayBuffers / 1024 / 1024
    };
  }

  private collectPerformanceMetrics(): PerformanceMetrics {
    const currentTime = performance.now();
    const timeSpanMinutes = (currentTime - this.startTime) / 60000;
    
    const avgResponseTime = this.responseTimeMeasurements.length > 0
      ? this.responseTimeMeasurements.reduce((sum, time) => sum + time, 0) / this.responseTimeMeasurements.length
      : 0;

    return {
      responseTime: avgResponseTime,
      throughput: timeSpanMinutes > 0 ? this.operationCounts.total / timeSpanMinutes : 0,
      errorCount: this.operationCounts.error,
      successCount: this.operationCounts.success,
      concurrentOperations: 1 // Simplified for now
    };
  }

  private collectGCMetrics(): GCMetrics {
    // Note: Actual GC metrics would require additional instrumentation
    // This is a simplified implementation
    return {
      collections: 0,
      pauseTime: 0,
      reclaimedMB: 0
    };
  }

  private checkAlerts(metrics: any): Alert[] {
    const alerts: Alert[] = [];
    const timestamp = performance.now();
    
    // Memory usage alerts
    if (metrics.memory.heapUsedMB >= this.config.alertThresholds.memoryUsage.critical) {
      alerts.push({
        type: 'memory',
        severity: 'critical',
        message: `Critical memory usage: ${metrics.memory.heapUsedMB.toFixed(2)}MB`,
        value: metrics.memory.heapUsedMB,
        threshold: this.config.alertThresholds.memoryUsage.critical,
        timestamp
      });
    } else if (metrics.memory.heapUsedMB >= this.config.alertThresholds.memoryUsage.warning) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage: ${metrics.memory.heapUsedMB.toFixed(2)}MB`,
        value: metrics.memory.heapUsedMB,
        threshold: this.config.alertThresholds.memoryUsage.warning,
        timestamp
      });
    }

    // Memory growth rate alerts
    if (this.samples.length >= 2) {
      const memoryGrowthRate = this.calculateMemoryGrowthRate();
      if (memoryGrowthRate >= this.config.alertThresholds.memoryGrowthRate.critical) {
        alerts.push({
          type: 'memory',
          severity: 'critical',
          message: `Critical memory growth rate: ${memoryGrowthRate.toFixed(2)}MB/min`,
          value: memoryGrowthRate,
          threshold: this.config.alertThresholds.memoryGrowthRate.critical,
          timestamp
        });
      } else if (memoryGrowthRate >= this.config.alertThresholds.memoryGrowthRate.warning) {
        alerts.push({
          type: 'memory',
          severity: 'warning',
          message: `High memory growth rate: ${memoryGrowthRate.toFixed(2)}MB/min`,
          value: memoryGrowthRate,
          threshold: this.config.alertThresholds.memoryGrowthRate.warning,
          timestamp
        });
      }
    }

    // Error rate alerts
    const errorRate = this.calculateErrorRate();
    if (errorRate >= this.config.alertThresholds.errorRate.critical) {
      alerts.push({
        type: 'error',
        severity: 'critical',
        message: `Critical error rate: ${errorRate.toFixed(2)}%`,
        value: errorRate,
        threshold: this.config.alertThresholds.errorRate.critical,
        timestamp
      });
    } else if (errorRate >= this.config.alertThresholds.errorRate.warning) {
      alerts.push({
        type: 'error',
        severity: 'warning',
        message: `High error rate: ${errorRate.toFixed(2)}%`,
        value: errorRate,
        threshold: this.config.alertThresholds.errorRate.warning,
        timestamp
      });
    }

    return alerts;
  }

  private checkResponseTimeAlert(responseTime: number): void {
    const timestamp = performance.now();
    
    if (responseTime >= this.config.alertThresholds.responseTime.critical) {
      const alert: Alert = {
        type: 'performance',
        severity: 'critical',
        message: `Critical response time: ${responseTime.toFixed(2)}ms`,
        value: responseTime,
        threshold: this.config.alertThresholds.responseTime.critical,
        timestamp
      };
      
      this.alerts.push(alert);
      this.emit('alert', alert);
      console.warn(`🚨 ${alert.message}`);
    } else if (responseTime >= this.config.alertThresholds.responseTime.warning) {
      const alert: Alert = {
        type: 'performance',
        severity: 'warning',
        message: `Slow response time: ${responseTime.toFixed(2)}ms`,
        value: responseTime,
        threshold: this.config.alertThresholds.responseTime.warning,
        timestamp
      };
      
      this.alerts.push(alert);
      this.emit('alert', alert);
    }
  }

  private calculateMemoryGrowthRate(): number {
    if (this.samples.length < 2) return 0;

    const recent = this.samples.slice(-5); // Last 5 samples
    if (recent.length < 2) return 0;

    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const memoryDiff = last.metrics.memory.heapUsedMB - first.metrics.memory.heapUsedMB;
    const timeDiff = (last.timestamp - first.timestamp) / 60000; // minutes

    return timeDiff > 0 ? memoryDiff / timeDiff : 0;
  }

  private calculateErrorRate(): number {
    if (this.operationCounts.total === 0) return 0;
    return (this.operationCounts.error / this.operationCounts.total) * 100;
  }

  private generateReport(endTime: number): MonitoringReport {
    const duration = endTime - this.startTime;
    const summary = this.generateSummary();

    return {
      testName: this.testName,
      startTime: this.startTime,
      endTime,
      duration,
      totalSamples: this.samples.length,
      alerts: [...this.alerts],
      summary,
      recommendations: this.generateRecommendations(summary),
      rawData: this.samples.slice() // Copy to prevent mutation
    };
  }

  private generateSummary(): PerformanceSummary {
    const memoryValues = this.samples.map(s => s.metrics.memory.heapUsedMB);
    const responseTimeValues = this.responseTimeMeasurements.filter(t => t > 0);

    return {
      averageMemoryMB: memoryValues.length > 0 ? memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length : 0,
      peakMemoryMB: memoryValues.length > 0 ? Math.max(...memoryValues) : 0,
      memoryGrowthMB: memoryValues.length > 1 ? memoryValues[memoryValues.length - 1] - memoryValues[0] : 0,
      averageResponseTimeMs: responseTimeValues.length > 0 ? responseTimeValues.reduce((sum, val) => sum + val, 0) / responseTimeValues.length : 0,
      maxResponseTimeMs: responseTimeValues.length > 0 ? Math.max(...responseTimeValues) : 0,
      totalOperations: this.operationCounts.total,
      errorRate: this.calculateErrorRate(),
      gcEvents: 0, // Would be calculated from actual GC metrics
      alertCounts: {
        warnings: this.alerts.filter(a => a.severity === 'warning').length,
        critical: this.alerts.filter(a => a.severity === 'critical').length
      }
    };
  }

  private generateRecommendations(summary: PerformanceSummary): string[] {
    const recommendations: string[] = [];

    // Memory recommendations
    if (summary.peakMemoryMB > this.config.alertThresholds.memoryUsage.warning) {
      recommendations.push(`Peak memory usage of ${summary.peakMemoryMB.toFixed(2)}MB exceeded warning threshold. Consider memory optimization.`);
    }

    if (summary.memoryGrowthMB > 50) {
      recommendations.push(`Memory growth of ${summary.memoryGrowthMB.toFixed(2)}MB detected. Check for memory leaks.`);
    }

    // Performance recommendations
    if (summary.averageResponseTimeMs > this.config.alertThresholds.responseTime.warning) {
      recommendations.push(`Average response time of ${summary.averageResponseTimeMs.toFixed(2)}ms is above warning threshold.`);
    }

    if (summary.errorRate > this.config.alertThresholds.errorRate.warning) {
      recommendations.push(`Error rate of ${summary.errorRate.toFixed(2)}% is above acceptable levels.`);
    }

    // Alert recommendations
    if (summary.alertCounts.critical > 0) {
      recommendations.push(`${summary.alertCounts.critical} critical alerts were triggered. Immediate attention required.`);
    }

    if (summary.alertCounts.warnings > 5) {
      recommendations.push(`${summary.alertCounts.warnings} warnings detected. Consider performance tuning.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance metrics are within acceptable ranges.');
    }

    return recommendations;
  }

  private cleanup(): void {
    this.samples = [];
    this.alerts = [];
    this.responseTimeMeasurements = [];
    this.operationCounts = { success: 0, error: 0, total: 0 };
  }
}

// ============================================================================
// Lightweight Performance Tracker
// ============================================================================

export class LightweightPerformanceTracker {
  private startTimes = new Map<string, number>();
  private measurements = new Map<string, number[]>();
  private maxMeasurements = 100;

  /**
   * Start timing an operation
   */
  start(operationName: string): void {
    this.startTimes.set(operationName, performance.now());
  }

  /**
   * End timing an operation and record the measurement
   */
  end(operationName: string): number | null {
    const startTime = this.startTimes.get(operationName);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationName}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.startTimes.delete(operationName);

    // Store measurement
    let measurements = this.measurements.get(operationName) || [];
    measurements.push(duration);

    // Limit measurements to prevent memory growth
    if (measurements.length > this.maxMeasurements) {
      measurements = measurements.slice(-this.maxMeasurements * 0.8);
    }

    this.measurements.set(operationName, measurements);
    return duration;
  }

  /**
   * Get statistics for an operation
   */
  getStats(operationName: string): OperationStats | null {
    const measurements = this.measurements.get(operationName);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((total, val) => total + val, 0);

    return {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      average: sum / measurements.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  /**
   * Get all operation statistics
   */
  getAllStats(): Map<string, OperationStats> {
    const allStats = new Map<string, OperationStats>();
    
    for (const [operationName] of this.measurements) {
      const stats = this.getStats(operationName);
      if (stats) {
        allStats.set(operationName, stats);
      }
    }

    return allStats;
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.startTimes.clear();
    this.measurements.clear();
  }
}

interface OperationStats {
  count: number;
  min: number;
  max: number;
  average: number;
  p50: number;
  p95: number;
  p99: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a performance monitor with Jest-optimized settings
 */
export function createJestPerformanceMonitor(): PerformanceMonitor {
  return new PerformanceMonitor({
    samplingInterval: 3000, // 3 seconds
    alertThresholds: {
      memoryUsage: { warning: 200, critical: 300 },
      memoryGrowthRate: { warning: 30, critical: 50 },
      responseTime: { warning: 500, critical: 1000 },
      errorRate: { warning: 3, critical: 5 },
      gcFrequency: { warning: 15, critical: 25 }
    },
    maxSamples: 50,
    autoCleanup: true
  });
}

/**
 * Measure execution time with automatic cleanup
 */
export async function measurePerformance<T>(
  operationName: string,
  operation: () => Promise<T>,
  monitor?: PerformanceMonitor
): Promise<{ result: T; duration: number; memoryGrowth: number }> {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  try {
    const result = await operation();
    const duration = performance.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = (endMemory - startMemory) / 1024 / 1024; // MB

    if (monitor) {
      monitor.recordOperation(true, duration);
    }

    return { result, duration, memoryGrowth };

  } catch (error) {
    const duration = performance.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryGrowth = (endMemory - startMemory) / 1024 / 1024; // MB

    if (monitor) {
      monitor.recordOperation(false, duration);
    }

    throw error;
  }
}

// ============================================================================
// Export Types and Classes
// ============================================================================

export {
  PerformanceMonitor,
  LightweightPerformanceTracker
};

export type {
  PerformanceMonitorConfig,
  AlertThresholds,
  PerformanceSample,
  MonitoringReport,
  PerformanceSummary,
  Alert,
  OperationStats
};