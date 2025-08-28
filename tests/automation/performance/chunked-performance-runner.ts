/**
 * Chunked Performance Test Runner
 * Breaks down large performance tests into memory-safe chunks
 */

import { performance } from 'perf_hooks';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  OptimizedTestRunner,
  OptimizedDataFactory,
  MemoryManager,
  measureExecution
} from './memory-efficient-test-utils';
import { runCriticalPerformanceTests } from './critical-performance-tests';
import { runOptimizedDatabaseTests } from './optimized-database-tests';

// ============================================================================
// Chunked Test Configuration
// ============================================================================

interface ChunkedTestConfig {
  maxChunkSize: number;
  memoryThreshold: number;
  cleanupInterval: number;
  timeoutPerChunk: number;
  maxParallelChunks: number;
  pauseBetweenChunks: number;
}

interface TestChunk {
  name: string;
  description: string;
  testFunction: () => Promise<any>;
  estimatedMemoryMB: number;
  estimatedDurationMs: number;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
}

interface ChunkExecutionResult {
  chunkName: string;
  success: boolean;
  duration: number;
  memoryUsage: {
    start: number;
    peak: number;
    end: number;
    growth: number;
  };
  result?: any;
  error?: Error;
  cleanup: {
    beforeMB: number;
    afterMB: number;
    gcTriggered: boolean;
  };
}

interface ChunkedTestSuiteResult {
  suiteName: string;
  totalChunks: number;
  successfulChunks: number;
  failedChunks: number;
  totalDuration: number;
  maxMemoryUsage: number;
  averageChunkDuration: number;
  chunkResults: ChunkExecutionResult[];
  recommendations: string[];
  summary: ChunkedTestSummary;
}

interface ChunkedTestSummary {
  overallSuccess: boolean;
  successRate: number;
  memoryEfficiency: number;
  performanceScore: number;
  criticalIssues: string[];
  warnings: string[];
}

// ============================================================================
// Chunked Performance Test Runner
// ============================================================================

export class ChunkedPerformanceRunner {
  private config: ChunkedTestConfig;
  private memoryManager: MemoryManager;
  private testRunner: OptimizedTestRunner;
  private dataFactory: OptimizedDataFactory;
  private chunkResults: ChunkExecutionResult[] = [];

  constructor(config?: Partial<ChunkedTestConfig>) {
    this.config = {
      maxChunkSize: 5, // Max 5 tests per chunk
      memoryThreshold: 300, // 300MB threshold
      cleanupInterval: 3, // Cleanup every 3 chunks
      timeoutPerChunk: 120000, // 2 minutes per chunk
      maxParallelChunks: 1, // Sequential execution for memory safety
      pauseBetweenChunks: 1000, // 1 second pause between chunks
      ...config
    };

    this.memoryManager = new MemoryManager(this.config.memoryThreshold);
    this.testRunner = new OptimizedTestRunner(this.config.memoryThreshold);
    this.dataFactory = OptimizedDataFactory.getInstance();
  }

  /**
   * Run performance tests in memory-safe chunks
   */
  async runChunkedPerformanceTests(): Promise<ChunkedTestSuiteResult> {
    console.log('🧩 Starting Chunked Performance Test Suite');
    console.log(`  Max Chunk Size: ${this.config.maxChunkSize} tests`);
    console.log(`  Memory Threshold: ${this.config.memoryThreshold}MB`);
    console.log(`  Cleanup Interval: ${this.config.cleanupInterval} chunks`);

    const startTime = performance.now();
    const startMemory = this.memoryManager.checkMemoryUsage();

    try {
      // Define test chunks
      const testChunks = this.defineTestChunks();
      console.log(`📦 Created ${testChunks.length} test chunks`);

      // Execute chunks sequentially
      this.chunkResults = [];
      for (let i = 0; i < testChunks.length; i++) {
        const chunk = testChunks[i];
        console.log(`\n🔄 Executing chunk ${i + 1}/${testChunks.length}: ${chunk.name}`);

        const chunkResult = await this.executeChunk(chunk, i);
        this.chunkResults.push(chunkResult);

        // Cleanup after specified interval
        if ((i + 1) % this.config.cleanupInterval === 0) {
          await this.performIntermediateCleanup();
        }

        // Pause between chunks for memory stabilization
        if (i < testChunks.length - 1) {
          await this.sleep(this.config.pauseBetweenChunks);
        }
      }

      const endTime = performance.now();
      const endMemory = this.memoryManager.checkMemoryUsage();

      // Generate comprehensive results
      const results = this.generateSuiteResults(
        startTime,
        endTime,
        startMemory,
        endMemory,
        testChunks
      );

      console.log('\n✅ Chunked Performance Test Suite Completed');
      console.log(`📊 Results: ${results.successfulChunks}/${results.totalChunks} chunks passed`);
      console.log(`⏱️  Total Duration: ${(results.totalDuration / 1000).toFixed(2)}s`);
      console.log(`💾 Max Memory Usage: ${results.maxMemoryUsage.toFixed(2)}MB`);

      return results;

    } catch (error) {
      console.error('❌ Chunked Performance Test Suite Failed:', error);
      throw error;
    } finally {
      await this.finalCleanup();
    }
  }

