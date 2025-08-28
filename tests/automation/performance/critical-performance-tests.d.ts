/**
 * Critical Performance Tests - Optimized for Memory Constraints
 * Essential performance tests that run within Jest's memory limitations
 */
export declare class CriticalPerformanceTests {
    private testRunner;
    private dataFactory;
    private memoryManager;
    constructor();
    /**
     * Run all critical performance tests
     */
    runCriticalTests(): Promise<CriticalTestResults>;
    /**
     * Test API response time with minimal data
     */
    private testAPIResponseTime;
    /**
     * Test database query performance with small datasets
     */
    private testDatabaseQueryPerformance;
    /**
     * Test memory usage patterns
     */
    private testMemoryUsagePatterns;
    /**
     * Test concurrent operations with limited concurrency
     */
    private testConcurrentOperations;
    /**
     * Test load handling capacity with controlled load
     */
    private testLoadHandlingCapacity;
    private simulateAPICall;
    private simulateDBQuery;
    private simulateObjectCreation;
    private simulateDataProcessing;
    private simulateCacheUsage;
    private simulateWorkload;
    private simulateLoadLevel;
    private sleep;
    private generateTestSummary;
    private generateRecommendations;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
interface CriticalTestResults {
    results: any;
    summary: CriticalTestSummary;
    resourceUsage: any;
    recommendations: string[];
}
interface CriticalTestSummary {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    successRate: number;
    totalDuration: number;
    maxMemoryUsage: number;
    averageMemoryGrowth: number;
    status: 'PASSED' | 'FAILED';
}
interface APIResponseTestResult {
    testName: string;
    endpoints: EndpointResult[];
    averageResponseTime: number;
    maxResponseTime: number;
    passed: boolean;
}
interface EndpointResult {
    endpoint: string;
    method: string;
    responseTime: number;
    expectedTime: number;
    passed: boolean;
    status: string;
}
interface DatabaseTestResult {
    testName: string;
    queries: QueryResult[];
    averageExecutionTime: number;
    maxExecutionTime: number;
    passed: boolean;
}
interface QueryResult {
    queryName: string;
    executionTime: number;
    expectedTime: number;
    complexity: string;
    passed: boolean;
    rowsProcessed: number;
}
interface MemoryTestResult {
    testName: string;
    scenarios: MemoryScenarioResult[];
    maxMemoryGrowth: number;
    averageMemoryGrowth: number;
    passed: boolean;
}
interface MemoryScenarioResult {
    scenarioName: string;
    duration: number;
    memoryGrowthMB: number;
    peakMemoryMB: number;
    finalMemoryMB: number;
    passed: boolean;
}
interface ConcurrencyTestResult {
    testName: string;
    results: ConcurrencyResult[];
    maxConcurrency: number;
    averageExecutionTime: number;
    passed: boolean;
}
interface ConcurrencyResult {
    concurrencyLevel: number;
    executionTime: number;
    expectedTime: number;
    passed: boolean;
    successRate: number;
}
interface LoadTestResult {
    testName: string;
    results: LoadLevelResult[];
    maxRPS: number;
    averageResponseTime: number;
    passed: boolean;
}
interface LoadLevelResult {
    requestsPerSecond: number;
    testDuration: number;
    actualDuration: number;
    expectedResponseTime: number;
    averageResponseTime: number;
    passed: boolean;
}
/**
 * Run critical performance tests within Jest environment
 */
export declare function runCriticalPerformanceTests(): Promise<CriticalTestResults>;
export { CriticalPerformanceTests };
export type { CriticalTestResults, CriticalTestSummary, APIResponseTestResult, DatabaseTestResult, MemoryTestResult, ConcurrencyTestResult, LoadTestResult };
//# sourceMappingURL=critical-performance-tests.d.ts.map