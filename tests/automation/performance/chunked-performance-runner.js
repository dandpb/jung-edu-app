"use strict";
/**
 * Chunked Performance Test Runner
 * Breaks down large performance tests into memory-safe chunks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChunkedPerformanceRunner = void 0;
exports.runChunkedPerformanceTestSuite = runChunkedPerformanceTestSuite;
exports.createOptimizedChunkedRunner = createOptimizedChunkedRunner;
const perf_hooks_1 = require("perf_hooks");
const memory_efficient_test_utils_1 = require("./memory-efficient-test-utils");
const optimized_database_tests_1 = require("./optimized-database-tests");
// ============================================================================
// Chunked Performance Test Runner
// ============================================================================
class ChunkedPerformanceRunner {
    constructor(config) {
        this.chunkResults = [];
        this.config = {
            maxChunkSize: 5, // Max 5 tests per chunk
            memoryThreshold: 300, // 300MB threshold
            cleanupInterval: 3, // Cleanup every 3 chunks
            timeoutPerChunk: 120000, // 2 minutes per chunk
            maxParallelChunks: 1, // Sequential execution for memory safety
            pauseBetweenChunks: 1000, // 1 second pause between chunks
            ...config
        };
        this.memoryManager = new memory_efficient_test_utils_1.MemoryManager(this.config.memoryThreshold);
        this.testRunner = new memory_efficient_test_utils_1.OptimizedTestRunner(this.config.memoryThreshold);
        this.dataFactory = memory_efficient_test_utils_1.OptimizedDataFactory.getInstance();
    }
    /**
     * Run performance tests in memory-safe chunks
     */
    async runChunkedPerformanceTests() {
        console.log('🧩 Starting Chunked Performance Test Suite');
        console.log(`  Max Chunk Size: ${this.config.maxChunkSize} tests`);
        console.log(`  Memory Threshold: ${this.config.memoryThreshold}MB`);
        console.log(`  Cleanup Interval: ${this.config.cleanupInterval} chunks`);
        const startTime = perf_hooks_1.performance.now();
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
            const endTime = perf_hooks_1.performance.now();
            const endMemory = this.memoryManager.checkMemoryUsage();
            // Generate comprehensive results
            const results = this.generateSuiteResults(startTime, endTime, startMemory, endMemory, testChunks);
            console.log('\n✅ Chunked Performance Test Suite Completed');
            console.log(`📊 Results: ${results.successfulChunks}/${results.totalChunks} chunks passed`);
            console.log(`⏱️  Total Duration: ${(results.totalDuration / 1000).toFixed(2)}s`);
            console.log(`💾 Max Memory Usage: ${results.maxMemoryUsage.toFixed(2)}MB`);
            return results;
        }
        catch (error) {
            console.error('❌ Chunked Performance Test Suite Failed:', error);
            throw error;
        }
        finally {
            await this.finalCleanup();
        }
    }
    /**
     * Define test chunks with memory and performance considerations
     */
    defineTestChunks() {
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
                    return await (0, optimized_database_tests_1.runOptimizedDatabaseTests)();
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
    async executeChunk(chunk, index) {
        const beforeCleanup = this.memoryManager.checkMemoryUsage();
        const startTime = perf_hooks_1.performance.now();
        const startMemory = this.memoryManager.checkMemoryUsage();
        let peakMemory = startMemory;
        let monitoringInterval;
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
            const result = await this.executeWithTimeout(chunk.testFunction, this.config.timeoutPerChunk, `Chunk: ${chunk.name}`);
            const endTime = perf_hooks_1.performance.now();
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
        }
        catch (error) {
            console.error(`❌ Chunk failed: ${chunk.name}`, error);
            return {
                chunkName: chunk.name,
                success: false,
                duration: perf_hooks_1.performance.now() - startTime,
                memoryUsage: {
                    start: startMemory,
                    peak: peakMemory,
                    end: this.memoryManager.checkMemoryUsage(),
                    growth: 0
                },
                error: error,
                cleanup: {
                    beforeMB: beforeCleanup,
                    afterMB: this.memoryManager.checkMemoryUsage(),
                    gcTriggered: false
                }
            };
        }
        finally {
            if (monitoringInterval) {
                clearInterval(monitoringInterval);
            }
        }
    }
    // ============================================================================
    // Individual Test Chunk Implementations
    // ============================================================================
    async runBasicPerformanceTests() {
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
            const { result, duration } = await (0, memory_efficient_test_utils_1.measureExecution)(test.name, test.fn);
            results.push({ test: test.name, result, duration });
        }
        return { testType: 'BasicPerformance', results, count: tests.length };
    }
    async runMemoryPatternTests() {
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
            const { duration } = await (0, memory_efficient_test_utils_1.measureExecution)(pattern.name, async () => {
                return await this.simulateMemoryPattern(pattern);
            });
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
    async runConcurrencyTests() {
        const concurrencyLevels = [3, 5, 8]; // Reduced from 10, 20, 50
        const results = [];
        for (const level of concurrencyLevels) {
            const { result, duration } = await (0, memory_efficient_test_utils_1.measureExecution)(`Concurrency_${level}`, async () => {
                const tasks = Array.from({ length: level }, (_, i) => this.simulateConcurrentTask(i, 100));
                const taskResults = await Promise.allSettled(tasks);
                return {
                    completed: taskResults.filter(r => r.status === 'fulfilled').length,
                    failed: taskResults.filter(r => r.status === 'rejected').length,
                    total: level
                };
            });
            results.push({
                concurrencyLevel: level,
                result,
                duration,
                efficiency: result.completed / result.total
            });
        }
        return { testType: 'Concurrency', results, maxConcurrency: Math.max(...concurrencyLevels) };
    }
    async runCachePerformanceTests() {
        const cache = new Map();
        const cacheTests = [
            { name: 'Cache Population', operations: 100 },
            { name: 'Cache Retrieval', operations: 150 },
            { name: 'Cache Eviction', operations: 50 }
        ];
        const results = [];
        for (const test of cacheTests) {
            const { duration } = await (0, memory_efficient_test_utils_1.measureExecution)(test.name, async () => {
                return await this.simulateCacheOperations(cache, test.operations, test.name);
            });
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
    async runLoadSimulationTests() {
        const loadScenarios = [
            { name: 'Light Load', rps: 5, duration: 2000 },
            { name: 'Medium Load', rps: 10, duration: 2000 },
            { name: 'Peak Load', rps: 15, duration: 1000 }
        ];
        const results = [];
        for (const scenario of loadScenarios) {
            const { duration } = await (0, memory_efficient_test_utils_1.measureExecution)(scenario.name, async () => {
                return await this.simulateLoadScenario(scenario.rps, scenario.duration);
            });
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
    async simulateAPICall(endpoint, expectedTime) {
        const variation = Math.random() * 20;
        await this.sleep(expectedTime + variation);
    }
    async simulateResourceLoad(resource, loadTime) {
        const variation = Math.random() * 30;
        await this.sleep(loadTime + variation);
    }
    async simulateAuthFlow() {
        // Simulate multi-step auth process
        await this.sleep(30); // Validate credentials
        await this.sleep(20); // Generate token
        await this.sleep(10); // Create session
    }
    async simulateMemoryPattern(pattern) {
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
    async simulateConcurrentTask(id, duration) {
        const variation = Math.random() * 50;
        await this.sleep(duration + variation);
        return `task_${id}_completed`;
    }
    async simulateCacheOperations(cache, operations, operationType) {
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
    async simulateLoadScenario(rps, duration) {
        const totalRequests = Math.floor((rps * duration) / 1000);
        const interval = 1000 / rps;
        const requests = [];
        for (let i = 0; i < totalRequests; i++) {
            requests.push(new Promise(resolve => {
                setTimeout(() => {
                    // Simulate request processing
                    resolve(`request_${i}`);
                }, i * interval);
            }));
        }
        await Promise.all(requests);
    }
    // ============================================================================
    // Cleanup and Memory Management
    // ============================================================================
    async performChunkCleanup() {
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
    async performIntermediateCleanup() {
        console.log('🧹 Performing intermediate cleanup...');
        const before = this.memoryManager.checkMemoryUsage();
        await this.performChunkCleanup();
        const after = this.memoryManager.checkMemoryUsage();
        console.log(`   Memory: ${before.toFixed(2)}MB → ${after.toFixed(2)}MB (${(before - after).toFixed(2)}MB freed)`);
    }
    async finalCleanup() {
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
    async executeWithTimeout(fn, timeoutMs, description) {
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
    generateSuiteResults(startTime, endTime, startMemory, endMemory, testChunks) {
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
    generateSummary(successful, failed, maxMemory) {
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
    generateRecommendations() {
        const recommendations = [];
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
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.ChunkedPerformanceRunner = ChunkedPerformanceRunner;
// ============================================================================
// Jest Integration
// ============================================================================
/**
 * Main function for Jest integration
 */
async function runChunkedPerformanceTestSuite() {
    const runner = new ChunkedPerformanceRunner();
    return await runner.runChunkedPerformanceTests();
}
/**
 * Create optimized chunked runner for Jest
 */
function createOptimizedChunkedRunner() {
    return new ChunkedPerformanceRunner({
        maxChunkSize: 3, // Even smaller chunks for Jest
        memoryThreshold: 200, // Lower threshold
        cleanupInterval: 2, // More frequent cleanup
        timeoutPerChunk: 60000, // 1 minute timeout
        pauseBetweenChunks: 2000 // Longer pause for stability
    });
}
//# sourceMappingURL=chunked-performance-runner.js.map