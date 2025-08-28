/**
 * Performance Testing Framework for jaqEdu Platform
 * Provides comprehensive performance testing utilities
 */
export interface PerformanceMetrics {
    responseTime: number;
    throughput: number;
    errorRate: number;
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    cpuUsage: {
        user: number;
        system: number;
    };
}
export interface LoadTestConfig {
    concurrent: number;
    requests: number;
    duration?: number;
    rampUp?: number;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    payload?: any;
    headers?: Record<string, string>;
}
export interface LoadTestResult {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    percentiles: {
        p50: number;
        p75: number;
        p90: number;
        p95: number;
        p99: number;
    };
    errors: {
        message: string;
        count: number;
    }[];
}
export declare class PerformanceTester {
    private apiClient;
    private metrics;
    private startTime;
    constructor(baseURL?: string);
    authenticate(role?: 'student' | 'teacher' | 'admin'): Promise<void>;
    startMonitoring(): void;
    recordMetrics(): PerformanceMetrics;
    measureSingleRequest(requestFn: () => Promise<any>): Promise<{
        result: any;
        duration: number;
        memory: number;
    }>;
    runLoadTest(config: LoadTestConfig): Promise<LoadTestResult>;
    runStressTest(config: Omit<LoadTestConfig, 'concurrent'>, maxConcurrent?: number, step?: number): Promise<LoadTestResult[]>;
    measureEndpointPerformance(endpoint: string, samples?: number): Promise<{
        average: number;
        min: number;
        max: number;
        percentiles: {
            p50: number;
            p75: number;
            p90: number;
            p95: number;
            p99: number;
        };
        successRate: number;
    }>;
    testWebSocketPerformance(concurrent?: number, messagesPerConnection?: number): Promise<{
        averageLatency: number;
        maxLatency: number;
        messagesPerSecond: number;
        connectionSuccessRate: number;
    }>;
    runEnduranceTest(endpoint: string, duration?: number): Promise<{
        totalRequests: number;
        averageResponseTime: number;
        errorRate: number;
        memoryLeak: boolean;
        memoryIncrease: number;
    }>;
    generatePerformanceReport(results: LoadTestResult[]): string;
}
export declare const performanceAssertions: {
    expectFastResponse: (duration: number, maxDuration?: number) => void;
    expectHighThroughput: (requestsPerSecond: number, minThroughput?: number) => void;
    expectLowErrorRate: (errorRate: number, maxErrorRate?: number) => void;
    expectStableMemory: (memoryIncrease: number, maxIncrease?: number) => void;
    expectAcceptableLatency: (averageLatency: number, maxLatency?: number) => void;
    expectReliableConnections: (successRate: number, minSuccessRate?: number) => void;
};
export declare const performanceUtils: {
    createTester: (baseURL?: string) => PerformanceTester;
    benchmark: <T>(fn: () => Promise<T>, iterations?: number) => Promise<{
        averageTime: number;
        minTime: number;
        maxTime: number;
        totalTime: number;
        results: T[];
    }>;
};
declare const _default: {
    PerformanceTester: typeof PerformanceTester;
    performanceAssertions: {
        expectFastResponse: (duration: number, maxDuration?: number) => void;
        expectHighThroughput: (requestsPerSecond: number, minThroughput?: number) => void;
        expectLowErrorRate: (errorRate: number, maxErrorRate?: number) => void;
        expectStableMemory: (memoryIncrease: number, maxIncrease?: number) => void;
        expectAcceptableLatency: (averageLatency: number, maxLatency?: number) => void;
        expectReliableConnections: (successRate: number, minSuccessRate?: number) => void;
    };
    performanceUtils: {
        createTester: (baseURL?: string) => PerformanceTester;
        benchmark: <T>(fn: () => Promise<T>, iterations?: number) => Promise<{
            averageTime: number;
            minTime: number;
            maxTime: number;
            totalTime: number;
            results: T[];
        }>;
    };
};
export default _default;
//# sourceMappingURL=performance-test.d.ts.map