/**
 * Chunked Performance Test Runner
 * Breaks down large performance tests into memory-safe chunks
 */
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
export declare class ChunkedPerformanceRunner {
    private config;
    private memoryManager;
    private testRunner;
    private dataFactory;
    private chunkResults;
    constructor(config?: Partial<ChunkedTestConfig>);
    /**
     * Run performance tests in memory-safe chunks
     */
    runChunkedPerformanceTests(): Promise<ChunkedTestSuiteResult>;
    /**
     * Define test chunks with memory and performance considerations
     */
    private defineTestChunks;
    /**
     * Execute a single test chunk with memory monitoring
     */
    private executeChunk;
    private runBasicPerformanceTests;
    private runMemoryPatternTests;
    private runConcurrencyTests;
    private runCachePerformanceTests;
    private runLoadSimulationTests;
    private simulateAPICall;
    private simulateResourceLoad;
    private simulateAuthFlow;
    private simulateMemoryPattern;
    private simulateConcurrentTask;
    private simulateCacheOperations;
    private simulateLoadScenario;
    private performChunkCleanup;
    private performIntermediateCleanup;
    private finalCleanup;
    private executeWithTimeout;
    private generateSuiteResults;
    private generateSummary;
    private generateRecommendations;
    private sleep;
}
/**
 * Main function for Jest integration
 */
export declare function runChunkedPerformanceTestSuite(): Promise<ChunkedTestSuiteResult>;
/**
 * Create optimized chunked runner for Jest
 */
export declare function createOptimizedChunkedRunner(): ChunkedPerformanceRunner;
export { ChunkedPerformanceRunner };
export type { ChunkedTestConfig, TestChunk, ChunkExecutionResult, ChunkedTestSuiteResult, ChunkedTestSummary };
//# sourceMappingURL=chunked-performance-runner.d.ts.map