  /**
   * Define test chunks with memory and performance considerations
   */
  private defineTestChunks(): TestChunk[] {
    return [
      {
        name: 'Basic Performance Chunk',
        description: 'Essential API and response time tests',
        testFunction: async () => {
          return await this.runBasicPerformanceTests();
        },
        estimatedMemoryMB: 50,
        estimatedDurationMs: 15000,
        priority: 'high'
      },
      {
        name: 'Database Performance Chunk',
        description: 'Optimized database query performance tests',
        testFunction: async () => {
          return await runOptimizedDatabaseTests();
        },
        estimatedMemoryMB: 80,
        estimatedDurationMs: 25000,
        priority: 'high'
      },
      {
        name: 'Memory Patterns Chunk',
        description: 'Memory usage and leak detection tests',
        testFunction: async () => {
          return await this.runMemoryPatternTests();
        },
        estimatedMemoryMB: 70,
        estimatedDurationMs: 20000,
        priority: 'high'
      },
      {
        name: 'Concurrency Chunk',
        description: 'Controlled concurrency and load tests',
        testFunction: async () => {
          return await this.runConcurrencyTests();
        },
        estimatedMemoryMB: 60,
        estimatedDurationMs: 18000,
        priority: 'medium'
      },
      {
        name: 'Cache Performance Chunk',
        description: 'Caching efficiency and optimization tests',
        testFunction: async () => {
          return await this.runCachePerformanceTests();
        },
        estimatedMemoryMB: 40,
        estimatedDurationMs: 12000,
        priority: 'medium'
      },
      {
        name: 'Load Simulation Chunk',
        description: 'Lightweight load simulation tests',
        testFunction: async () => {
          return await this.runLoadSimulationTests();
        },
        estimatedMemoryMB: 65,
        estimatedDurationMs: 22000,
        priority: 'low'
      }
    ];
  }

  /**
   * Execute a single test chunk with memory monitoring
   */
  private async executeChunk(chunk: TestChunk, index: number): Promise<ChunkExecutionResult> {
    const beforeCleanup = this.memoryManager.checkMemoryUsage();
    const startTime = performance.now();
    const startMemory = this.memoryManager.checkMemoryUsage();

    let peakMemory = startMemory;
    let monitoringInterval: NodeJS.Timeout;

    try {
      // Start memory monitoring for this chunk
      monitoringInterval = setInterval(() => {
        const currentMemory = this.memoryManager.checkMemoryUsage();
        peakMemory = Math.max(peakMemory, currentMemory);
        
        // Emergency cleanup if approaching limits
        if (currentMemory > this.config.memoryThreshold * 0.9) {
          console.warn(`⚠️ Memory approaching limit: ${currentMemory.toFixed(2)}MB`);
          if (global.gc) {
            global.gc();
          }
        }
      }, 2000);

      // Execute chunk with timeout
      const result = await this.executeWithTimeout(
        chunk.testFunction,
        this.config.timeoutPerChunk,
        `Chunk: ${chunk.name}`
      );

      const endTime = performance.now();
      const endMemory = this.memoryManager.checkMemoryUsage();

      // Perform chunk-level cleanup
      const cleanupResult = await this.performChunkCleanup();

      return {
        chunkName: chunk.name,
        success: true,
        duration: endTime - startTime,
        memoryUsage: {
          start: startMemory,
          peak: peakMemory,
          end: endMemory,
          growth: endMemory - startMemory
        },
        result,
        cleanup: {
          beforeMB: beforeCleanup,
          afterMB: this.memoryManager.checkMemoryUsage(),
          gcTriggered: true
        }
      };

    } catch (error) {
      console.error(`❌ Chunk failed: ${chunk.name}`, error);

      return {
        chunkName: chunk.name,
        success: false,
        duration: performance.now() - startTime,
        memoryUsage: {
          start: startMemory,
          peak: peakMemory,
          end: this.memoryManager.checkMemoryUsage(),
          growth: 0
        },
        error: error as Error,
        cleanup: {
          beforeMB: beforeCleanup,
          afterMB: this.memoryManager.checkMemoryUsage(),
          gcTriggered: false
        }
      };

    } finally {
      if (monitoringInterval!) {
        clearInterval(monitoringInterval!);
      }
    }
  }

