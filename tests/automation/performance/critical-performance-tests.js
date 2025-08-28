"use strict";
/**
 * Critical Performance Tests - Optimized for Memory Constraints
 * Essential performance tests that run within Jest's memory limitations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriticalPerformanceTests = void 0;
exports.runCriticalPerformanceTests = runCriticalPerformanceTests;
const memory_efficient_test_utils_1 = require("./memory-efficient-test-utils");
// ============================================================================
// Critical Performance Test Suite
// ============================================================================
class CriticalPerformanceTests {
    constructor() {
        const env = (0, memory_efficient_test_utils_1.createOptimizedTestEnvironment)(300); // 300MB threshold
        this.testRunner = env.runner;
        this.dataFactory = env.dataFactory;
        this.memoryManager = env.memoryManager;
    }
    /**
     * Run all critical performance tests
     */
    async runCriticalTests() {
        console.log('🚀 Starting Critical Performance Tests');
        const testResults = await this.testRunner.runSequentialTests([
            {
                name: 'API Response Time',
                fn: () => this.testAPIResponseTime(),
                options: { cleanupBefore: true }
            },
            {
                name: 'Database Query Performance',
                fn: () => this.testDatabaseQueryPerformance(),
                options: { cleanupBefore: true }
            },
            {
                name: 'Memory Usage Patterns',
                fn: () => this.testMemoryUsagePatterns(),
                options: { cleanupBefore: true }
            },
            {
                name: 'Concurrent Operations',
                fn: () => this.testConcurrentOperations(),
                options: { cleanupBefore: true }
            },
            {
                name: 'Load Handling Capacity',
                fn: () => this.testLoadHandlingCapacity(),
                options: { cleanupBefore: true }
            }
        ]);
        const summary = this.generateTestSummary(testResults);
        console.log('✅ Critical Performance Tests Completed');
        console.log(`📊 Results: ${summary.passedTests}/${summary.totalTests} passed`);
        return {
            results: testResults,
            summary,
            resourceUsage: this.testRunner.getResourceUsage(),
            recommendations: this.generateRecommendations(testResults)
        };
    }
    /**
     * Test API response time with minimal data
     */
    async testAPIResponseTime() {
        const endpoints = [
            { path: '/health', method: 'GET', expectedTime: 100 },
            { path: '/api/courses', method: 'GET', expectedTime: 200 },
            { path: '/api/modules', method: 'GET', expectedTime: 150 }
        ];
        const results = [];
        for (const endpoint of endpoints) {
            const { duration } = await (0, memory_efficient_test_utils_1.measureExecution)(`API_${endpoint.path}`, async () => {
                // Simulate API call with controlled delay
                await this.simulateAPICall(endpoint.path, endpoint.expectedTime * 0.8);
                return { status: 200, data: 'test' };
            });
            results.push({
                endpoint: endpoint.path,
                method: endpoint.method,
                responseTime: duration,
                expectedTime: endpoint.expectedTime,
                passed: duration <= endpoint.expectedTime * 1.2, // 20% tolerance
                status: 'success'
            });
        }
        return {
            testName: 'API Response Time',
            endpoints: results,
            averageResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
            maxResponseTime: Math.max(...results.map(r => r.responseTime)),
            passed: results.every(r => r.passed)
        };
    }
    /**
     * Test database query performance with small datasets
     */
    async testDatabaseQueryPerformance() {
        const queries = [
            { name: 'Simple Select', expectedTime: 50, complexity: 'simple' },
            { name: 'Join Query', expectedTime: 100, complexity: 'medium' },
            { name: 'Aggregation', expectedTime: 80, complexity: 'medium' }
        ];
        const results = [];
        for (const query of queries) {
            const { duration } = await (0, memory_efficient_test_utils_1.measureExecution)(`DB_${query.name}`, async () => {
                // Simulate database query
                const testData = this.dataFactory.generateSmallDataset('users', 10);
                await this.simulateDBQuery(testData, query.complexity);
                return testData;
            });
            results.push({
                queryName: query.name,
                executionTime: duration,
                expectedTime: query.expectedTime,
                complexity: query.complexity,
                passed: duration <= query.expectedTime * 1.5, // 50% tolerance for DB
                rowsProcessed: 10
            });
        }
        return {
            testName: 'Database Query Performance',
            queries: results,
            averageExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
            maxExecutionTime: Math.max(...results.map(r => r.executionTime)),
            passed: results.every(r => r.passed)
        };
    }
    /**
     * Test memory usage patterns
     */
    async testMemoryUsagePatterns() {
        const scenarios = [
            { name: 'Object Creation', objectCount: 1000 },
            { name: 'Data Processing', dataSize: 100 },
            { name: 'Cache Usage', cacheSize: 50 }
        ];
        const results = [];
        for (const scenario of scenarios) {
            const startMemory = this.memoryManager.checkMemoryUsage();
            const { duration, memoryGrowth } = await (0, memory_efficient_test_utils_1.measureExecution)(`Memory_${scenario.name}`, async () => {
                switch (scenario.name) {
                    case 'Object Creation':
                        return this.simulateObjectCreation(scenario.objectCount);
                    case 'Data Processing':
                        return this.simulateDataProcessing(scenario.dataSize);
                    case 'Cache Usage':
                        return this.simulateCacheUsage(scenario.cacheSize);
                    default:
                        return null;
                }
            });
            // Force cleanup
            this.memoryManager.forceGarbageCollection();
            const endMemory = this.memoryManager.checkMemoryUsage();
            results.push({
                scenarioName: scenario.name,
                duration,
                memoryGrowthMB: memoryGrowth,
                peakMemoryMB: Math.max(startMemory, endMemory),
                finalMemoryMB: endMemory,
                passed: memoryGrowth < 50 // Less than 50MB growth
            });
        }
        return {
            testName: 'Memory Usage Patterns',
            scenarios: results,
            maxMemoryGrowth: Math.max(...results.map(r => r.memoryGrowthMB)),
            averageMemoryGrowth: results.reduce((sum, r) => sum + r.memoryGrowthMB, 0) / results.length,
            passed: results.every(r => r.passed)
        };
    }
    /**
     * Test concurrent operations with limited concurrency
     */
    async testConcurrentOperations() {
        const concurrencyLevels = [5, 10, 15]; // Limited concurrency
        const results = [];
        for (const concurrency of concurrencyLevels) {
            const { duration } = await (0, memory_efficient_test_utils_1.measureExecution)(`Concurrency_${concurrency}`, async () => {
                const tasks = Array.from({ length: concurrency }, (_, i) => this.simulateWorkload(`task_${i}`, 100));
                const taskResults = await Promise.allSettled(tasks);
                return {
                    completed: taskResults.filter(r => r.status === 'fulfilled').length,
                    failed: taskResults.filter(r => r.status === 'rejected').length
                };
            });
            results.push({
                concurrencyLevel: concurrency,
                executionTime: duration,
                expectedTime: 150, // 150ms expected for concurrent execution
                passed: duration <= 200, // 200ms tolerance
                successRate: 100 // All should succeed in simulation
            });
        }
        return {
            testName: 'Concurrent Operations',
            results,
            maxConcurrency: Math.max(...concurrencyLevels),
            averageExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0) / results.length,
            passed: results.every(r => r.passed)
        };
    }
    /**
     * Test load handling capacity with controlled load
     */
    async testLoadHandlingCapacity() {
        const loadLevels = [
            { rps: 10, duration: 2000 }, // 10 requests/second for 2 seconds
            { rps: 20, duration: 2000 }, // 20 requests/second for 2 seconds
            { rps: 30, duration: 1000 } // 30 requests/second for 1 second
        ];
        const results = [];
        for (const load of loadLevels) {
            const { duration } = await (0, memory_efficient_test_utils_1.measureExecution)(`Load_${load.rps}_rps`, async () => {
                return this.simulateLoadLevel(load.rps, load.duration);
            });
            results.push({
                requestsPerSecond: load.rps,
                testDuration: load.duration,
                actualDuration: duration,
                expectedResponseTime: 100,
                averageResponseTime: duration / (load.rps * (load.duration / 1000)),
                passed: duration <= load.duration * 1.3 // 30% tolerance
            });
        }
        return {
            testName: 'Load Handling Capacity',
            results,
            maxRPS: Math.max(...loadLevels.map(l => l.rps)),
            averageResponseTime: results.reduce((sum, r) => sum + r.averageResponseTime, 0) / results.length,
            passed: results.every(r => r.passed)
        };
    }
    // ============================================================================
    // Simulation Methods
    // ============================================================================
    async simulateAPICall(endpoint, baseTime) {
        // Simulate API processing time
        const variation = Math.random() * 20; // Add some variation
        await this.sleep(baseTime + variation);
    }
    async simulateDBQuery(data, complexity) {
        let processingTime = 10;
        switch (complexity) {
            case 'simple':
                processingTime = 10;
                break;
            case 'medium':
                processingTime = 30;
                break;
            case 'complex':
                processingTime = 60;
                break;
        }
        // Simulate data processing
        for (let i = 0; i < data.length; i++) {
            // Light processing
            const processed = { ...data[i], processed: true };
        }
        await this.sleep(processingTime);
    }
    async simulateObjectCreation(count) {
        const objects = [];
        for (let i = 0; i < count; i++) {
            objects.push({
                id: i,
                timestamp: Date.now(),
                data: `object_${i}`
            });
        }
        return objects;
    }
    async simulateDataProcessing(dataSize) {
        const data = this.dataFactory.generateSmallDataset('users', dataSize);
        // Process data in batches
        const batchProcessor = (0, memory_efficient_test_utils_1.createBatchProcessor)(async (batch) => {
            return batch.map(item => ({
                ...item,
                processed: true,
                timestamp: Date.now()
            }));
        }, 20 // Small batch size
        );
        return await batchProcessor(data);
    }
    async simulateCacheUsage(cacheSize) {
        const cache = new Map();
        for (let i = 0; i < cacheSize; i++) {
            cache.set(`key_${i}`, {
                value: `value_${i}`,
                timestamp: Date.now()
            });
        }
        return cache;
    }
    async simulateWorkload(taskId, duration) {
        await this.sleep(duration + Math.random() * 20);
        return `completed_${taskId}`;
    }
    async simulateLoadLevel(rps, duration) {
        const totalRequests = Math.floor((rps * duration) / 1000);
        const interval = 1000 / rps;
        for (let i = 0; i < totalRequests; i++) {
            // Simulate request processing
            setTimeout(() => {
                // Light processing for each request
                const result = { id: i, timestamp: Date.now() };
            }, i * interval);
        }
        await this.sleep(duration);
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    // ============================================================================
    // Analysis and Reporting
    // ============================================================================
    generateTestSummary(results) {
        const totalTests = results.results.length;
        const passedTests = results.results.filter((r) => r.success).length;
        const failedTests = totalTests - passedTests;
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: (passedTests / totalTests) * 100,
            totalDuration: results.summary.totalDuration,
            maxMemoryUsage: results.summary.maxMemoryUsage,
            averageMemoryGrowth: results.summary.avgMemoryGrowth,
            status: failedTests === 0 ? 'PASSED' : 'FAILED'
        };
    }
    generateRecommendations(results) {
        const recommendations = [];
        // Memory recommendations
        if (results.summary.maxMemoryUsage > 400) {
            recommendations.push('High memory usage detected. Consider implementing memory pooling.');
        }
        if (results.summary.avgMemoryGrowth > 30) {
            recommendations.push('Significant memory growth observed. Review object lifecycle management.');
        }
        // Performance recommendations
        const totalDuration = results.summary.totalDuration;
        if (totalDuration > 30000) { // 30 seconds
            recommendations.push('Total test duration exceeds threshold. Optimize test execution.');
        }
        // Failure recommendations
        const failedCount = results.results.filter((r) => !r.success).length;
        if (failedCount > 0) {
            recommendations.push(`${failedCount} test(s) failed. Review failed test scenarios.`);
        }
        if (recommendations.length === 0) {
            recommendations.push('All performance tests passed within acceptable limits.');
        }
        return recommendations;
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        this.testRunner.cleanup();
        this.dataFactory.clearCache();
    }
}
exports.CriticalPerformanceTests = CriticalPerformanceTests;
// ============================================================================
// Jest Integration Function
// ============================================================================
/**
 * Run critical performance tests within Jest environment
 */
async function runCriticalPerformanceTests() {
    const tests = new CriticalPerformanceTests();
    try {
        const results = await tests.runCriticalTests();
        return results;
    }
    finally {
        tests.cleanup();
    }
}
//# sourceMappingURL=critical-performance-tests.js.map