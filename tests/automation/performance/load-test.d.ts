/**
 * Load Testing Framework for jaqEdu Platform
 * Comprehensive load testing with concurrent workflows, metrics collection,
 * and performance regression detection
 */
import { EventEmitter } from 'events';
interface LoadTestConfig {
    name: string;
    description: string;
    maxConcurrentUsers: number;
    testDuration: number;
    rampUpDuration: number;
    rampDownDuration: number;
    targetThroughput: number;
    scenarios: LoadTestScenario[];
    thresholds: PerformanceThresholds;
    endpoints: TestEndpoint[];
}
interface LoadTestScenario {
    name: string;
    weight: number;
    steps: TestStep[];
    userProfile?: UserProfile;
}
interface TestStep {
    name: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    payload?: any;
    headers?: Record<string, string>;
    thinkTime: number;
    validation?: ResponseValidation;
}
interface TestEndpoint {
    path: string;
    baseUrl: string;
    auth?: AuthConfig;
    timeout: number;
}
interface UserProfile {
    type: 'student' | 'instructor' | 'admin' | 'guest';
    preferences?: any;
    behavior?: BehaviorPattern;
}
interface BehaviorPattern {
    sessionLength: number;
    pagesPerSession: number;
    thinkTimeVariation: number;
    errorTolerance: number;
}
interface PerformanceThresholds {
    responseTime: {
        p50: number;
        p95: number;
        p99: number;
        max: number;
    };
    throughput: {
        min: number;
        target: number;
    };
    errorRate: {
        max: number;
        critical: number;
    };
    availability: {
        min: number;
    };
    resourceUsage: {
        cpu: number;
        memory: number;
        disk: number;
    };
}
interface ResponseValidation {
    statusCode?: number[];
    contentType?: string;
    bodyContains?: string[];
    responseSize?: {
        min: number;
        max: number;
    };
    customValidation?: (response: any) => boolean;
}
interface AuthConfig {
    type: 'bearer' | 'basic' | 'apikey';
    credentials: any;
}
interface LoadTestMetrics {
    startTime: Date;
    endTime?: Date;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    responseTimes: number[];
    throughputData: ThroughputDataPoint[];
    errorData: ErrorDataPoint[];
    resourceUsage: ResourceUsagePoint[];
    rampUpMetrics: RampMetrics;
    sustainedLoadMetrics: SustainedLoadMetrics;
    rampDownMetrics: RampMetrics;
}
interface ThroughputDataPoint {
    timestamp: number;
    requestsPerSecond: number;
    activeUsers: number;
}
interface ErrorDataPoint {
    timestamp: number;
    errorRate: number;
    errorType: string;
    statusCode?: number;
    count: number;
}
interface ResourceUsagePoint {
    timestamp: number;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
}
interface RampMetrics {
    duration: number;
    steps: RampStep[];
    averageResponseTime: number;
    errorRate: number;
    success: boolean;
}
interface RampStep {
    step: number;
    users: number;
    duration: number;
    metrics: StepMetrics;
}
interface StepMetrics {
    requests: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
}
interface SustainedLoadMetrics {
    duration: number;
    intervalMetrics: IntervalMetrics[];
    stability: StabilityMetrics;
    averageMetrics: AggregateMetrics;
}
interface IntervalMetrics {
    timestamp: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
    activeUsers: number;
}
interface StabilityMetrics {
    responseTimeVariation: number;
    throughputVariation: number;
    isStable: boolean;
}
interface AggregateMetrics {
    averageResponseTime: number;
    medianResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    averageThroughput: number;
    totalErrors: number;
    overallErrorRate: number;
}
export declare class LoadTestEngine extends EventEmitter {
    private config;
    private workers;
    private metrics;
    private activeExecutions;
    private testStartTime;
    private monitoringInterval;
    constructor(config: LoadTestConfig);
    /**
     * Execute comprehensive load test
     */
    executeLoadTest(): Promise<LoadTestResult>;
    /**
     * Execute ramp up phase
     */
    private executeRampUp;
    /**
     * Execute sustained load phase
     */
    private executeSustainedLoad;
    /**
     * Execute ramp down phase
     */
    private executeRampDown;
    /**
     * Spawn load generation workers
     */
    private spawnWorkers;
    /**
     * Create individual load worker
     */
    private createWorker;
    /**
     * Handle messages from worker threads
     */
    private handleWorkerMessage;
    /**
     * Record request completion metrics
     */
    private recordRequestMetrics;
    /**
     * Monitor test step
     */
    private monitorStep;
    /**
     * Take current measurement
     */
    private takeMeasurement;
    /**
     * Start system monitoring
     */
    private startMonitoring;
    /**
     * Stop system monitoring
     */
    private stopMonitoring;
    /**
     * Capture system resource usage
     */
    private captureResourceUsage;
    /**
     * Get system resource usage
     */
    private getSystemResourceUsage;
    /**
     * Generate comprehensive test results
     */
    private generateResults;
    /**
     * Calculate performance statistics
     */
    private calculatePerformanceStats;
    /**
     * Analyze performance against thresholds
     */
    private analyzeThresholds;
    /**
     * Analyze performance regression
     */
    private analyzeRegression;
    /**
     * Save test results
     */
    private saveResults;
    private initializeMetrics;
    private calculateAverage;
    private calculatePercentile;
    private getCurrentErrorRate;
    private getAverageResponseTime;
    private calculateCurrentThroughput;
    private sleep;
    private stopWorkers;
    private stopAllWorkers;
    private cleanup;
    private recordError;
    private updateWorkerMetrics;
    private captureIntervalMetrics;
    private analyzeStability;
    private calculateVariation;
    private calculateAverageMetrics;
    private aggregateStepMetrics;
    private calculateOverallScore;
    private calculateBaseline;
    private detectRegressions;
    private detectImprovements;
    private analyzeTrend;
    private loadHistoricalData;
    private saveToHistoricalData;
    private generateRecommendations;
}
interface LoadTestResult {
    testInfo: {
        name: string;
        duration: number;
        startTime: Date;
        endTime: Date;
        configuration: LoadTestConfig;
    };
    performanceStats: PerformanceStats;
    thresholdAnalysis: ThresholdAnalysis;
    regressionAnalysis: RegressionAnalysis;
    phaseMetrics: {
        rampUp: RampMetrics;
        sustainedLoad: SustainedLoadMetrics;
        rampDown: RampMetrics;
    };
    rawMetrics: LoadTestMetrics;
    recommendations: string[];
}
interface PerformanceStats {
    responseTime: {
        average: number;
        median: number;
        p95: number;
        p99: number;
        min: number;
        max: number;
    };
    throughput: {
        average: number;
        peak: number;
        total: number;
    };
    errorRate: {
        overall: number;
        peak: number;
    };
    availability: {
        uptime: number;
    };
}
interface ThresholdAnalysis {
    passed: boolean;
    violations: ThresholdViolation[];
    score: number;
}
interface ThresholdViolation {
    metric: string;
    threshold: number;
    actual: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
interface RegressionAnalysis {
    hasBaseline: boolean;
    baseline?: PerformanceStats;
    regressions: any[];
    improvements: any[];
    trend: string;
}
export { LoadTestEngine, LoadTestConfig, LoadTestResult, PerformanceStats };
//# sourceMappingURL=load-test.d.ts.map