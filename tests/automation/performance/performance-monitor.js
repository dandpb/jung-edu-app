"use strict";
/**
 * Performance Monitoring Utilities for Tests
 * Lightweight monitoring and alerting system for performance tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightweightPerformanceTracker = exports.PerformanceMonitor = void 0;
exports.createJestPerformanceMonitor = createJestPerformanceMonitor;
exports.measurePerformance = measurePerformance;
const perf_hooks_1 = require("perf_hooks");
const events_1 = require("events");
// ============================================================================
// Performance Monitor Class
// ============================================================================
class PerformanceMonitor extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.samples = [];
        this.alerts = [];
        this.monitoringInterval = null;
        this.startTime = 0;
        this.testName = '';
        this.operationCounts = {
            success: 0,
            error: 0,
            total: 0
        };
        this.responseTimeMeasurements = [];
        this.isMonitoring = false;
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
    startMonitoring(testName) {
        if (this.isMonitoring) {
            console.warn('Performance monitoring already active');
            return;
        }
        this.testName = testName;
        this.startTime = perf_hooks_1.performance.now();
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
    stopMonitoring() {
        if (!this.isMonitoring) {
            throw new Error('Performance monitoring not active');
        }
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        // Final sample
        this.collectSample();
        const endTime = perf_hooks_1.performance.now();
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
    recordOperation(success, responseTime) {
        if (!this.isMonitoring)
            return;
        this.operationCounts.total++;
        if (success) {
            this.operationCounts.success++;
        }
        else {
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
    recordBatchOperations(results) {
        if (!this.isMonitoring)
            return;
        results.forEach(result => {
            this.recordOperation(result.success, result.responseTime);
        });
    }
    /**
     * Get current performance snapshot
     */
    getCurrentSnapshot() {
        if (!this.isMonitoring || this.samples.length === 0) {
            return null;
        }
        return this.samples[this.samples.length - 1];
    }
    /**
     * Get active alerts
     */
    getActiveAlerts(severity) {
        const recent = perf_hooks_1.performance.now() - 30000; // Last 30 seconds
        let alerts = this.alerts.filter(alert => alert.timestamp > recent);
        if (severity) {
            alerts = alerts.filter(alert => alert.severity === severity);
        }
        return alerts;
    }
    // ============================================================================
    // Private Methods
    // ============================================================================
    collectSample() {
        try {
            const timestamp = perf_hooks_1.performance.now();
            // Collect metrics
            const memoryMetrics = this.collectMemoryMetrics();
            const performanceMetrics = this.collectPerformanceMetrics();
            const gcMetrics = this.config.enableGCMonitoring ? this.collectGCMetrics() : undefined;
            // Create sample
            const sample = {
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
                }
                else {
                    console.log(`⚠️  Warning: ${alert.message}`);
                }
            });
        }
        catch (error) {
            console.error('Error collecting performance sample:', error);
        }
    }
    collectMemoryMetrics() {
        const memUsage = process.memoryUsage();
        return {
            heapUsedMB: memUsage.heapUsed / 1024 / 1024,
            heapTotalMB: memUsage.heapTotal / 1024 / 1024,
            externalMB: memUsage.external / 1024 / 1024,
            rssMB: memUsage.rss / 1024 / 1024,
            arrayBuffersMB: memUsage.arrayBuffers / 1024 / 1024
        };
    }
    collectPerformanceMetrics() {
        const currentTime = perf_hooks_1.performance.now();
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
    collectGCMetrics() {
        // Note: Actual GC metrics would require additional instrumentation
        // This is a simplified implementation
        return {
            collections: 0,
            pauseTime: 0,
            reclaimedMB: 0
        };
    }
    checkAlerts(metrics) {
        const alerts = [];
        const timestamp = perf_hooks_1.performance.now();
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
        }
        else if (metrics.memory.heapUsedMB >= this.config.alertThresholds.memoryUsage.warning) {
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
            }
            else if (memoryGrowthRate >= this.config.alertThresholds.memoryGrowthRate.warning) {
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
        }
        else if (errorRate >= this.config.alertThresholds.errorRate.warning) {
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
    checkResponseTimeAlert(responseTime) {
        const timestamp = perf_hooks_1.performance.now();
        if (responseTime >= this.config.alertThresholds.responseTime.critical) {
            const alert = {
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
        }
        else if (responseTime >= this.config.alertThresholds.responseTime.warning) {
            const alert = {
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
    calculateMemoryGrowthRate() {
        if (this.samples.length < 2)
            return 0;
        const recent = this.samples.slice(-5); // Last 5 samples
        if (recent.length < 2)
            return 0;
        const first = recent[0];
        const last = recent[recent.length - 1];
        const memoryDiff = last.metrics.memory.heapUsedMB - first.metrics.memory.heapUsedMB;
        const timeDiff = (last.timestamp - first.timestamp) / 60000; // minutes
        return timeDiff > 0 ? memoryDiff / timeDiff : 0;
    }
    calculateErrorRate() {
        if (this.operationCounts.total === 0)
            return 0;
        return (this.operationCounts.error / this.operationCounts.total) * 100;
    }
    generateReport(endTime) {
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
    generateSummary() {
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
    generateRecommendations(summary) {
        const recommendations = [];
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
    cleanup() {
        this.samples = [];
        this.alerts = [];
        this.responseTimeMeasurements = [];
        this.operationCounts = { success: 0, error: 0, total: 0 };
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// ============================================================================
// Lightweight Performance Tracker
// ============================================================================
class LightweightPerformanceTracker {
    constructor() {
        this.startTimes = new Map();
        this.measurements = new Map();
        this.maxMeasurements = 100;
    }
    /**
     * Start timing an operation
     */
    start(operationName) {
        this.startTimes.set(operationName, perf_hooks_1.performance.now());
    }
    /**
     * End timing an operation and record the measurement
     */
    end(operationName) {
        const startTime = this.startTimes.get(operationName);
        if (!startTime) {
            console.warn(`No start time found for operation: ${operationName}`);
            return null;
        }
        const duration = perf_hooks_1.performance.now() - startTime;
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
    getStats(operationName) {
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
    getAllStats() {
        const allStats = new Map();
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
    clear() {
        this.startTimes.clear();
        this.measurements.clear();
    }
}
exports.LightweightPerformanceTracker = LightweightPerformanceTracker;
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Create a performance monitor with Jest-optimized settings
 */
function createJestPerformanceMonitor() {
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
async function measurePerformance(operationName, operation, monitor) {
    const startTime = perf_hooks_1.performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    try {
        const result = await operation();
        const duration = perf_hooks_1.performance.now() - startTime;
        const endMemory = process.memoryUsage().heapUsed;
        const memoryGrowth = (endMemory - startMemory) / 1024 / 1024; // MB
        if (monitor) {
            monitor.recordOperation(true, duration);
        }
        return { result, duration, memoryGrowth };
    }
    catch (error) {
        const duration = perf_hooks_1.performance.now() - startTime;
        const endMemory = process.memoryUsage().heapUsed;
        const memoryGrowth = (endMemory - startMemory) / 1024 / 1024; // MB
        if (monitor) {
            monitor.recordOperation(false, duration);
        }
        throw error;
    }
}
//# sourceMappingURL=performance-monitor.js.map