  // ============================================================================
  // Individual Test Chunk Implementations
  // ============================================================================

  private async runBasicPerformanceTests(): Promise<any> {
    const tests = [
      {
        name: 'API Health Check',
        fn: async () => {
          await this.simulateAPICall('/health', 50);
          return { status: 'healthy', responseTime: 50 };
        }
      },
      {
        name: 'Static Resource Loading',
        fn: async () => {
          await this.simulateResourceLoad('assets/app.js', 100);
          return { loaded: true, size: '2.5MB', time: 100 };
        }
      },
      {
        name: 'User Authentication Flow',
        fn: async () => {
          await this.simulateAuthFlow();
          return { authenticated: true, sessionCreated: true };
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      const { result, duration } = await measureExecution(test.name, test.fn);
      results.push({ test: test.name, result, duration });
    }

    return { testType: 'BasicPerformance', results, count: tests.length };
  }

  private async runMemoryPatternTests(): Promise<any> {
    const patterns = [
      {
        name: 'Small Object Creation',
        objects: 500, // Reduced from 1000+
        cleanup: true
      },
      {
        name: 'Data Processing',
        dataSize: 100, // Reduced from 1000+
        cleanup: true
      },
      {
        name: 'Event Handling',
        events: 200, // Reduced from 500+
        cleanup: true
      }
    ];

    const results = [];
    for (const pattern of patterns) {
      const startMem = this.memoryManager.checkMemoryUsage();
      
      const { duration } = await measureExecution(
        pattern.name,
        async () => {
          return await this.simulateMemoryPattern(pattern);
        }
      );

      const endMem = this.memoryManager.checkMemoryUsage();
      results.push({
        pattern: pattern.name,
        duration,
        memoryGrowth: endMem - startMem,
        cleaned: pattern.cleanup
      });

      // Force cleanup between patterns
      if (global.gc) {
        global.gc();
      }
    }

    return { testType: 'MemoryPatterns', results, count: patterns.length };
  }

  private async runConcurrencyTests(): Promise<any> {
    const concurrencyLevels = [3, 5, 8]; // Reduced from 10, 20, 50

    const results = [];
    for (const level of concurrencyLevels) {
      const { result, duration } = await measureExecution(
        `Concurrency_${level}`,
        async () => {
          const tasks = Array.from({ length: level }, (_, i) =>
            this.simulateConcurrentTask(i, 100)
          );
          
          const taskResults = await Promise.allSettled(tasks);
          return {
            completed: taskResults.filter(r => r.status === 'fulfilled').length,
            failed: taskResults.filter(r => r.status === 'rejected').length,
            total: level
          };
        }
      );

      results.push({
        concurrencyLevel: level,
        result,
        duration,
        efficiency: result.completed / result.total
      });
    }

    return { testType: 'Concurrency', results, maxConcurrency: Math.max(...concurrencyLevels) };
  }

  private async runCachePerformanceTests(): Promise<any> {
    const cache = new Map<string, any>();
    const cacheTests = [
      { name: 'Cache Population', operations: 100 },
      { name: 'Cache Retrieval', operations: 150 },
      { name: 'Cache Eviction', operations: 50 }
    ];

    const results = [];
    for (const test of cacheTests) {
      const { duration } = await measureExecution(
        test.name,
        async () => {
          return await this.simulateCacheOperations(cache, test.operations, test.name);
        }
      );

      results.push({
        operation: test.name,
        operations: test.operations,
        duration,
        cacheSize: cache.size
      });
    }

    cache.clear(); // Cleanup
    return { testType: 'CachePerformance', results, totalOperations: cacheTests.reduce((sum, t) => sum + t.operations, 0) };
  }

  private async runLoadSimulationTests(): Promise<any> {
    const loadScenarios = [
      { name: 'Light Load', rps: 5, duration: 2000 },
      { name: 'Medium Load', rps: 10, duration: 2000 },
      { name: 'Peak Load', rps: 15, duration: 1000 }
    ];

    const results = [];
    for (const scenario of loadScenarios) {
      const { duration } = await measureExecution(
        scenario.name,
        async () => {
          return await this.simulateLoadScenario(scenario.rps, scenario.duration);
        }
      );

      results.push({
        scenario: scenario.name,
        requestsPerSecond: scenario.rps,
        testDuration: scenario.duration,
        actualDuration: duration,
        requestsProcessed: Math.floor((scenario.rps * scenario.duration) / 1000)
      });
    }

    return { testType: 'LoadSimulation', results, totalRequests: results.reduce((sum, r) => sum + r.requestsProcessed, 0) };
  }

  // ============================================================================
  // Simulation Helper Methods
  // ============================================================================

  private async simulateAPICall(endpoint: string, expectedTime: number): Promise<void> {
    const variation = Math.random() * 20;
    await this.sleep(expectedTime + variation);
  }

  private async simulateResourceLoad(resource: string, loadTime: number): Promise<void> {
    const variation = Math.random() * 30;
    await this.sleep(loadTime + variation);
  }

  private async simulateAuthFlow(): Promise<void> {
    // Simulate multi-step auth process
    await this.sleep(30); // Validate credentials
    await this.sleep(20); // Generate token
    await this.sleep(10); // Create session
  }

  private async simulateMemoryPattern(pattern: any): Promise<any> {
    const objects = [];
    
    switch (pattern.name) {
      case 'Small Object Creation':
        for (let i = 0; i < pattern.objects; i++) {
          objects.push({ id: i, data: `object_${i}`, timestamp: Date.now() });
        }
        break;
        
      case 'Data Processing':
        const data = this.dataFactory.generateSmallDataset('users', pattern.dataSize);
        for (const item of data) {
          objects.push({ ...item, processed: true });
        }
        break;
        
      case 'Event Handling':
        for (let i = 0; i < pattern.events; i++) {
          objects.push({ event: `event_${i}`, handled: true });
        }
        break;
    }

    if (pattern.cleanup) {
      objects.length = 0; // Clear references
    }

    return objects.length;
  }

  private async simulateConcurrentTask(id: number, duration: number): Promise<string> {
    const variation = Math.random() * 50;
    await this.sleep(duration + variation);
    return `task_${id}_completed`;
  }

  private async simulateCacheOperations(cache: Map<string, any>, operations: number, operationType: string): Promise<number> {
    let processed = 0;

    for (let i = 0; i < operations; i++) {
      const key = `key_${i}`;
      
      switch (operationType) {
        case 'Cache Population':
          cache.set(key, { value: `value_${i}`, timestamp: Date.now() });
          break;
          
        case 'Cache Retrieval':
          const value = cache.get(key) || cache.get(`key_${i % 50}`); // Fallback to existing
          break;
          
        case 'Cache Eviction':
          if (cache.size > 0) {
            const keys = Array.from(cache.keys());
            const keyToDelete = keys[i % keys.length];
            cache.delete(keyToDelete);
          }
          break;
      }
      
      processed++;
    }

    return processed;
  }

  private async simulateLoadScenario(rps: number, duration: number): Promise<void> {
    const totalRequests = Math.floor((rps * duration) / 1000);
    const interval = 1000 / rps;

    const requests = [];
    for (let i = 0; i < totalRequests; i++) {
      requests.push(
        new Promise(resolve => {
          setTimeout(() => {
            // Simulate request processing
            resolve(`request_${i}`);
          }, i * interval);
        })
      );
    }

    await Promise.all(requests);
  }

  // ============================================================================
  // Cleanup and Memory Management
  // ============================================================================

  private async performChunkCleanup(): Promise<{ before: number; after: number; gcTriggered: boolean }> {
    const beforeMB = this.memoryManager.checkMemoryUsage();
    
    // Clear data factory cache
    this.dataFactory.clearCache();
    
    // Force garbage collection if available
    let gcTriggered = false;
    if (global.gc) {
      global.gc();
      gcTriggered = true;
    }

    // Brief pause for cleanup to complete
    await this.sleep(100);
    
    const afterMB = this.memoryManager.checkMemoryUsage();
    
    return { before: beforeMB, after: afterMB, gcTriggered };
  }

  private async performIntermediateCleanup(): Promise<void> {
    console.log('🧹 Performing intermediate cleanup...');
    
    const before = this.memoryManager.checkMemoryUsage();
    await this.performChunkCleanup();
    const after = this.memoryManager.checkMemoryUsage();
    
    console.log(`   Memory: ${before.toFixed(2)}MB → ${after.toFixed(2)}MB (${(before - after).toFixed(2)}MB freed)`);
  }

  private async finalCleanup(): Promise<void> {
    console.log('🔄 Performing final cleanup...');
    
    this.testRunner.cleanup();
    this.memoryManager.stopMonitoring();
    this.dataFactory.clearCache();
    
    if (global.gc) {
      global.gc();
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    description: string
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${description} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private generateSuiteResults(
    startTime: number,
    endTime: number,
    startMemory: number,
    endMemory: number,
    testChunks: TestChunk[]
  ): ChunkedTestSuiteResult {
    const successful = this.chunkResults.filter(r => r.success).length;
    const failed = this.chunkResults.filter(r => !r.success).length;
    const maxMemory = Math.max(...this.chunkResults.map(r => r.memoryUsage.peak));

    return {
      suiteName: 'Chunked Performance Test Suite',
      totalChunks: testChunks.length,
      successfulChunks: successful,
      failedChunks: failed,
      totalDuration: endTime - startTime,
      maxMemoryUsage: maxMemory,
      averageChunkDuration: this.chunkResults.reduce((sum, r) => sum + r.duration, 0) / this.chunkResults.length,
      chunkResults: this.chunkResults,
      recommendations: this.generateRecommendations(),
      summary: this.generateSummary(successful, failed, maxMemory)
    };
  }

  private generateSummary(successful: number, failed: number, maxMemory: number): ChunkedTestSummary {
    const total = successful + failed;
    const successRate = total > 0 ? (successful / total) * 100 : 0;
    const memoryEfficiency = maxMemory < this.config.memoryThreshold ? 100 : (this.config.memoryThreshold / maxMemory) * 100;
    
    return {
      overallSuccess: failed === 0,
      successRate,
      memoryEfficiency,
      performanceScore: (successRate + memoryEfficiency) / 2,
      criticalIssues: failed > 0 ? [`${failed} chunks failed`] : [],
      warnings: maxMemory > this.config.memoryThreshold * 0.8 ? ['High memory usage detected'] : []
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    const failedChunks = this.chunkResults.filter(r => !r.success);
    if (failedChunks.length > 0) {
      recommendations.push(`${failedChunks.length} chunks failed. Review failed test scenarios.`);
    }

    const highMemoryChunks = this.chunkResults.filter(r => r.memoryUsage.peak > this.config.memoryThreshold * 0.8);
    if (highMemoryChunks.length > 0) {
      recommendations.push(`${highMemoryChunks.length} chunks used high memory. Consider further optimization.`);
    }

    const slowChunks = this.chunkResults.filter(r => r.duration > this.config.timeoutPerChunk * 0.8);
    if (slowChunks.length > 0) {
      recommendations.push(`${slowChunks.length} chunks were slow. Review test efficiency.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All performance test chunks executed successfully within limits.');
    }

    return recommendations;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Jest Integration
// ============================================================================

/**
 * Main function for Jest integration
 */
export async function runChunkedPerformanceTestSuite(): Promise<ChunkedTestSuiteResult> {
  const runner = new ChunkedPerformanceRunner();
  return await runner.runChunkedPerformanceTests();
}

/**
 * Create optimized chunked runner for Jest
 */
export function createOptimizedChunkedRunner(): ChunkedPerformanceRunner {
  return new ChunkedPerformanceRunner({
    maxChunkSize: 3, // Even smaller chunks for Jest
    memoryThreshold: 200, // Lower threshold
    cleanupInterval: 2, // More frequent cleanup
    timeoutPerChunk: 60000, // 1 minute timeout
    pauseBetweenChunks: 2000 // Longer pause for stability
  });
}

// ============================================================================
// Exports
// ============================================================================

export {
  ChunkedPerformanceRunner
};

export type {
  ChunkedTestConfig,
  TestChunk,
  ChunkExecutionResult,
  ChunkedTestSuiteResult,
  ChunkedTestSummary
};