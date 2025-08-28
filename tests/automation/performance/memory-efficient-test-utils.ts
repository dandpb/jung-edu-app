/**
 * Memory-Efficient Performance Test Utilities for jaqEdu Platform
 * Optimized utilities to reduce memory usage and prevent test crashes
 */

import { performance } from 'perf_hooks';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

// ============================================================================
// Memory Management Utilities
// ============================================================================

export class MemoryManager {
  private memoryThreshold = 500; // MB
  private gcInterval = 5000; // 5 seconds
  private gcTimer: NodeJS.Timeout | null = null;
  private memoryHistory: number[] = [];

  constructor(threshold = 500) {
    this.memoryThreshold = threshold;
  }

  /**
   * Start automatic memory monitoring and cleanup
   */
  startMonitoring(): void {
    this.gcTimer = setInterval(() => {
      this.checkMemoryUsage();
    }, this.gcInterval);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }

  /**
   * Check memory usage and force GC if needed
   */
  checkMemoryUsage(): number {
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
  forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      const newMemoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      console.log(`🧹 GC completed. Memory: ${newMemoryUsage.toFixed(2)}MB`);
    }
  }

  /**
   * Get memory usage statistics
   */
  getMemoryStats(): MemoryStats {
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

// ============================================================================
// Optimized Test Data Factory
// ============================================================================

export class OptimizedDataFactory {
  private static instance: OptimizedDataFactory;
  private dataCache = new Map<string, any>();
  private maxCacheSize = 100; // Limit cache size

  static getInstance(): OptimizedDataFactory {
    if (!this.instance) {
      this.instance = new OptimizedDataFactory();
    }
    return this.instance;
  }

  /**
   * Generate small test datasets
   */
  generateSmallDataset(type: 'users' | 'courses' | 'modules', size = 10): any[] {
    const cacheKey = `${type}-${size}`;
    
    if (this.dataCache.has(cacheKey)) {
      return this.dataCache.get(cacheKey);
    }

    let data: any[];
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
  private generateUsers(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      email: `user${i + 1}@test.com`,
      name: `User ${i + 1}`
    }));
  }

  /**
   * Generate courses with minimal data
   */
  private generateCourses(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `Course ${i + 1}`,
      description: `Description for course ${i + 1}`
    }));
  }

  /**
   * Generate modules with minimal data
   */
  private generateModules(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      title: `Module ${i + 1}`,
      content: `Content for module ${i + 1}`
    }));
  }

  /**
   * Cache data with size limit
   */
  private cacheData(key: string, data: any): void {
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
  clearCache(): void {
    this.dataCache.clear();
  }
}

// ============================================================================
// Lightweight Performance Metrics
// ============================================================================

export class LightweightMetrics {
  private metrics: Map<string, MetricEntry> = new Map();
  private maxEntries = 1000; // Limit metric entries

  /**
   * Record a performance metric
   */
  record(name: string, value: number, unit = 'ms'): void {
    if (this.metrics.size >= this.maxEntries) {
      // Remove oldest metrics
      const oldest = Array.from(this.metrics.keys()).slice(0, 100);
      oldest.forEach(key => this.metrics.delete(key));
    }

    const entry: MetricEntry = {
      value,
      unit,
      timestamp: performance.now(),
      count: 1
    };

    if (this.metrics.has(name)) {
      const existing = this.metrics.get(name)!;
      entry.value = (existing.value * existing.count + value) / (existing.count + 1);
      entry.count = existing.count + 1;
    }

    this.metrics.set(name, entry);
  }

