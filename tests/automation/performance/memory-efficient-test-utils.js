"use strict";
/**
 * Memory-Efficient Performance Test Utilities for jaqEdu Platform
 * Optimized utilities to reduce memory usage and prevent test crashes
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedTestRunner = exports.ResourcePool = exports.LightweightMetrics = exports.OptimizedDataFactory = exports.MemoryManager = void 0;
exports.createOptimizedTestEnvironment = createOptimizedTestEnvironment;
exports.measureExecution = measureExecution;
exports.createBatchProcessor = createBatchProcessor;
const perf_hooks_1 = require("perf_hooks");
const events_1 = require("events");
// ============================================================================
// Memory Management Utilities
// ============================================================================
class MemoryManager {
    constructor(threshold = 500) {
        this.memoryThreshold = 500; // MB
        this.gcInterval = 5000; // 5 seconds
        this.gcTimer = null;
        this.memoryHistory = [];
        this.memoryThreshold = threshold;
    }
    /**
     * Start automatic memory monitoring and cleanup
     */
    startMonitoring() {
        this.gcTimer = setInterval(() => {
            this.checkMemoryUsage();
        }, this.gcInterval);
    }
    /**
     * Stop memory monitoring
     */
    stopMonitoring() {
        if (this.gcTimer) {
            clearInterval(this.gcTimer);
            this.gcTimer = null;
        }
    }
    /**
     * Check memory usage and force GC if needed
     */
    checkMemoryUsage() {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
        this.memoryHistory.push(heapUsedMB);
        // Keep only last 10 readings
        if (this.memoryHistory.length > 10) {
            this.memoryHistory.shift();
        }
        if (heapUsedMB > this.memoryThreshold) {
            console.warn(`⚠️ Memory usage high: ${heapUsedMB.toFixed(2)}MB`);
            this.forceGarbageCollection();
        }
        return heapUsedMB;
    }
    /**
     * Force garbage collection if available
     */
    forceGarbageCollection() {
        if (global.gc) {
            global.gc();
            const newMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(`🧹 GC completed. Memory: ${newMemoryUsage.toFixed(2)}MB`);
        }
    }
    /**
     * Get memory usage statistics
     */
    getMemoryStats() {
        const current = process.memoryUsage();
        return {
            heapUsedMB: current.heapUsed / 1024 / 1024,
            heapTotalMB: current.heapTotal / 1024 / 1024,
            externalMB: current.external / 1024 / 1024,
            rssMB: current.rss / 1024 / 1024,
            averageHeapUsage: this.memoryHistory.length > 0
                ? this.memoryHistory.reduce((sum, val) => sum + val, 0) / this.memoryHistory.length
                : 0,
            peakHeapUsage: Math.max(...this.memoryHistory, 0)
        };
    }
}
exports.MemoryManager = MemoryManager;
// ============================================================================
// Optimized Test Data Factory
// ============================================================================
class OptimizedDataFactory {
    constructor() {
        this.dataCache = new Map();
        this.maxCacheSize = 100; // Limit cache size
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new OptimizedDataFactory();
        }
        return this.instance;
    }
    /**
     * Generate small test datasets
     */
    generateSmallDataset(type, size = 10) {
        const cacheKey = `${type}-${size}`;
        if (this.dataCache.has(cacheKey)) {
            return this.dataCache.get(cacheKey);
        }
        let data;
        switch (type) {
            case 'users':
                data = this.generateUsers(size);
                break;
            case 'courses':
                data = this.generateCourses(size);
                break;
            case 'modules':
                data = this.generateModules(size);
                break;
            default:
                data = [];
        }
        this.cacheData(cacheKey, data);
        return data;
    }
    /**
     * Generate users with minimal data
     */
    generateUsers(count) {
        return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            email: `user${i + 1}@test.com`,
            name: `User ${i + 1}`
        }));
    }
    /**
     * Generate courses with minimal data
     */
    generateCourses(count) {
        return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            title: `Course ${i + 1}`,
            description: `Description for course ${i + 1}`
        }));
    }
    /**
     * Generate modules with minimal data
     */
    generateModules(count) {
        return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            title: `Module ${i + 1}`,
            content: `Content for module ${i + 1}`
        }));
    }
    /**
     * Cache data with size limit
     */
    cacheData(key, data) {
        if (this.dataCache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const firstKey = this.dataCache.keys().next().value;
            this.dataCache.delete(firstKey);
        }
        this.dataCache.set(key, data);
    }
    /**
     * Clear all cached data
     */
    clearCache() {
        this.dataCache.clear();
    }
}
exports.OptimizedDataFactory = OptimizedDataFactory;
// ============================================================================
// Lightweight Performance Metrics
// ============================================================================
class LightweightMetrics {
    constructor() {
        this.metrics = new Map();
        this.maxEntries = 1000; // Limit metric entries
    }
    /**
     * Record a performance metric
     */
    record(name, value, unit = 'ms') {
        if (this.metrics.size >= this.maxEntries) {
            // Remove oldest metrics
            const oldest = Array.from(this.metrics.keys()).slice(0, 100);
            oldest.forEach(key => this.metrics.delete(key));
        }
        const entry = {
            value,
            unit,
            timestamp: perf_hooks_1.performance.now(),
            count: 1
        };
        if (this.metrics.has(name)) {
            const existing = this.metrics.get(name);
            entry.value = (existing.value * existing.count + value) / (existing.count + 1);
            entry.count = existing.count + 1;
        }
        this.metrics.set(name, entry);
    }
    /**
     * Get metric summary
     */
    getSummary() {
        const entries = Array.from(this.metrics.entries());
        return {
            totalMetrics: entries.length,
            avgResponseTime: this.getAverageMetric('response_time'),
            avgThroughput: this.getAverageMetric('throughput'),
            avgMemoryUsage: this.getAverageMetric('memory_usage'),
            topMetrics: entries
                .sort((a, b) => b[1].value - a[1].value)
                .slice(0, 5)
                .map(([name, entry]) => ({ name, value: entry.value, unit: entry.unit }))
        };
    }
    /**
     * Get average for a specific metric
     */
    getAverageMetric(name) {
        const entry = this.metrics.get(name);
        return entry ? entry.value : 0;
    }
    /**
     * Clear all metrics
     */
    clear() {
        this.metrics.clear();
    }
}
exports.LightweightMetrics = LightweightMetrics;
// ============================================================================
// Resource Pool Manager
// ============================================================================
class ResourcePool {
    constructor(createFn, maxSize = 10, resetFn) {
        this.pool = [];
        this.borrowed = new Set();
        this.createFn = createFn;
        this.maxSize = maxSize;
        this.resetFn = resetFn;
    }
    /**
     * Borrow a resource from the pool
     */
    borrow() {
        let resource;
        if (this.pool.length > 0) {
            resource = this.pool.pop();
        }
        else {
            resource = this.createFn();
        }
        this.borrowed.add(resource);
        return resource;
    }
    /**
     * Return a resource to the pool
     */
    return(resource) {
        if (!this.borrowed.has(resource)) {
            return; // Not from this pool
        }
        this.borrowed.delete(resource);
        if (this.resetFn) {
            this.resetFn(resource);
        }
        if (this.pool.length < this.maxSize) {
            this.pool.push(resource);
        }
        // If pool is full, let the resource be garbage collected
    }
    /**
     * Get pool statistics
     */
    getStats() {
        return {
            available: this.pool.length,
            borrowed: this.borrowed.size,
            total: this.pool.length + this.borrowed.size,
            maxSize: this.maxSize
        };
    }
    /**
     * Clear the entire pool
     */
    clear() {
        this.pool.length = 0;
        this.borrowed.clear();
    }
}
exports.ResourcePool = ResourcePool;
// ============================================================================
// Optimized Test Runner
// ============================================================================
class OptimizedTestRunner extends events_1.EventEmitter {
    constructor(memoryThreshold = 400) {
        super();
        this.cleanupCallbacks = [];
        this.memoryManager = new MemoryManager(memoryThreshold);
        this.metrics = new LightweightMetrics();
        this.dataFactory = OptimizedDataFactory.getInstance();
    }
    /**
     * Run a test with memory monitoring
     */
    async runTest(testName, testFn, options = {}) {
        const startTime = perf_hooks_1.performance.now();
        const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;
        this.memoryManager.startMonitoring();
        try {
            console.log(`🧪 Running test: ${testName}`);
            // Pre-test cleanup
            if (options.cleanupBefore) {
                this.memoryManager.forceGarbageCollection();
            }
            const result = await testFn();
            const endTime = perf_hooks_1.performance.now();
            const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
            // Record metrics
            this.metrics.record(`${testName}_duration`, endTime - startTime);
            this.metrics.record(`${testName}_memory_growth`, endMemory - startMemory, 'MB');
            console.log(`✅ Test completed: ${testName} (${(endTime - startTime).toFixed(2)}ms)`);
            return {
                success: true,
                result,
                duration: endTime - startTime,
                memoryUsage: {
                    start: startMemory,
                    end: endMemory,
                    growth: endMemory - startMemory
                },
                metrics: this.metrics.getSummary()
            };
        }
        catch (error) {
            console.error(`❌ Test failed: ${testName}`, error);
            return {
                success: false,
                error: error,
                duration: perf_hooks_1.performance.now() - startTime,
                memoryUsage: {
                    start: startMemory,
                    end: process.memoryUsage().heapUsed / 1024 / 1024,
                    growth: 0
                },
                metrics: this.metrics.getSummary()
            };
        }
        finally {
            // Post-test cleanup
            this.runCleanup();
            if (options.cleanupAfter !== false) {
                await this.sleep(100); // Brief pause
                this.memoryManager.forceGarbageCollection();
            }
            this.memoryManager.stopMonitoring();
        }
    }
    /**
     * Run multiple tests sequentially with memory management
     */
    async runSequentialTests(tests) {
        const results = [];
        let totalDuration = 0;
        let maxMemoryUsage = 0;
        for (const test of tests) {
            const result = await this.runTest(test.name, test.fn, test.options);
            results.push(result);
            totalDuration += result.duration;
            maxMemoryUsage = Math.max(maxMemoryUsage, result.memoryUsage.end);
            // Break between tests for memory stabilization
            await this.sleep(500);
        }
        return {
            results,
            summary: {
                totalTests: tests.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                totalDuration,
                maxMemoryUsage,
                avgMemoryGrowth: results.reduce((sum, r) => sum + r.memoryUsage.growth, 0) / results.length
            }
        };
    }
    /**
     * Add cleanup callback
     */
    addCleanup(callback) {
        this.cleanupCallbacks.push(callback);
    }
    /**
     * Run all cleanup callbacks
     */
    runCleanup() {
        this.cleanupCallbacks.forEach(callback => {
            try {
                callback();
            }
            catch (error) {
                console.warn('Cleanup callback failed:', error);
            }
        });
        this.cleanupCallbacks.length = 0;
    }
    /**
     * Get current resource usage
     */
    getResourceUsage() {
        return {
            memory: this.memoryManager.getMemoryStats(),
            metrics: this.metrics.getSummary(),
            dataCache: {
                size: this.dataFactory['dataCache'].size,
                maxSize: this.dataFactory['maxCacheSize']
            }
        };
    }
    /**
     * Cleanup all resources
     */
    cleanup() {
        this.runCleanup();
        this.memoryManager.stopMonitoring();
        this.metrics.clear();
        this.dataFactory.clearCache();
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.OptimizedTestRunner = OptimizedTestRunner;
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Create a memory-safe test environment
 */
function createOptimizedTestEnvironment(memoryThreshold = 400) {
    const runner = new OptimizedTestRunner(memoryThreshold);
    const dataFactory = OptimizedDataFactory.getInstance();
    const memoryManager = new MemoryManager(memoryThreshold);
    return { runner, dataFactory, memoryManager };
}
/**
 * Measure function execution with memory tracking
 */
async function measureExecution(name, fn) {
    const startTime = perf_hooks_1.performance.now();
    const startMemory = process.memoryUsage().heapUsed;
    const result = await fn();
    const endTime = perf_hooks_1.performance.now();
    const endMemory = process.memoryUsage().heapUsed;
    return {
        result,
        duration: endTime - startTime,
        memoryGrowth: (endMemory - startMemory) / 1024 / 1024
    };
}
/**
 * Create batched processing function for large datasets
 */
function createBatchProcessor(processingFn, batchSize = 100) {
    return async function processBatches(items) {
        const results = [];
        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await processingFn(batch);
            results.push(...batchResults);
            // Force cleanup between batches
            if (global.gc && i > 0 && i % (batchSize * 5) === 0) {
                global.gc();
            }
        }
        return results;
    };
}
//# sourceMappingURL=memory-efficient-test-utils.js.map