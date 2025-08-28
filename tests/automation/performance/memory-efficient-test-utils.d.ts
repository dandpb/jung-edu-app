/**
 * Memory-Efficient Performance Test Utilities for jaqEdu Platform
 * Optimized utilities to reduce memory usage and prevent test crashes
 */
import { EventEmitter } from 'events';
export declare class MemoryManager {
    private memoryThreshold;
    private gcInterval;
    private gcTimer;
    private memoryHistory;
    constructor(threshold?: number);
    /**
     * Start automatic memory monitoring and cleanup
     */
    startMonitoring(): void;
    /**
     * Stop memory monitoring
     */
    stopMonitoring(): void;
    /**
     * Check memory usage and force GC if needed
     */
    checkMemoryUsage(): number;
    /**
     * Force garbage collection if available
     */
    forceGarbageCollection(): void;
    /**
     * Get memory usage statistics
     */
    getMemoryStats(): MemoryStats;
}
export declare class OptimizedDataFactory {
    private static instance;
    private dataCache;
    private maxCacheSize;
    static getInstance(): OptimizedDataFactory;
    /**
     * Generate small test datasets
     */
    generateSmallDataset(type: 'users' | 'courses' | 'modules', size?: number): any[];
    /**
     * Generate users with minimal data
     */
    private generateUsers;
    /**
     * Generate courses with minimal data
     */
    private generateCourses;
    /**
     * Generate modules with minimal data
     */
    private generateModules;
    /**
     * Cache data with size limit
     */
    private cacheData;
    /**
     * Clear all cached data
     */
    clearCache(): void;
}
export declare class LightweightMetrics {
    private metrics;
    private maxEntries;
    /**
     * Record a performance metric
     */
    record(name: string, value: number, unit?: string): void;
    /**
     * Get metric summary
     */
    getSummary(): MetricSummary;
    /**
     * Get average for a specific metric
     */
    private getAverageMetric;
    /**
     * Clear all metrics
     */
    clear(): void;
}
export declare class ResourcePool<T> {
    private pool;
    private createFn;
    private resetFn?;
    private maxSize;
    private borrowed;
    constructor(createFn: () => T, maxSize?: number, resetFn?: (item: T) => void);
    /**
     * Borrow a resource from the pool
     */
    borrow(): T;
    /**
     * Return a resource to the pool
     */
    return(resource: T): void;
    /**
     * Get pool statistics
     */
    getStats(): PoolStats;
    /**
     * Clear the entire pool
     */
    clear(): void;
}
export declare class OptimizedTestRunner extends EventEmitter {
    private memoryManager;
    private metrics;
    private dataFactory;
    private cleanupCallbacks;
    constructor(memoryThreshold?: number);
    /**
     * Run a test with memory monitoring
     */
    runTest<T>(testName: string, testFn: () => Promise<T>, options?: TestOptions): Promise<TestResult<T>>;
    /**
     * Run multiple tests sequentially with memory management
     */
    runSequentialTests(tests: Array<{
        name: string;
        fn: () => Promise<any>;
        options?: TestOptions;
    }>): Promise<SequentialTestResults>;
    /**
     * Add cleanup callback
     */
    addCleanup(callback: () => void): void;
    /**
     * Run all cleanup callbacks
     */
    private runCleanup;
    /**
     * Get current resource usage
     */
    getResourceUsage(): ResourceUsage;
    /**
     * Cleanup all resources
     */
    cleanup(): void;
    private sleep;
}
interface MemoryStats {
    heapUsedMB: number;
    heapTotalMB: number;
    externalMB: number;
    rssMB: number;
    averageHeapUsage: number;
    peakHeapUsage: number;
}
interface MetricSummary {
    totalMetrics: number;
    avgResponseTime: number;
    avgThroughput: number;
    avgMemoryUsage: number;
    topMetrics: Array<{
        name: string;
        value: number;
        unit: string;
    }>;
}
interface PoolStats {
    available: number;
    borrowed: number;
    total: number;
    maxSize: number;
}
interface TestOptions {
    cleanupBefore?: boolean;
    cleanupAfter?: boolean;
    timeout?: number;
}
interface TestResult<T> {
    success: boolean;
    result?: T;
    error?: Error;
    duration: number;
    memoryUsage: {
        start: number;
        end: number;
        growth: number;
    };
    metrics: MetricSummary;
}
interface SequentialTestResults {
    results: Array<TestResult<any>>;
    summary: {
        totalTests: number;
        successful: number;
        failed: number;
        totalDuration: number;
        maxMemoryUsage: number;
        avgMemoryGrowth: number;
    };
}
interface ResourceUsage {
    memory: MemoryStats;
    metrics: MetricSummary;
    dataCache: {
        size: number;
        maxSize: number;
    };
}
/**
 * Create a memory-safe test environment
 */
export declare function createOptimizedTestEnvironment(memoryThreshold?: number): {
    runner: OptimizedTestRunner;
    dataFactory: OptimizedDataFactory;
    memoryManager: MemoryManager;
};
/**
 * Measure function execution with memory tracking
 */
export declare function measureExecution<T>(name: string, fn: () => Promise<T>): Promise<{
    result: T;
    duration: number;
    memoryGrowth: number;
}>;
/**
 * Create batched processing function for large datasets
 */
export declare function createBatchProcessor<T, R>(processingFn: (batch: T[]) => Promise<R[]>, batchSize?: number): (items: T[]) => Promise<R[]>;
export { MemoryManager, OptimizedDataFactory, LightweightMetrics, ResourcePool, OptimizedTestRunner };
//# sourceMappingURL=memory-efficient-test-utils.d.ts.map