  /**
   * Get metric summary
   */
  getSummary(): MetricSummary {
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
  private getAverageMetric(name: string): number {
    const entry = this.metrics.get(name);
    return entry ? entry.value : 0;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

// ============================================================================
// Resource Pool Manager
// ============================================================================

export class ResourcePool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (item: T) => void;
  private maxSize: number;
  private borrowed = new Set<T>();

  constructor(
    createFn: () => T,
    maxSize = 10,
    resetFn?: (item: T) => void
  ) {
    this.createFn = createFn;
    this.maxSize = maxSize;
    this.resetFn = resetFn;
  }

  /**
   * Borrow a resource from the pool
   */
  borrow(): T {
    let resource: T;

    if (this.pool.length > 0) {
      resource = this.pool.pop()!;
    } else {
      resource = this.createFn();
    }

    this.borrowed.add(resource);
    return resource;
  }

  /**
   * Return a resource to the pool
   */
  return(resource: T): void {
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
  getStats(): PoolStats {
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
  clear(): void {
    this.pool.length = 0;
    this.borrowed.clear();
  }
}

// ============================================================================
// Optimized Test Runner
// ============================================================================

export class OptimizedTestRunner extends EventEmitter {
  private memoryManager: MemoryManager;
  private metrics: LightweightMetrics;
  private dataFactory: OptimizedDataFactory;
  private cleanupCallbacks: Array<() => void> = [];

  constructor(memoryThreshold = 400) {
    super();
    this.memoryManager = new MemoryManager(memoryThreshold);
    this.metrics = new LightweightMetrics();
    this.dataFactory = OptimizedDataFactory.getInstance();
  }

  /**
   * Run a test with memory monitoring
   */
  async runTest<T>(
    testName: string,
    testFn: () => Promise<T>,
    options: TestOptions = {}
  ): Promise<TestResult<T>> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024;

    this.memoryManager.startMonitoring();

    try {
      console.log(`🧪 Running test: ${testName}`);
      
      // Pre-test cleanup
      if (options.cleanupBefore) {
        this.memoryManager.forceGarbageCollection();
      }

      const result = await testFn();
      
      const endTime = performance.now();
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

    } catch (error) {
      console.error(`❌ Test failed: ${testName}`, error);
      
      return {
        success: false,
        error: error as Error,
        duration: performance.now() - startTime,
        memoryUsage: {
          start: startMemory,
          end: process.memoryUsage().heapUsed / 1024 / 1024,
          growth: 0
        },
        metrics: this.metrics.getSummary()
      };
      
    } finally {
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
  async runSequentialTests(
    tests: Array<{ name: string; fn: () => Promise<any>; options?: TestOptions }>
  ): Promise<SequentialTestResults> {
    const results: Array<TestResult<any>> = [];
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
  addCleanup(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Run all cleanup callbacks
   */
  private runCleanup(): void {
    this.cleanupCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    });
    this.cleanupCallbacks.length = 0;
  }

  /**
   * Get current resource usage
   */
  getResourceUsage(): ResourceUsage {
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
  cleanup(): void {
    this.runCleanup();
    this.memoryManager.stopMonitoring();
    this.metrics.clear();
    this.dataFactory.clearCache();
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

interface MemoryStats {
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  rssMB: number;
  averageHeapUsage: number;
  peakHeapUsage: number;
}

interface MetricEntry {
  value: number;
  unit: string;
  timestamp: number;
  count: number;
}

interface MetricSummary {
  totalMetrics: number;
  avgResponseTime: number;
  avgThroughput: number;
  avgMemoryUsage: number;
  topMetrics: Array<{ name: string; value: number; unit: string }>;
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

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a memory-safe test environment
 */
export function createOptimizedTestEnvironment(memoryThreshold = 400): {
  runner: OptimizedTestRunner;
  dataFactory: OptimizedDataFactory;
  memoryManager: MemoryManager;
} {
  const runner = new OptimizedTestRunner(memoryThreshold);
  const dataFactory = OptimizedDataFactory.getInstance();
  const memoryManager = new MemoryManager(memoryThreshold);

  return { runner, dataFactory, memoryManager };
}

/**
 * Measure function execution with memory tracking
 */
export async function measureExecution<T>(
  name: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number; memoryGrowth: number }> {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  const result = await fn();
  
  const endTime = performance.now();
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
export function createBatchProcessor<T, R>(
  processingFn: (batch: T[]) => Promise<R[]>,
  batchSize = 100
) {
  return async function processBatches(items: T[]): Promise<R[]> {
    const results: R[] = [];
    
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

export {
  MemoryManager,
  OptimizedDataFactory,
  LightweightMetrics,
  ResourcePool,
  OptimizedTestRunner
};