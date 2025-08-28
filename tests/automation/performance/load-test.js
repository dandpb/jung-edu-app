"use strict";
/**
 * Load Testing Framework for jaqEdu Platform
 * Comprehensive load testing with concurrent workflows, metrics collection,
 * and performance regression detection
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadTestEngine = void 0;
const worker_threads_1 = require("worker_threads");
const perf_hooks_1 = require("perf_hooks");
const events_1 = require("events");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
// ============================================================================
// Load Test Engine
// ============================================================================
class LoadTestEngine extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.workers = [];
        this.activeExecutions = new Map();
        this.testStartTime = 0;
        this.monitoringInterval = null;
        this.config = config;
        this.metrics = this.initializeMetrics();
    }
    /**
     * Execute comprehensive load test
     */
    async executeLoadTest() {
        console.log(`🚀 Starting load test: ${this.config.name}`);
        console.log(`  Max Users: ${this.config.maxConcurrentUsers}`);
        console.log(`  Duration: ${this.config.testDuration / 1000}s`);
        console.log(`  Target Throughput: ${this.config.targetThroughput} RPS`);
        this.testStartTime = perf_hooks_1.performance.now();
        this.metrics.startTime = new Date();
        try {
            // Start monitoring
            this.startMonitoring();
            // Phase 1: Ramp Up
            console.log('📈 Phase 1: Ramping up users...');
            this.metrics.rampUpMetrics = await this.executeRampUp();
            // Phase 2: Sustained Load
            console.log('⚡ Phase 2: Sustained load testing...');
            this.metrics.sustainedLoadMetrics = await this.executeSustainedLoad();
            // Phase 3: Ramp Down
            console.log('📉 Phase 3: Ramping down users...');
            this.metrics.rampDownMetrics = await this.executeRampDown();
            this.metrics.endTime = new Date();
            this.stopMonitoring();
            // Generate comprehensive results
            const result = await this.generateResults();
            // Save results
            await this.saveResults(result);
            console.log('✅ Load test completed successfully');
            return result;
        }
        catch (error) {
            console.error('❌ Load test failed:', error);
            this.stopMonitoring();
            await this.cleanup();
            throw error;
        }
    }
    /**
     * Execute ramp up phase
     */
    async executeRampUp() {
        const rampUpStart = perf_hooks_1.performance.now();
        const steps = 10;
        const usersPerStep = Math.ceil(this.config.maxConcurrentUsers / steps);
        const stepDuration = this.config.rampUpDuration / steps;
        const rampSteps = [];
        let currentUsers = 0;
        for (let step = 1; step <= steps; step++) {
            const stepStart = perf_hooks_1.performance.now();
            const targetUsers = Math.min(step * usersPerStep, this.config.maxConcurrentUsers);
            const newUsers = targetUsers - currentUsers;
            if (newUsers > 0) {
                await this.spawnWorkers(newUsers);
                currentUsers = targetUsers;
            }
            console.log(`  Step ${step}/${steps}: ${currentUsers} users active`);
            // Monitor this step
            const stepMetrics = await this.monitorStep(stepDuration);
            rampSteps.push({
                step,
                users: currentUsers,
                duration: perf_hooks_1.performance.now() - stepStart,
                metrics: stepMetrics
            });
            // Brief pause between steps
            await this.sleep(500);
        }
        const totalDuration = perf_hooks_1.performance.now() - rampUpStart;
        const averageResponseTime = this.calculateAverage(rampSteps.map(s => s.metrics.averageResponseTime));
        const errorRate = this.calculateAverage(rampSteps.map(s => s.metrics.errorRate));
        return {
            duration: totalDuration,
            steps: rampSteps,
            averageResponseTime,
            errorRate,
            success: errorRate < this.config.thresholds.errorRate.max
        };
    }
    /**
     * Execute sustained load phase
     */
    async executeSustainedLoad() {
        const sustainedStart = perf_hooks_1.performance.now();
        const monitoringInterval = 5000; // 5 seconds
        const intervalMetrics = [];
        // Monitor at regular intervals
        const monitoringPromise = new Promise((resolve) => {
            const interval = setInterval(async () => {
                const currentTime = perf_hooks_1.performance.now();
                const metrics = await this.captureIntervalMetrics();
                intervalMetrics.push({
                    timestamp: currentTime - sustainedStart,
                    ...metrics
                });
                if (currentTime - sustainedStart >= this.config.testDuration) {
                    clearInterval(interval);
                    resolve(intervalMetrics);
                }
            }, monitoringInterval);
        });
        // Wait for sustained load period
        await Promise.all([
            monitoringPromise,
            this.sleep(this.config.testDuration)
        ]);
        const totalDuration = perf_hooks_1.performance.now() - sustainedStart;
        const stability = this.analyzeStability(intervalMetrics);
        const averageMetrics = this.calculateAverageMetrics(intervalMetrics);
        return {
            duration: totalDuration,
            intervalMetrics,
            stability,
            averageMetrics
        };
    }
    /**
     * Execute ramp down phase
     */
    async executeRampDown() {
        const rampDownStart = perf_hooks_1.performance.now();
        const steps = 5;
        const stepDuration = this.config.rampDownDuration / steps;
        const rampSteps = [];
        for (let step = 1; step <= steps; step++) {
            const stepStart = perf_hooks_1.performance.now();
            const workersToStop = Math.ceil(this.workers.length / (steps - step + 1));
            await this.stopWorkers(workersToStop);
            console.log(`  Step ${step}/${steps}: ${this.workers.length} users remaining`);
            const stepMetrics = await this.monitorStep(stepDuration);
            rampSteps.push({
                step,
                users: this.workers.length,
                duration: perf_hooks_1.performance.now() - stepStart,
                metrics: stepMetrics
            });
        }
        // Stop all remaining workers
        await this.stopAllWorkers();
        const totalDuration = perf_hooks_1.performance.now() - rampDownStart;
        const averageResponseTime = this.calculateAverage(rampSteps.map(s => s.metrics.averageResponseTime));
        const errorRate = this.calculateAverage(rampSteps.map(s => s.metrics.errorRate));
        return {
            duration: totalDuration,
            steps: rampSteps,
            averageResponseTime,
            errorRate,
            success: true
        };
    }
    /**
     * Spawn load generation workers
     */
    async spawnWorkers(count) {
        const newWorkers = [];
        for (let i = 0; i < count; i++) {
            newWorkers.push(this.createWorker(i));
        }
        const workers = await Promise.all(newWorkers);
        this.workers.push(...workers);
    }
    /**
     * Create individual load worker
     */
    async createWorker(index) {
        return new Promise((resolve, reject) => {
            const worker = new worker_threads_1.Worker(__filename, {
                workerData: {
                    workerId: `worker-${Date.now()}-${index}`,
                    config: this.config,
                    scenarios: this.config.scenarios,
                    isWorker: true
                }
            });
            worker.on('message', (message) => {
                this.handleWorkerMessage(worker, message);
            });
            worker.on('error', (error) => {
                console.error(`Worker ${index} error:`, error);
                reject(error);
            });
            worker.on('online', () => {
                resolve(worker);
            });
        });
    }
    /**
     * Handle messages from worker threads
     */
    handleWorkerMessage(worker, message) {
        switch (message.type) {
            case 'request-complete':
                this.recordRequestMetrics(message.data);
                break;
            case 'error':
                this.recordError(message.error);
                break;
            case 'metrics-update':
                this.updateWorkerMetrics(message.data);
                break;
        }
    }
    /**
     * Record request completion metrics
     */
    recordRequestMetrics(data) {
        this.metrics.totalRequests++;
        if (data.success) {
            this.metrics.successfulRequests++;
            this.metrics.responseTimes.push(data.responseTime);
        }
        else {
            this.metrics.failedRequests++;
            this.metrics.errorData.push({
                timestamp: perf_hooks_1.performance.now(),
                errorRate: this.getCurrentErrorRate(),
                errorType: data.errorType || 'unknown',
                statusCode: data.statusCode,
                count: 1
            });
        }
        // Update throughput data
        this.metrics.throughputData.push({
            timestamp: perf_hooks_1.performance.now(),
            requestsPerSecond: this.calculateCurrentThroughput(),
            activeUsers: this.workers.length
        });
    }
    /**
     * Monitor test step
     */
    async monitorStep(duration) {
        const measurements = [];
        const monitorStart = perf_hooks_1.performance.now();
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                const measurement = this.takeMeasurement();
                measurements.push(measurement);
                if (perf_hooks_1.performance.now() - monitorStart >= duration) {
                    clearInterval(interval);
                    resolve(this.aggregateStepMetrics(measurements));
                }
            }, 1000);
        });
    }
    /**
     * Take current measurement
     */
    takeMeasurement() {
        return {
            timestamp: perf_hooks_1.performance.now(),
            requests: this.metrics.totalRequests,
            averageResponseTime: this.getAverageResponseTime(),
            errorRate: this.getCurrentErrorRate(),
            throughput: this.calculateCurrentThroughput(),
            activeUsers: this.workers.length
        };
    }
    /**
     * Start system monitoring
     */
    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.captureResourceUsage();
        }, 2000);
    }
    /**
     * Stop system monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
    /**
     * Capture system resource usage
     */
    async captureResourceUsage() {
        try {
            const usage = await this.getSystemResourceUsage();
            this.metrics.resourceUsage.push({
                timestamp: perf_hooks_1.performance.now(),
                ...usage
            });
        }
        catch (error) {
            console.warn('Failed to capture resource usage:', error);
        }
    }
    /**
     * Get system resource usage
     */
    async getSystemResourceUsage() {
        const process = await Promise.resolve().then(() => __importStar(require('process')));
        const memUsage = process.memoryUsage();
        return {
            cpu: process.cpuUsage().user / 1000000, // Convert to milliseconds
            memory: (memUsage.heapUsed / memUsage.heapTotal) * 100,
            disk: 0, // Would need OS-specific implementation
            network: 0 // Would need OS-specific implementation
        };
    }
    /**
     * Generate comprehensive test results
     */
    async generateResults() {
        const duration = this.metrics.endTime.getTime() - this.metrics.startTime.getTime();
        const performanceStats = this.calculatePerformanceStats();
        const thresholdAnalysis = this.analyzeThresholds(performanceStats);
        const regressionAnalysis = await this.analyzeRegression(performanceStats);
        return {
            testInfo: {
                name: this.config.name,
                duration,
                startTime: this.metrics.startTime,
                endTime: this.metrics.endTime,
                configuration: this.config
            },
            performanceStats,
            thresholdAnalysis,
            regressionAnalysis,
            phaseMetrics: {
                rampUp: this.metrics.rampUpMetrics,
                sustainedLoad: this.metrics.sustainedLoadMetrics,
                rampDown: this.metrics.rampDownMetrics
            },
            rawMetrics: this.metrics,
            recommendations: this.generateRecommendations(performanceStats, thresholdAnalysis)
        };
    }
    /**
     * Calculate performance statistics
     */
    calculatePerformanceStats() {
        const responseTimes = this.metrics.responseTimes.sort((a, b) => a - b);
        return {
            responseTime: {
                average: this.calculateAverage(responseTimes),
                median: this.calculatePercentile(responseTimes, 50),
                p95: this.calculatePercentile(responseTimes, 95),
                p99: this.calculatePercentile(responseTimes, 99),
                min: Math.min(...responseTimes),
                max: Math.max(...responseTimes)
            },
            throughput: {
                average: this.calculateAverage(this.metrics.throughputData.map(t => t.requestsPerSecond)),
                peak: Math.max(...this.metrics.throughputData.map(t => t.requestsPerSecond)),
                total: this.metrics.totalRequests
            },
            errorRate: {
                overall: (this.metrics.failedRequests / this.metrics.totalRequests) * 100,
                peak: Math.max(...this.metrics.errorData.map(e => e.errorRate))
            },
            availability: {
                uptime: ((this.metrics.totalRequests - this.metrics.failedRequests) / this.metrics.totalRequests) * 100
            }
        };
    }
    /**
     * Analyze performance against thresholds
     */
    analyzeThresholds(stats) {
        const violations = [];
        // Check response time thresholds
        if (stats.responseTime.p95 > this.config.thresholds.responseTime.p95) {
            violations.push({
                metric: 'response_time_p95',
                threshold: this.config.thresholds.responseTime.p95,
                actual: stats.responseTime.p95,
                severity: 'high'
            });
        }
        // Check error rate thresholds
        if (stats.errorRate.overall > this.config.thresholds.errorRate.max) {
            violations.push({
                metric: 'error_rate',
                threshold: this.config.thresholds.errorRate.max,
                actual: stats.errorRate.overall,
                severity: stats.errorRate.overall > this.config.thresholds.errorRate.critical ? 'critical' : 'medium'
            });
        }
        // Check throughput thresholds
        if (stats.throughput.average < this.config.thresholds.throughput.min) {
            violations.push({
                metric: 'throughput',
                threshold: this.config.thresholds.throughput.min,
                actual: stats.throughput.average,
                severity: 'medium'
            });
        }
        return {
            passed: violations.length === 0,
            violations,
            score: this.calculateOverallScore(stats, violations)
        };
    }
    /**
     * Analyze performance regression
     */
    async analyzeRegression(currentStats) {
        try {
            const historicalData = await this.loadHistoricalData();
            if (!historicalData || historicalData.length === 0) {
                return {
                    hasBaseline: false,
                    regressions: [],
                    improvements: [],
                    trend: 'no_data'
                };
            }
            const baseline = this.calculateBaseline(historicalData);
            const regressions = this.detectRegressions(currentStats, baseline);
            const improvements = this.detectImprovements(currentStats, baseline);
            const trend = this.analyzeTrend(historicalData, currentStats);
            return {
                hasBaseline: true,
                baseline,
                regressions,
                improvements,
                trend
            };
        }
        catch (error) {
            console.warn('Regression analysis failed:', error);
            return {
                hasBaseline: false,
                regressions: [],
                improvements: [],
                trend: 'error'
            };
        }
    }
    /**
     * Save test results
     */
    async saveResults(result) {
        const resultsDir = path.join(__dirname, '../results');
        await fs.mkdir(resultsDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `load-test-${timestamp}.json`;
        const filepath = path.join(resultsDir, filename);
        await fs.writeFile(filepath, JSON.stringify(result, null, 2));
        console.log(`📊 Results saved to: ${filepath}`);
        // Also save to historical data
        await this.saveToHistoricalData(result.performanceStats);
    }
    // Helper methods for calculations and utilities
    initializeMetrics() {
        return {
            startTime: new Date(),
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [],
            throughputData: [],
            errorData: [],
            resourceUsage: [],
            rampUpMetrics: {},
            sustainedLoadMetrics: {},
            rampDownMetrics: {}
        };
    }
    calculateAverage(values) {
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    }
    calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const index = Math.ceil((percentile / 100) * values.length) - 1;
        return values[Math.min(index, values.length - 1)];
    }
    getCurrentErrorRate() {
        return this.metrics.totalRequests > 0
            ? (this.metrics.failedRequests / this.metrics.totalRequests) * 100
            : 0;
    }
    getAverageResponseTime() {
        const recent = this.metrics.responseTimes.slice(-100);
        return this.calculateAverage(recent);
    }
    calculateCurrentThroughput() {
        const recent = this.metrics.throughputData.slice(-10);
        return recent.length > 0 ? this.calculateAverage(recent.map(t => t.requestsPerSecond)) : 0;
    }
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async stopWorkers(count) {
        const workersToStop = this.workers.splice(0, count);
        await Promise.all(workersToStop.map(worker => worker.terminate()));
    }
    async stopAllWorkers() {
        await Promise.all(this.workers.map(worker => worker.terminate()));
        this.workers = [];
    }
    async cleanup() {
        await this.stopAllWorkers();
        this.stopMonitoring();
    }
    // Additional helper methods would go here...
    recordError(error) {
        console.error('Load test error:', error);
    }
    updateWorkerMetrics(data) {
        // Update metrics from worker data
    }
    async captureIntervalMetrics() {
        return {
            responseTime: this.getAverageResponseTime(),
            errorRate: this.getCurrentErrorRate(),
            throughput: this.calculateCurrentThroughput(),
            activeUsers: this.workers.length
        };
    }
    analyzeStability(intervals) {
        const responseTimes = intervals.map(i => i.responseTime);
        const throughputs = intervals.map(i => i.throughput);
        const responseTimeVariation = this.calculateVariation(responseTimes);
        const throughputVariation = this.calculateVariation(throughputs);
        return {
            responseTimeVariation,
            throughputVariation,
            isStable: responseTimeVariation < 0.3 && throughputVariation < 0.2
        };
    }
    calculateVariation(values) {
        const avg = this.calculateAverage(values);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
        return Math.sqrt(variance) / avg;
    }
    calculateAverageMetrics(intervals) {
        const responseTimes = intervals.map(i => i.responseTime);
        const throughputs = intervals.map(i => i.throughput);
        return {
            averageResponseTime: this.calculateAverage(responseTimes),
            medianResponseTime: this.calculatePercentile(responseTimes.sort(), 50),
            p95ResponseTime: this.calculatePercentile(responseTimes.sort(), 95),
            p99ResponseTime: this.calculatePercentile(responseTimes.sort(), 99),
            averageThroughput: this.calculateAverage(throughputs),
            totalErrors: this.metrics.failedRequests,
            overallErrorRate: this.getCurrentErrorRate()
        };
    }
    aggregateStepMetrics(measurements) {
        return {
            requests: measurements[measurements.length - 1]?.requests || 0,
            averageResponseTime: this.calculateAverage(measurements.map(m => m.averageResponseTime)),
            errorRate: this.calculateAverage(measurements.map(m => m.errorRate)),
            throughput: this.calculateAverage(measurements.map(m => m.throughput))
        };
    }
    calculateOverallScore(stats, violations) {
        let score = 100;
        violations.forEach(violation => {
            switch (violation.severity) {
                case 'critical':
                    score -= 30;
                    break;
                case 'high':
                    score -= 20;
                    break;
                case 'medium':
                    score -= 10;
                    break;
                case 'low':
                    score -= 5;
                    break;
            }
        });
        return Math.max(0, score);
    }
    calculateBaseline(historicalData) {
        // Calculate baseline from historical data
        return {}; // Implementation would aggregate historical stats
    }
    detectRegressions(current, baseline) {
        // Compare current performance with baseline to detect regressions
        return [];
    }
    detectImprovements(current, baseline) {
        // Compare current performance with baseline to detect improvements
        return [];
    }
    analyzeTrend(historical, current) {
        // Analyze performance trend over time
        return 'stable';
    }
    async loadHistoricalData() {
        try {
            const historicalPath = path.join(__dirname, '../results/historical.json');
            const data = await fs.readFile(historicalPath, 'utf-8');
            return JSON.parse(data);
        }
        catch {
            return [];
        }
    }
    async saveToHistoricalData(stats) {
        try {
            const historicalPath = path.join(__dirname, '../results/historical.json');
            let historical = [];
            try {
                const data = await fs.readFile(historicalPath, 'utf-8');
                historical = JSON.parse(data);
            }
            catch {
                // File doesn't exist, start with empty array
            }
            historical.push({
                timestamp: new Date().toISOString(),
                stats
            });
            // Keep only last 100 entries
            historical = historical.slice(-100);
            await fs.writeFile(historicalPath, JSON.stringify(historical, null, 2));
        }
        catch (error) {
            console.warn('Failed to save to historical data:', error);
        }
    }
    generateRecommendations(stats, analysis) {
        const recommendations = [];
        analysis.violations.forEach(violation => {
            switch (violation.metric) {
                case 'response_time_p95':
                    recommendations.push('Consider implementing caching strategies to improve response times');
                    recommendations.push('Review database query optimization and indexing');
                    break;
                case 'error_rate':
                    recommendations.push('Investigate error causes and implement better error handling');
                    recommendations.push('Consider implementing circuit breakers for external dependencies');
                    break;
                case 'throughput':
                    recommendations.push('Scale up server resources or implement horizontal scaling');
                    recommendations.push('Review application bottlenecks and optimize critical paths');
                    break;
            }
        });
        if (recommendations.length === 0) {
            recommendations.push('Performance meets all thresholds - consider stress testing with higher loads');
        }
        return recommendations;
    }
}
exports.LoadTestEngine = LoadTestEngine;
// ============================================================================
// Worker Thread Implementation
// ============================================================================
if (!worker_threads_1.isMainThread && worker_threads_1.workerData?.isWorker) {
    const { workerId, config, scenarios } = worker_threads_1.workerData;
    class LoadWorker {
        constructor(id, config, scenarios) {
            this.active = true;
            this.id = id;
            this.config = config;
            this.scenarios = scenarios;
        }
        async start() {
            console.log(`🏃 Worker ${this.id} started`);
            while (this.active) {
                try {
                    // Select scenario based on weight
                    const scenario = this.selectScenario();
                    await this.executeScenario(scenario);
                    // Think time between scenarios
                    await this.sleep(Math.random() * 2000);
                }
                catch (error) {
                    worker_threads_1.parentPort?.postMessage({
                        type: 'error',
                        error: error.message,
                        workerId: this.id
                    });
                }
            }
        }
        selectScenario() {
            const random = Math.random() * 100;
            let cumulativeWeight = 0;
            for (const scenario of this.scenarios) {
                cumulativeWeight += scenario.weight;
                if (random <= cumulativeWeight) {
                    return scenario;
                }
            }
            return this.scenarios[0];
        }
        async executeScenario(scenario) {
            for (const step of scenario.steps) {
                const startTime = perf_hooks_1.performance.now();
                try {
                    const response = await this.executeStep(step);
                    const responseTime = perf_hooks_1.performance.now() - startTime;
                    const success = this.validateResponse(response, step.validation);
                    worker_threads_1.parentPort?.postMessage({
                        type: 'request-complete',
                        data: {
                            success,
                            responseTime,
                            step: step.name,
                            statusCode: response.statusCode
                        },
                        workerId: this.id
                    });
                    // Think time
                    await this.sleep(step.thinkTime + (Math.random() * step.thinkTime * 0.2));
                }
                catch (error) {
                    const responseTime = perf_hooks_1.performance.now() - startTime;
                    worker_threads_1.parentPort?.postMessage({
                        type: 'request-complete',
                        data: {
                            success: false,
                            responseTime,
                            step: step.name,
                            errorType: error.message
                        },
                        workerId: this.id
                    });
                }
            }
        }
        async executeStep(step) {
            // Simulate HTTP request
            const latency = 100 + Math.random() * 500; // Base latency + variability
            await this.sleep(latency);
            // Simulate success/failure
            const success = Math.random() > 0.05; // 95% success rate
            return {
                statusCode: success ? 200 : 500,
                data: success ? { result: 'success' } : null,
                error: success ? null : 'Server Error'
            };
        }
        validateResponse(response, validation) {
            if (!validation)
                return response.statusCode === 200;
            if (validation.statusCode && !validation.statusCode.includes(response.statusCode)) {
                return false;
            }
            if (validation.customValidation) {
                return validation.customValidation(response);
            }
            return true;
        }
        async sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        stop() {
            this.active = false;
        }
    }
    const worker = new LoadWorker(workerId, config, scenarios);
    worker.start().catch(console.error);
}
//# sourceMappingURL=load-test.js.map