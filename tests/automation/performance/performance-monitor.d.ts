/**
 * Performance Monitoring Utilities for Tests
 * Lightweight monitoring and alerting system for performance tests
 */
import { EventEmitter } from 'events';
interface PerformanceMonitorConfig {
    enableMemoryMonitoring: boolean;
    enableCPUMonitoring: boolean;
    enableGCMonitoring: boolean;
    samplingInterval: number;
    alertThresholds: AlertThresholds;
    retentionPeriod: number;
    maxSamples: number;
    autoCleanup: boolean;
}
interface AlertThresholds {
    memoryUsage: {
        warning: number;
        critical: number;
    };
    memoryGrowthRate: {
        warning: number;
        critical: number;
    };
    responseTime: {
        warning: number;
        critical: number;
    };
    errorRate: {
        warning: number;
        critical: number;
    };
    gcFrequency: {
        warning: number;
        critical: number;
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
    pauseTime: number;
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
export declare class PerformanceMonitor extends EventEmitter {
    private config;
    private samples;
    private alerts;
    private monitoringInterval;
    private startTime;
    private testName;
    private operationCounts;
    private responseTimeMeasurements;
    private isMonitoring;
    constructor(config?: Partial<PerformanceMonitorConfig>);
    /**
     * Start monitoring performance metrics
     */
    startMonitoring(testName: string): void;
    /**
     * Stop monitoring and generate report
     */
    stopMonitoring(): MonitoringReport;
    /**
     * Record an operation result
     */
    recordOperation(success: boolean, responseTime?: number): void;
    /**
     * Record multiple operations efficiently
     */
    recordBatchOperations(results: Array<{
        success: boolean;
        responseTime?: number;
    }>): void;
    /**
     * Get current performance snapshot
     */
    getCurrentSnapshot(): PerformanceSample | null;
    /**
     * Get active alerts
     */
    getActiveAlerts(severity?: 'warning' | 'critical'): Alert[];
    private collectSample;
    private collectMemoryMetrics;
    private collectPerformanceMetrics;
    private collectGCMetrics;
    private checkAlerts;
    private checkResponseTimeAlert;
    private calculateMemoryGrowthRate;
    private calculateErrorRate;
    private generateReport;
    private generateSummary;
    private generateRecommendations;
    private cleanup;
}
export declare class LightweightPerformanceTracker {
    private startTimes;
    private measurements;
    private maxMeasurements;
    /**
     * Start timing an operation
     */
    start(operationName: string): void;
    /**
     * End timing an operation and record the measurement
     */
    end(operationName: string): number | null;
    /**
     * Get statistics for an operation
     */
    getStats(operationName: string): OperationStats | null;
    /**
     * Get all operation statistics
     */
    getAllStats(): Map<string, OperationStats>;
    /**
     * Clear all measurements
     */
    clear(): void;
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
/**
 * Create a performance monitor with Jest-optimized settings
 */
export declare function createJestPerformanceMonitor(): PerformanceMonitor;
/**
 * Measure execution time with automatic cleanup
 */
export declare function measurePerformance<T>(operationName: string, operation: () => Promise<T>, monitor?: PerformanceMonitor): Promise<{
    result: T;
    duration: number;
    memoryGrowth: number;
}>;
export { PerformanceMonitor, LightweightPerformanceTracker };
export type { PerformanceMonitorConfig, AlertThresholds, PerformanceSample, MonitoringReport, PerformanceSummary, Alert, OperationStats };
//# sourceMappingURL=performance-monitor.d.ts.map