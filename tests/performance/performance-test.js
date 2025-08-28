"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceUtils = exports.performanceAssertions = exports.PerformanceTester = void 0;
const perf_hooks_1 = require("perf_hooks");
const test_config_1 = require("../setup/test-config");
const api_client_1 = require("../utils/api-client");
const websocket_client_1 = require("../utils/websocket-client");
const test_helpers_1 = require("../utils/test-helpers");
class PerformanceTester {
    constructor(baseURL) {
        this.metrics = [];
        this.startTime = 0;
        this.apiClient = new api_client_1.APITestClient(baseURL);
    }
    async authenticate(role = 'student') {
        await this.apiClient.authenticateAsTestUser(role);
    }
    startMonitoring() {
        this.startTime = perf_hooks_1.performance.now();
        this.metrics = [];
    }
    recordMetrics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const metric = {
            responseTime: perf_hooks_1.performance.now() - this.startTime,
            throughput: 0, // Will be calculated later
            errorRate: 0, // Will be calculated later
            memoryUsage: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                rss: memUsage.rss
            },
            cpuUsage: {
                user: cpuUsage.user / 1000, // Convert to milliseconds
                system: cpuUsage.system / 1000
            }
        };
        this.metrics.push(metric);
        return metric;
    }
    async measureSingleRequest(requestFn) {
        const initialMemory = process.memoryUsage().heapUsed;
        const start = perf_hooks_1.performance.now();
        try {
            const result = await requestFn();
            const duration = perf_hooks_1.performance.now() - start;
            const finalMemory = process.memoryUsage().heapUsed;
            return {
                result,
                duration,
                memory: finalMemory - initialMemory
            };
        }
        catch (error) {
            const duration = perf_hooks_1.performance.now() - start;
            throw { error, duration };
        }
    }
    async runLoadTest(config) {
        const results = [];
        const startTime = perf_hooks_1.performance.now();
        console.log(`Starting load test: ${config.concurrent} concurrent users, ${config.requests} requests`);
        // Create worker function for concurrent requests
        const makeRequest = async () => {
            try {
                const requestStart = perf_hooks_1.performance.now();
                let response;
                switch (config.method) {
                    case 'GET':
                        response = await this.apiClient.get(config.endpoint, { headers: config.headers });
                        break;
                    case 'POST':
                        response = await this.apiClient.post(config.endpoint, config.payload, { headers: config.headers });
                        break;
                    case 'PUT':
                        response = await this.apiClient.put(config.endpoint, config.payload, { headers: config.headers });
                        break;
                    case 'DELETE':
                        response = await this.apiClient.delete(config.endpoint, { headers: config.headers });
                        break;
                }
                const duration = perf_hooks_1.performance.now() - requestStart;
                return { success: response.status < 400, duration };
            }
            catch (error) {
                const duration = perf_hooks_1.performance.now() - requestStart;
                return {
                    success: false,
                    duration,
                    error: error.response?.statusText || error.message
                };
            }
        };
        // Execute requests with controlled concurrency
        const batches = Math.ceil(config.requests / config.concurrent);
        for (let batch = 0; batch < batches; batch++) {
            const batchSize = Math.min(config.concurrent, config.requests - batch * config.concurrent);
            const promises = Array(batchSize).fill(null).map(() => makeRequest());
            const batchResults = await Promise.all(promises);
            results.push(...batchResults);
            // Ramp up delay
            if (config.rampUp && batch < batches - 1) {
                await test_helpers_1.timeHelpers.sleep((config.rampUp * 1000) / batches);
            }
        }
        const totalDuration = perf_hooks_1.performance.now() - startTime;
        // Calculate statistics
        const successfulResults = results.filter(r => r.success);
        const failedResults = results.filter(r => !r.success);
        const durations = results.map(r => r.duration).sort((a, b) => a - b);
        const errorCounts = {};
        failedResults.forEach(result => {
            const error = result.error || 'Unknown error';
            errorCounts[error] = (errorCounts[error] || 0) + 1;
        });
        const errors = Object.entries(errorCounts).map(([message, count]) => ({ message, count }));
        return {
            totalRequests: results.length,
            successfulRequests: successfulResults.length,
            failedRequests: failedResults.length,
            averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
            minResponseTime: durations[0] || 0,
            maxResponseTime: durations[durations.length - 1] || 0,
            requestsPerSecond: (results.length / totalDuration) * 1000,
            errorRate: (failedResults.length / results.length) * 100,
            percentiles: {
                p50: durations[Math.floor(durations.length * 0.5)] || 0,
                p75: durations[Math.floor(durations.length * 0.75)] || 0,
                p90: durations[Math.floor(durations.length * 0.9)] || 0,
                p95: durations[Math.floor(durations.length * 0.95)] || 0,
                p99: durations[Math.floor(durations.length * 0.99)] || 0
            },
            errors
        };
    }
    async runStressTest(config, maxConcurrent = 100, step = 10) {
        const results = [];
        for (let concurrent = step; concurrent <= maxConcurrent; concurrent += step) {
            console.log(`Running stress test with ${concurrent} concurrent users...`);
            const testConfig = {
                ...config,
                concurrent,
                requests: concurrent * 10 // Scale requests with concurrency
            };
            try {
                const result = await this.runLoadTest(testConfig);
                results.push(result);
                // Break if error rate is too high
                if (result.errorRate > 50) {
                    console.log(`Breaking stress test at ${concurrent} concurrent users due to high error rate`);
                    break;
                }
            }
            catch (error) {
                console.error(`Stress test failed at ${concurrent} concurrent users:`, error);
                break;
            }
            // Cool down period
            await test_helpers_1.timeHelpers.sleep(2000);
        }
        return results;
    }
    async measureEndpointPerformance(endpoint, samples = 100) {
        const measurements = [];
        let successes = 0;
        for (let i = 0; i < samples; i++) {
            try {
                const { duration } = await this.measureSingleRequest(() => this.apiClient.get(endpoint));
                measurements.push(duration);
                successes++;
            }
            catch (error) {
                console.warn(`Request ${i + 1} failed:`, error);
            }
            // Small delay to avoid overwhelming the server
            await test_helpers_1.timeHelpers.sleep(10);
        }
        measurements.sort((a, b) => a - b);
        return {
            average: measurements.reduce((sum, m) => sum + m, 0) / measurements.length,
            min: measurements[0] || 0,
            max: measurements[measurements.length - 1] || 0,
            percentiles: {
                p50: measurements[Math.floor(measurements.length * 0.5)] || 0,
                p75: measurements[Math.floor(measurements.length * 0.75)] || 0,
                p90: measurements[Math.floor(measurements.length * 0.9)] || 0,
                p95: measurements[Math.floor(measurements.length * 0.95)] || 0,
                p99: measurements[Math.floor(measurements.length * 0.99)] || 0
            },
            successRate: (successes / samples) * 100
        };
    }
    async testWebSocketPerformance(concurrent = 10, messagesPerConnection = 100) {
        const clients = [];
        const latencies = [];
        let successfulConnections = 0;
        let totalMessages = 0;
        const startTime = perf_hooks_1.performance.now();
        try {
            // Create concurrent connections
            for (let i = 0; i < concurrent; i++) {
                try {
                    const client = new websocket_client_1.WebSocketTestClient();
                    await client.connectWithAuth('student');
                    clients.push(client);
                    successfulConnections++;
                }
                catch (error) {
                    console.warn(`Failed to connect client ${i + 1}:`, error);
                }
            }
            // Send messages and measure latency
            const messagePromises = clients.map(async (client, clientIndex) => {
                for (let msgIndex = 0; msgIndex < messagesPerConnection; msgIndex++) {
                    try {
                        const msgStart = perf_hooks_1.performance.now();
                        await client.sendAndWait({
                            type: 'test_message',
                            data: { clientIndex, msgIndex }
                        });
                        const latency = perf_hooks_1.performance.now() - msgStart;
                        latencies.push(latency);
                        totalMessages++;
                    }
                    catch (error) {
                        console.warn(`Message failed for client ${clientIndex}:`, error);
                    }
                    // Small delay between messages
                    await test_helpers_1.timeHelpers.sleep(10);
                }
            });
            await Promise.all(messagePromises);
            const totalTime = perf_hooks_1.performance.now() - startTime;
            return {
                averageLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
                maxLatency: Math.max(...latencies),
                messagesPerSecond: (totalMessages / totalTime) * 1000,
                connectionSuccessRate: (successfulConnections / concurrent) * 100
            };
        }
        finally {
            // Cleanup connections
            clients.forEach(client => client.disconnect());
        }
    }
    async runEnduranceTest(endpoint, duration = 300000) {
        const startMemory = process.memoryUsage().heapUsed;
        const startTime = perf_hooks_1.performance.now();
        const endTime = startTime + duration;
        let totalRequests = 0;
        let successfulRequests = 0;
        let totalResponseTime = 0;
        const memorySnapshots = [];
        console.log(`Starting endurance test for ${duration / 1000} seconds...`);
        while (perf_hooks_1.performance.now() < endTime) {
            try {
                const { duration: responseTime } = await this.measureSingleRequest(() => this.apiClient.get(endpoint));
                totalRequests++;
                successfulRequests++;
                totalResponseTime += responseTime;
                // Take memory snapshot every 100 requests
                if (totalRequests % 100 === 0) {
                    memorySnapshots.push(process.memoryUsage().heapUsed);
                    // Force garbage collection if available
                    if (global.gc) {
                        global.gc();
                    }
                }
            }
            catch (error) {
                totalRequests++;
                console.warn(`Request ${totalRequests} failed:`, error);
            }
            // Short delay to avoid overwhelming
            await test_helpers_1.timeHelpers.sleep(100);
        }
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - startMemory;
        // Check for memory leak (> 50MB increase after GC)
        const memoryLeak = memoryIncrease > 50 * 1024 * 1024;
        return {
            totalRequests,
            averageResponseTime: totalResponseTime / successfulRequests,
            errorRate: ((totalRequests - successfulRequests) / totalRequests) * 100,
            memoryLeak,
            memoryIncrease
        };
    }
    generatePerformanceReport(results) {
        let report = '\n=== PERFORMANCE TEST REPORT ===\n\n';
        results.forEach((result, index) => {
            report += `Test ${index + 1}:\n`;
            report += `  Total Requests: ${result.totalRequests}\n`;
            report += `  Successful: ${result.successfulRequests} (${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%)\n`;
            report += `  Failed: ${result.failedRequests} (${result.errorRate.toFixed(2)}%)\n`;
            report += `  Average Response Time: ${result.averageResponseTime.toFixed(2)}ms\n`;
            report += `  Min/Max Response Time: ${result.minResponseTime.toFixed(2)}ms / ${result.maxResponseTime.toFixed(2)}ms\n`;
            report += `  Requests/Second: ${result.requestsPerSecond.toFixed(2)}\n`;
            report += `  Percentiles:\n`;
            report += `    50th: ${result.percentiles.p50.toFixed(2)}ms\n`;
            report += `    75th: ${result.percentiles.p75.toFixed(2)}ms\n`;
            report += `    90th: ${result.percentiles.p90.toFixed(2)}ms\n`;
            report += `    95th: ${result.percentiles.p95.toFixed(2)}ms\n`;
            report += `    99th: ${result.percentiles.p99.toFixed(2)}ms\n`;
            if (result.errors.length > 0) {
                report += `  Errors:\n`;
                result.errors.forEach(error => {
                    report += `    ${error.message}: ${error.count}\n`;
                });
            }
            report += '\n';
        });
        return report;
    }
}
exports.PerformanceTester = PerformanceTester;
// Performance test assertions
exports.performanceAssertions = {
    expectFastResponse: (duration, maxDuration = test_config_1.testConfig.performance.maxResponseTime) => {
        expect(duration).toBeLessThan(maxDuration);
    },
    expectHighThroughput: (requestsPerSecond, minThroughput = 100) => {
        expect(requestsPerSecond).toBeGreaterThanOrEqual(minThroughput);
    },
    expectLowErrorRate: (errorRate, maxErrorRate = 1) => {
        expect(errorRate).toBeLessThanOrEqual(maxErrorRate);
    },
    expectStableMemory: (memoryIncrease, maxIncrease = test_config_1.testConfig.performance.maxMemoryUsage) => {
        expect(memoryIncrease).toBeLessThan(maxIncrease);
    },
    expectAcceptableLatency: (averageLatency, maxLatency = 100) => {
        expect(averageLatency).toBeLessThan(maxLatency);
    },
    expectReliableConnections: (successRate, minSuccessRate = 95) => {
        expect(successRate).toBeGreaterThanOrEqual(minSuccessRate);
    }
};
// Utility functions
exports.performanceUtils = {
    createTester: (baseURL) => {
        return new PerformanceTester(baseURL);
    },
    benchmark: async (fn, iterations = 100) => {
        const times = [];
        const results = [];
        for (let i = 0; i < iterations; i++) {
            const start = perf_hooks_1.performance.now();
            const result = await fn();
            const duration = perf_hooks_1.performance.now() - start;
            times.push(duration);
            results.push(result);
        }
        return {
            averageTime: times.reduce((sum, t) => sum + t, 0) / times.length,
            minTime: Math.min(...times),
            maxTime: Math.max(...times),
            totalTime: times.reduce((sum, t) => sum + t, 0),
            results
        };
    }
};
exports.default = {
    PerformanceTester,
    performanceAssertions: exports.performanceAssertions,
    performanceUtils: exports.performanceUtils
};
//# sourceMappingURL=performance-test.js.map